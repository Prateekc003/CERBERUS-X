from typing import Dict, Any, List

def evaluate_evidence_reliability(
    evidence_meta: Dict[str, Any],
    file_type: str,
    extracted_text: str,
    adversarial_report: Dict[str, Any],
    has_conflicts: bool,
    conflicts_count: int,
    is_corroborated: bool
) -> Dict[str, Any]:
    """
    Computes an objective, explainable reliability score (0-100) based on
    provenance, metadata completeness, corroboration, and adversarial indicators.
    """
    score = 65.0 # baseline neutral score
    authenticity_indicators: List[str] = []
    risk_factors: List[str] = []
    missing_verification: List[str] = []
    recommended_actions: List[str] = []

    # 1. Metadata completeness & File Structure
    meta = evidence_meta or {}
    has_author = bool(meta.get("author") or meta.get("creator"))
    has_timestamp = bool(meta.get("creationDate") or meta.get("created") or meta.get("modDate"))
    
    if has_author:
        score += 8.0
        authenticity_indicators.append(f"Recorded author/creator in metadata: {meta.get('author') or meta.get('creator')}")
    else:
        score -= 6.0
        risk_factors.append("No author or creator attribution found in file metadata")
        missing_verification.append("Author attribution signature")

    if has_timestamp:
        score += 6.0
        authenticity_indicators.append("Embedded machine timestamp verified")
    else:
        score -= 5.0
        risk_factors.append("Missing cryptographic or filesystem timestamp metadata")
        missing_verification.append("Timestamp audit trail")

    # 2. Modality-specific Provenance Factors
    ft = file_type.lower().replace(".", "")
    text_lower = extracted_text.lower()

    if ft == "pdf":
        if "official" in text_lower or "government" in text_lower or "ministry" in text_lower:
            authenticity_indicators.append("Contains formal institutional seals/headings")
            # But do not assume it's unquestionable truth!
            risk_factors.append("Executive summary reports can contain unverified self-reported assertions without physical dock receipts")
            missing_verification.append("Counter-signature from independent receiving dock auditor")
        score += 5.0

    elif ft in ["jpg", "jpeg", "png"]:
        # Image / Scanned receipt
        if "signature" in text_lower or "signed" in text_lower or "received by" in text_lower:
            score += 12.0
            authenticity_indicators.append("Physical delivery receipt with receiving agent signature/stamp")
        else:
            score -= 5.0
            risk_factors.append("Image lacks clear receiving signature or official stamp")
            missing_verification.append("Sign-off stamp and signature verification")
        
        # Check EXIF
        if "exif" in meta and meta["exif"]:
            score += 5.0
            authenticity_indicators.append("Hardware camera/scanner EXIF metadata intact")
        else:
            risk_factors.append("EXIF metadata stripped or unavailable")

    elif ft in ["xlsx", "xls", "csv"]:
        # Spreadsheet
        score -= 8.0
        risk_factors.append("Spreadsheets are editable local documents with minimal native write-protection or cryptographic audit trail")
        missing_verification.append("Database changelog or immutable ERP transaction log")
        recommended_actions.append("Corroborate spreadsheet row counts against database ERP exports")

    elif ft in ["sqlite", "db", "sql"]:
        # Relational database / SQL dump
        score += 4.0
        authenticity_indicators.append("Relational database schema with structured table constraints")
        risk_factors.append("Local SQLite database lacks cryptographic multi-party sign-off")
        missing_verification.append("Server replication log and transaction commit timestamps")

    elif ft == "json":
        # Structured JSON dataset
        score -= 4.0
        risk_factors.append("JSON datasets are easily modified plain text without built-in digital signatures")
        missing_verification.append("API cryptographic signature (e.g. HMAC or JWT token)")

    elif ft == "docx":
        if meta.get("last_modified_by"):
            authenticity_indicators.append(f"Last modified by identified user: {meta.get('last_modified_by')}")
        else:
            risk_factors.append("Word document does not contain revision audit history")

    # 3. Cross-Document Conflict Impact
    if has_conflicts:
        penalty = min(25.0, conflicts_count * 8.0)
        score -= penalty
        risk_factors.append(f"Contradicted by {conflicts_count} other independent evidence claim(s)")
        recommended_actions.append("Conduct forensic reconciliation on identified quantitative discrepancies")
    else:
        if is_corroborated:
            score += 10.0
            authenticity_indicators.append("Claims corroborated by at least one independent cross-document source")

    # 4. Adversarial Scanning Impact
    if adversarial_report and adversarial_report.get("is_flagged"):
        adv_risk = adversarial_report.get("risk_score", 40.0)
        score -= adv_risk
        for flag in adversarial_report.get("flags", []):
            risk_factors.append(f"ADVERSARIAL ALERT: {flag}")
        recommended_actions.append("Isolate document and conduct manual counter-intelligence inspection")

    # Normalization & Categorization
    score = max(5.0, min(98.0, round(score, 1)))

    if score >= 80.0:
        category = "HIGH"
    elif score >= 60.0:
        category = "MODERATE"
    elif score >= 40.0:
        category = "LOW"
    else:
        category = "SUSPICIOUS"

    provenance_notes = (
        f"Evaluated as {category} reliability ({score}/100). "
        f"{len(authenticity_indicators)} positive indicator(s), {len(risk_factors)} risk factor(s)."
    )

    return {
        "score": score,
        "category": category,
        "provenance_notes": provenance_notes,
        "authenticity_indicators": authenticity_indicators,
        "risk_factors": risk_factors,
        "missing_verification": missing_verification,
        "recommended_actions": recommended_actions
    }
