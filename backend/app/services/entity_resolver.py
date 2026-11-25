import re
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher

# Known entity classification patterns
PERSON_PATTERNS = [
    r"\b(?:Dr\.|Officer|Inspector|Director|Agent|Chief|Manager|Auditor|Mr\.|Ms\.|Mrs\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b",
    r"\b(?:Signed by|Received by|Dispatched by|Inspected by|Reported by):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b"
]

ORG_PATTERNS = [
    r"\b(?:Ministry\s+of\s+[A-Z][a-z]+|Department\s+of\s+[A-Z][a-z]+|Federal\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Govt\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
    r"\b(?:[A-Z][a-z]+\s+(?:Logistics|Corp|Corporation|Enterprises|Hospital|Warehouse|Reserve|Authority|Bureau|Commission|Agencies))\b",
    r"\b(?:Apex\s+Logistics|Metro\s+General\s+Hospital|Central\s+Warehouse\s+Corp|Health\s+Ministry)\b"
]

LOCATION_PATTERNS = [
    r"\b(?:Sector\s+\d+\s+Warehouse|Port\s+Authority\s+Dock\s+\d+|Central\s+Distribution\s+Facility|Regional\s+Hub\s+[A-Z\d]+|Dock\s+\d+|Bay\s+[A-Z\d]+)\b",
    r"\b(?:Metro\s+City|Capital\s+District|Northern\s+Territory|North\s+County\s+Depot)\b"
]

DATE_PATTERNS = [
    r"\b(?:\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\b",
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b"
]

PRODUCT_PATTERNS = [
    r"\b(?:medical\s+kits?|emergency\s+trauma\s+packs?|diagnostic\s+test\s+kits?|surgical\s+supplies|ppe\s+units?|protective\s+masks?)\b",
    r"\b(?:MedKit-[A-Z0-9]+|TraumaPack-[0-9]+)\b"
]

EVENT_PATTERNS = [
    r"\b(?:Operation\s+[A-Z][a-z]+|Shipment\s+(?:Ref\s+)?#?[A-Z0-9\-]+|Q[1-4]\s+Audit|Relief\s+Initiative\s+\d{4})\b"
]

QUANTITY_PATTERNS = [
    r"\b(\d{1,6}(?:,\d{3})*)\s*(kits?|units?|boxes?|crates?|pallets?|cases?|packs?)\b"
]

ABBREVIATION_MAP = {
    "govt": "government",
    "gov": "government",
    "min": "ministry",
    "dept": "department",
    "hosp": "hospital",
    "log": "logistics",
    "whse": "warehouse",
    "fac": "facility",
    "dr.": "",
    "officer": "",
    "inspector": "",
    "director": "",
}

def normalize_entity_name(name: str) -> str:
    """Normalizes entity names for robust resolution and alias matching."""
    norm = name.strip()
    norm = re.sub(r"[^\w\s]", "", norm).lower()
    tokens = norm.split()
    normalized_tokens = [ABBREVIATION_MAP.get(t, t) for t in tokens if t]
    return " ".join(normalized_tokens)

def compute_similarity(str1: str, str2: str) -> float:
    """Calculates sequence matching similarity ratio between two strings."""
    s1 = normalize_entity_name(str1)
    s2 = normalize_entity_name(str2)
    if s1 == s2:
        return 1.0
    
    # Check token overlap
    tokens1 = set(s1.split())
    tokens2 = set(s2.split())
    if tokens1 and tokens2:
        jaccard = len(tokens1.intersection(tokens2)) / len(tokens1.union(tokens2))
        seq = SequenceMatcher(None, s1, s2).ratio()
        return max(jaccard, seq)
    return SequenceMatcher(None, s1, s2).ratio()

def extract_entities_from_text(text: str) -> List[Dict[str, Any]]:
    """Extracts entities of all 7 specified types from document text."""
    entities = []
    seen = set()

    def add_entity(name: str, etype: str, raw_snippet: str = ""):
        cleaned = name.strip().strip(",.;:()\"'")
        if not cleaned or len(cleaned) < 2:
            return
        norm = normalize_entity_name(cleaned)
        key = (norm, etype)
        if key not in seen:
            seen.add(key)
            entities.append({
                "name": cleaned,
                "normalized_name": norm,
                "entity_type": etype,
                "snippet": raw_snippet
            })

    # Extract Person
    for pat in PERSON_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            raw = m.group(1) if m.groups() else m.group(0)
            add_entity(raw, "PERSON", m.group(0))

    # Extract Organization
    for pat in ORG_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "ORG", m.group(0))

    # Extract Location
    for pat in LOCATION_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "LOCATION", m.group(0))

    # Extract Dates
    for pat in DATE_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "DATE", m.group(0))

    # Extract Products
    for pat in PRODUCT_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0).title(), "PRODUCT", m.group(0))

    # Extract Events
    for pat in EVENT_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "EVENT", m.group(0))

    # Extract Quantities
    for pat in QUANTITY_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            qty_str = f"{m.group(1)} {m.group(2)}"
            add_entity(qty_str, "QUANTITY", m.group(0))

    return entities

def find_duplicate_entities(existing_entities: List[Dict[str, Any]], threshold: float = 0.75) -> List[Tuple[Dict[str, Any], Dict[str, Any], float]]:
    """Identifies potential duplicates for investigator review and merging."""
    duplicates = []
    for i in range(len(existing_entities)):
        for j in range(i + 1, len(existing_entities)):
            e1 = existing_entities[i]
            e2 = existing_entities[j]
            # Must be of compatible type
            if e1["entity_type"] == e2["entity_type"]:
                sim = compute_similarity(e1["name"], e2["name"])
                if sim >= threshold:
                    duplicates.append((e1, e2, round(sim, 2)))
    return duplicates
