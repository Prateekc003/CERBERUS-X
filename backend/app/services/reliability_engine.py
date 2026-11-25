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
    provenance, metadata completeness, corroboration, and tamper indicators.
    """
    score = 65.0  # baseline neutral score
    authenticity_indicators: List[str] = []
    risk_factors: List[str] = []
    missing_verification: List[str] = []
    recommended_actions: List[str] = []

    # 1. Metadata completeness & File Structure
    meta = evidence_meta or {}
    raw_author = str(meta.get("author") or meta.get("creator") or "").strip()
    is_real_author = bool(raw_author) and raw_author.lower() not in [
        "(anonymous)", "anonymous", "unknown", "n/a", "none", "null", "undefined"
    ]

    if is_real_author:
        score += 8.0
        authenticity_indicators.append(f"Document author identified: {raw_author}")
    else:
        score -= 6.0
        risk_factors.append("Missing verified author attribution in metadata")
        missing_verification.append("Verified author signature")

    has_timestamp = bool(meta.get("creationDate") or meta.get("created") or meta.get("modDate"))
    if has_timestamp:
        score += 6.0
        authenticity_indicators.append("Creation timestamp verified in file headers")
    else:
        score -= 5.0
        risk_factors.append("Missing creation timestamp metadata")
        missing_verification.append("Timestamp audit trail")

    # 2. Modality-specific Provenance Factors
    ft = file_type.lower().replace(".", "")
    text_lower = extracted_text.lower()

    if ft == "pdf":
        if any(w in text_lower for w in ["official", "government", "ministry", "department"]):
            authenticity_indicators.append("Contains official institutional letterhead")
            risk_factors.append("Self-reported executive assertions without physical receiving dock sign-off")
            missing_verification.append("Dock auditor counter-signature")
        score += 5.0

    elif ft in ["jpg", "jpeg", "png", "webp"]:
        if any(w in text_lower for w in ["signature", "signed", "received by", "carrier"]):
            score += 12.0
            authenticity_indicators.append("Physical intake slip with signed receiving agent confirmation")
        else:
            score -= 5.0
            risk_factors.append("Scanned image lacks physical signature or official receiving stamp")
            missing_verification.append("Sign-off stamp and signature verification")

        if "exif" in meta and meta["exif"]:
            score += 5.0
            authenticity_indicators.append("Hardware scanner EXIF capture metadata verified")
        else:
            risk_factors.append("Scanner/camera EXIF capture metadata unavailable")

    elif ft in ["xlsx", "xls", "csv"]:
        score -= 8.0
        risk_factors.append("Spreadsheets are editable local files lacking tamper-evident audit trails")
        missing_verification.append("ERP transactional log or cryptographic export certificate")
        recommended_actions.append("Reconcile spreadsheet entries against primary transactional databases")

    elif ft in ["sqlite", "db", "sql"]:
        score += 4.0
        authenticity_indicators.append("Relational database schema with structured table constraints")
        risk_factors.append("Local database file lacks multi-party cryptographic signature")
        missing_verification.append("Database replication log or signed backup manifest")

    elif ft == "json":
        score -= 4.0
        risk_factors.append("JSON dataset lacks embedded digital signature")
        missing_verification.append("Cryptographic API signing certificate")

    elif ft == "docx":
        if meta.get("last_modified_by"):
            authenticity_indicators.append(f"Last modified by identified user: {meta.get('last_modified_by')}")
        else:
            risk_factors.append("Document lacks internal revision history")

    # 3. Cross-Document Conflict Impact
    if has_conflicts:
        penalty = min(25.0, conflicts_count * 8.0)
        score -= penalty
        if conflicts_count == 1:
            risk_factors.append("Directly contradicts 1 claim in another case document")
        else:
            risk_factors.append(f"Directly contradicts {conflicts_count} claims in other case documents")
        recommended_actions.append("Investigate physical custody variance across custody handoffs")
    else:
        if is_corroborated:
            score += 10.0
            authenticity_indicators.append("Corroborated by independent cross-document records")

    # 4. Adversarial Scanning Impact
    if adversarial_report and adversarial_report.get("is_flagged"):
        adv_risk = adversarial_report.get("risk_score", 40.0)
        score -= adv_risk
        for flag in adversarial_report.get("flags", []):
            clean_flag = flag.replace("Metadata Anomaly: ", "")
            risk_factors.append(f"Security anomaly: {clean_flag}")
        recommended_actions.append("Isolate document and review metadata origins")

    # Normalization & Categorization
    score = max(5.0, min(98.0, round(score, 1)))

    if score >= 80.0:
        category = "HIGH"
        provenance_notes = "High-confidence record with verified provenance and corroboration."
    elif score >= 60.0:
        category = "MODERATE"
        provenance_notes = "Structured record with verified metadata; secondary verification recommended."
    elif score >= 40.0:
        category = "LOW"
        provenance_notes = "Contains discrepancies when compared against independent dock records."
    else:
        category = "SUSPICIOUS"
        provenance_notes = "Unverified assertions with conflicting counts and missing custody audit trail."

    return {
        "score": score,
        "category": category,
        "provenance_notes": provenance_notes,
        "authenticity_indicators": authenticity_indicators,
        "risk_factors": risk_factors,
        "missing_verification": missing_verification,
        "recommended_actions": recommended_actions,
    }
