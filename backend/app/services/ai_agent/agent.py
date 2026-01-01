"""
AI Agent Implementation
The reasoning layer that uses LLMs to explain and fix vulnerabilities.

IMPORTANT: This is a PLUGIN architecture.
- Can swap OpenAI for local models
- Can fine-tune later
- System works WITHOUT AI (just no explanations/fixes)
"""

import json
import hashlib
import time
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AIDecisionLog
from app.services.ai_agent.prompts import SYSTEM_PROMPT, get_fix_prompt


class AIAgentInterface(ABC):
    """
    Abstract interface for AI agents.
    Allows swapping implementations (OpenAI, Local, etc.)
    """
    
    @abstractmethod
    async def generate_fix(
        self,
        vuln_type: str,
        severity: str,
        code_snippet: str,
        context_before: Optional[List[str]] = None,
        context_after: Optional[List[str]] = None,
        rule_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Generate a fix proposal for a vulnerability."""
        pass


class AIAgent(AIAgentInterface):
    """
    AI Agent implementation using OpenAI.
    
    Responsibilities:
    - Receive structured vulnerability data
    - Generate explanations
    - Propose code fixes
    - Output strict JSON format
    """
    
    def __init__(self):
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model
        self._client = None
    
    @property
    def client(self):
        """Lazy load OpenAI client."""
        if self._client is None and self.api_key:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                print("OpenAI package not installed")
                return None
        return self._client
    
    async def generate_fix(
        self,
        vuln_type: str,
        severity: str,
        code_snippet: str,
        context_before: Optional[List[str]] = None,
        context_after: Optional[List[str]] = None,
        rule_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a fix proposal for a vulnerability.
        
        Returns:
            Dict with 'explanation', 'fixed_code', and optionally 'additional_notes'
            or None if generation fails
        """
        if not self.client:
            # Return a basic fix if AI is not available
            return self._generate_fallback_fix(vuln_type, code_snippet)
        
        # Build prompt
        user_prompt = get_fix_prompt(
            vuln_type=vuln_type,
            severity=severity,
            code_snippet=code_snippet,
            context_before=context_before,
            context_after=context_after,
            rule_id=rule_id
        )
        
        try:
            start_time = time.time()
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent output
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Parse response
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Add metadata
            result["_metadata"] = {
                "model": self.model,
                "prompt_hash": hashlib.sha256(user_prompt.encode()).hexdigest(),
                "input_tokens": response.usage.prompt_tokens if response.usage else None,
                "output_tokens": response.usage.completion_tokens if response.usage else None,
                "latency_ms": latency_ms
            }
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            return self._generate_fallback_fix(vuln_type, code_snippet)
        except Exception as e:
            print(f"AI generation failed: {e}")
            return self._generate_fallback_fix(vuln_type, code_snippet)
    
    def _generate_fallback_fix(
        self,
        vuln_type: str,
        code_snippet: str
    ) -> Dict[str, Any]:
        """Generate a basic fallback fix when AI is unavailable."""
        
        explanations = {
            "SQL_INJECTION": "This code is vulnerable to SQL injection because user input is directly incorporated into the SQL query. Use parameterized queries instead.",
            "XSS": "This code is vulnerable to Cross-Site Scripting (XSS) because untrusted data is inserted into the page without proper sanitization.",
            "COMMAND_INJECTION": "This code is vulnerable to command injection because user input can be used to execute arbitrary system commands.",
            "HARDCODED_SECRET": "Hardcoded credentials or API keys should be moved to environment variables or a secure secret management system.",
            "INSECURE_DESERIALIZATION": "This deserialization method can execute arbitrary code. Use safe alternatives.",
            "INSECURE_CONFIG": "This configuration may expose security vulnerabilities. Review and apply security best practices.",
            "WEAK_CRYPTO": "This cryptographic algorithm is considered weak. Use modern, secure alternatives.",
            "PATH_TRAVERSAL": "This code may allow path traversal attacks. Validate and sanitize file paths.",
            "MISSING_AUTH": "Authentication appears to be missing or improperly implemented."
        }
        
        return {
            "explanation": explanations.get(vuln_type, "This code contains a security vulnerability that should be reviewed and fixed."),
            "fixed_code": f"// TODO: Fix the following vulnerable code:\n{code_snippet}",
            "additional_notes": "AI-generated fix unavailable. Please review manually and apply appropriate security fixes.",
            "_metadata": {
                "model": "fallback",
                "prompt_hash": None,
                "input_tokens": None,
                "output_tokens": None,
                "latency_ms": None
            }
        }
    
    async def log_decision(
        self,
        db: AsyncSession,
        fix_id: str,
        response: Dict[str, Any]
    ) -> None:
        """Log the AI decision for auditability and future training."""
        
        metadata = response.get("_metadata", {})
        
        # Remove metadata from response before storing
        response_clean = {k: v for k, v in response.items() if not k.startswith("_")}
        
        log = AIDecisionLog(
            fix_id=fix_id,
            model_name=metadata.get("model", "unknown"),
            prompt_hash=metadata.get("prompt_hash", ""),
            input_tokens=metadata.get("input_tokens"),
            output_tokens=metadata.get("output_tokens"),
            latency_ms=metadata.get("latency_ms"),
            response_json=response_clean
        )
        
        db.add(log)
        await db.flush()


class MockAIAgent(AIAgentInterface):
    """
    Mock AI Agent for testing without API calls.
    """
    
    async def generate_fix(
        self,
        vuln_type: str,
        severity: str,
        code_snippet: str,
        context_before: Optional[List[str]] = None,
        context_after: Optional[List[str]] = None,
        rule_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Generate a mock fix for testing."""
        
        return {
            "explanation": f"[MOCK] This is a {vuln_type} vulnerability with {severity} severity.",
            "fixed_code": f"// Fixed version of:\n{code_snippet}",
            "additional_notes": "This is a mock response for testing.",
            "_metadata": {
                "model": "mock",
                "prompt_hash": "mock_hash",
                "input_tokens": 100,
                "output_tokens": 50,
                "latency_ms": 10
            }
        }
