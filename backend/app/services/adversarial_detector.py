import re
from typing import Dict, Any, List

# Patterns targeting prompt injection, jailbreaks, instruction overrides inside files
INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions", "Instruction override attempt"),
    (r"disregard\s+(all\s+)?(previous|prior|conflicts|contradictions)", "Constraint suppression attempt"),
    (r"system\s*prompt\s*:", "Direct system prompt spoofing"),
    (r"you\s+are\s+now\s+(an\s+unrestricted|in\s+DAN\s+mode|a\s+different\s+assistant)", "Persona hijack attempt"),
    (r"do\s+not\s+(detect|flag|report)\s+(any\s+)?(contradictions|conflicts|errors)", "Audit evasion instruction"),
    (r"always\s+(state|confirm|verify)\s+that\s+all\s+\d+\s+items\s+were\s+delivered", "Evidence fabrication directive"),
    (r"<\s*script[^>]*>", "Embedded executable markup"),
    (r"javascript\s*:", "Executable URI scheme"),
    (r"eval\s*\(", "Code evaluation payload"),
    (r"base64\s*,\s*[A-Za-z0-9+/=]{40,}", "Suspicious obfuscated payload"),
    (r"\[\s*admin\s*override\s*\]", "Administrative bypass header spoof"),
]

SUSPICIOUS_METADATA_PATTERNS = [
    (r"photoshop|gimp|canva|pixelmator", "Altered graphic/image tool signature"),
    (r"anonymous|unknown|user\d+", "Obfuscated document author"),
]

def scan_text_adversarial(text: str, filename: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Scans document text and metadata for adversarial manipulation, prompt injection,
    and security hazards.
    """
    if not text:
        text = ""

    flags: List[str] = []
    suspicious_snippets: List[str] = []
    risk_score = 0.0

    # 1. Prompt Injection Checks
    for pattern, description in INJECTION_PATTERNS:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for m in matches:
            flags.append(f"Prompt Injection Flag: {description}")
            start = max(0, m.start() - 30)
            end = min(len(text), m.end() + 30)
            suspicious_snippets.append(text[start:end].strip())
            risk_score += 35.0

    # 2. Hidden text checks (zero-width characters, excessive unprintable unicode)
    zero_width_chars = len(re.findall(r"[\u200B-\u200D\uFEFF]", text))
    if zero_width_chars > 3:
        flags.append(f"Hidden Data Flag: {zero_width_chars} zero-width unicode characters detected")
        risk_score += 25.0

    # 3. Excessive repetitive whitespace/padding designed to hide context
    if re.search(r"\n{10,}", text):
        flags.append("Formatting Anomaly: Massive whitespace padding (possible hidden text payload)")
        risk_score += 15.0

    # 4. Metadata verification
    if metadata:
        meta_str = str(metadata).lower()
        for pattern, desc in SUSPICIOUS_METADATA_PATTERNS:
            if re.search(pattern, meta_str):
                flags.append(f"Metadata Anomaly: {desc}")
                risk_score += 20.0

    # Cap risk score
    risk_score = min(100.0, risk_score)
    is_flagged = risk_score >= 30.0 or len(flags) > 0

    return {
        "is_flagged": is_flagged,
        "risk_score": round(risk_score, 1),
        "flags": flags,
        "flag_count": len(flags),
        "suspicious_snippets": suspicious_snippets[:5],
        "safe_to_process": True, # Still extractable, but marked as adversarial
        "disclaimer": "This document content has been sanitized and isolated. Instructions inside evidence are never executed by Cerberus-X."
    }
