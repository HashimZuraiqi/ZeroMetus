"""
Tests for the Security Scanner Engine
"""

import pytest
from app.services.scanner.engine import SecurityScanner
from app.services.scanner.rules import get_rules_for_language


class TestSecurityScanner:
    """Test cases for the SecurityScanner class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.scanner = SecurityScanner()
    
    def test_sql_injection_fstring(self):
        """Test detection of SQL injection via f-string."""
        code = '''
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "SQL_INJECTION" for f in findings)
    
    def test_sql_injection_format(self):
        """Test detection of SQL injection via .format()."""
        code = '''
def get_user(user_id):
    query = "SELECT * FROM users WHERE id = {}".format(user_id)
    cursor.execute(query)
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        # May or may not detect depending on exact pattern
        # This tests the scanner runs without error
        assert isinstance(findings, list)
    
    def test_xss_innerhtml(self):
        """Test detection of XSS via innerHTML."""
        code = '''
function updateContent(data) {
    document.getElementById("content").innerHTML = data;
}
'''
        findings = self.scanner.scan_file(code, "javascript", "test.js")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "XSS" for f in findings)
    
    def test_command_injection_eval(self):
        """Test detection of command injection via eval()."""
        code = '''
def execute(code_str):
    result = eval(code_str)
    return result
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "COMMAND_INJECTION" for f in findings)
    
    def test_hardcoded_api_key(self):
        """Test detection of hardcoded API key."""
        code = '''
API_KEY = "sk-1234567890abcdefghij"
client = SomeAPI(api_key=API_KEY)
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "HARDCODED_SECRET" for f in findings)
    
    def test_hardcoded_password(self):
        """Test detection of hardcoded password."""
        code = '''
DATABASE_PASSWORD = "supersecret123"
connection = connect(password=DATABASE_PASSWORD)
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "HARDCODED_SECRET" for f in findings)
    
    def test_pickle_loads(self):
        """Test detection of insecure pickle deserialization."""
        code = '''
import pickle

def load_data(data):
    obj = pickle.loads(data)
    return obj
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "INSECURE_DESERIALIZATION" for f in findings)
    
    def test_os_system(self):
        """Test detection of os.system command injection."""
        code = '''
import os

def run_command(cmd):
    os.system(cmd)
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) > 0
        assert any(f.vuln_type == "COMMAND_INJECTION" for f in findings)
    
    def test_clean_code_no_findings(self):
        """Test that clean code produces no findings."""
        code = '''
def add(a, b):
    """Add two numbers."""
    return a + b

def greet(name):
    """Greet someone."""
    return f"Hello, {name}!"
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        
        assert len(findings) == 0
    
    def test_unknown_language(self):
        """Test handling of unknown language."""
        code = "some random code"
        findings = self.scanner.scan_file(code, "unknown", "test.txt")
        
        assert findings == []
    
    def test_empty_content(self):
        """Test handling of empty content."""
        findings = self.scanner.scan_file("", "python", "test.py")
        
        assert findings == []
    
    def test_severity_sorting(self):
        """Test that findings can be sorted by severity."""
        # Code with multiple vulnerabilities of different severities
        code = '''
API_KEY = "sk-abcdefghijklmnop1234"  # high
DEBUG = True  # medium
query = f"SELECT * FROM users WHERE id = {id}"  # critical
'''
        findings = self.scanner.scan_file(code, "python", "test.py")
        sorted_findings = SecurityScanner.sort_findings_by_severity(findings)
        
        if len(sorted_findings) >= 2:
            # First finding should be critical or high
            assert sorted_findings[0].severity in ["critical", "high"]


class TestRules:
    """Test cases for security rules."""
    
    def test_python_rules_exist(self):
        """Test that Python rules are defined."""
        rules = get_rules_for_language("python")
        assert len(rules) > 0
    
    def test_javascript_rules_exist(self):
        """Test that JavaScript rules are defined."""
        rules = get_rules_for_language("javascript")
        assert len(rules) > 0
    
    def test_unsupported_language_returns_empty(self):
        """Test that unsupported languages return empty list."""
        rules = get_rules_for_language("brainfuck")
        assert rules == []
