"""
Language Detection Utility
Detects programming language from file extension.
"""

from typing import Optional

# Extension to language mapping
LANGUAGE_MAP = {
    # Python
    ".py": "python",
    ".pyw": "python",
    ".pyx": "python",
    
    # JavaScript/TypeScript
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    
    # Web
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    
    # Java/JVM
    ".java": "java",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".groovy": "groovy",
    
    # C-family
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".cs": "csharp",
    
    # Ruby
    ".rb": "ruby",
    ".erb": "ruby",
    
    # PHP
    ".php": "php",
    ".phtml": "php",
    
    # Go
    ".go": "go",
    
    # Rust
    ".rs": "rust",
    
    # Swift
    ".swift": "swift",
    
    # Shell
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".fish": "shell",
    ".ps1": "powershell",
    
    # Config/Data
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".ini": "ini",
    ".env": "env",
    
    # SQL
    ".sql": "sql",
    
    # Other
    ".md": "markdown",
    ".dockerfile": "dockerfile",
}


def detect_language(filename: str) -> Optional[str]:
    """
    Detect programming language from filename.
    
    Args:
        filename: The name of the file (with extension)
        
    Returns:
        Language name or None if unknown
    """
    # Handle special filenames
    lower_filename = filename.lower()
    
    if lower_filename == "dockerfile":
        return "dockerfile"
    if lower_filename == "makefile":
        return "makefile"
    if lower_filename.startswith(".env"):
        return "env"
    
    # Get extension
    dot_index = filename.rfind(".")
    if dot_index == -1:
        return None
    
    extension = filename[dot_index:].lower()
    return LANGUAGE_MAP.get(extension)


def get_supported_languages() -> list[str]:
    """Get list of supported languages for scanning."""
    return [
        "python",
        "javascript", 
        "typescript",
        "java",
        "php",
        "ruby",
        "go",
        "csharp",
        "html"
    ]
