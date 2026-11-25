import re
import logging
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher

logger = logging.getLogger("cerberus.entity_resolver")

# Lazy load spaCy model for offline-first Named Entity Recognition
_SPACY_NLP = None

def get_spacy_nlp():
    """Initializes or returns cached spaCy English NER pipeline."""
    global _SPACY_NLP
    if _SPACY_NLP is None:
        try:
            import spacy
            _SPACY_NLP = spacy.load("en_core_web_sm")
            logger.info("spaCy en_core_web_sm pipeline loaded successfully.")
        except Exception as e:
            try:
                import en_core_web_sm
                _SPACY_NLP = en_core_web_sm.load()
            except Exception:
                logger.warning(f"Could not load spaCy en_core_web_sm: {e}. Falling back to rule-based patterns.")
                _SPACY_NLP = None
    return _SPACY_NLP

# Mapping spaCy NER labels to Cerberus-X 7 canonical investigative entity types
SPACY_TO_CANONICAL_TYPE = {
    "PERSON": "PERSON",
    "ORG": "ORG",
    "NORP": "ORG",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "FAC": "LOCATION",
    "DATE": "DATE",
    "TIME": "DATE",
    "PRODUCT": "PRODUCT",
    "EVENT": "EVENT",
    "LAW": "EVENT",
    "QUANTITY": "QUANTITY",
    "CARDINAL": "QUANTITY",
    "MONEY": "QUANTITY",
    "PERCENT": "QUANTITY"
}

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
    """
    Extracts entities using spaCy Named Entity Recognition (NER) combined with
    specialized domain regex patterns. Supports arbitrary user-uploaded fields,
    names, organizations, geopolitical entities, dates, products, and quantities.
    """
    if not text or not text.strip():
        return []

    entities = []
    seen = set()

    def add_entity(name: str, etype: str, raw_snippet: str = "", source: str = "spacy_ner"):
        cleaned = name.strip().strip(",.;:()\"'[]{}")
        # Filter out trivial punctuation or single-character noise
        if not cleaned or len(cleaned) < 2:
            return
        # Filter out standalone pure numbers if they have no context or are just page numbers
        if cleaned.isdigit() and len(cleaned) > 8:
            return
        norm = normalize_entity_name(cleaned)
        if not norm:
            return
        key = (norm, etype)
        if key not in seen:
            seen.add(key)
            entities.append({
                "name": cleaned,
                "normalized_name": norm,
                "entity_type": etype,
                "snippet": raw_snippet or cleaned,
                "extraction_source": source
            })

    # 1. Primary: spaCy Named Entity Recognition (NER) Model
    nlp = get_spacy_nlp()
    if nlp:
        try:
            # Process up to 250,000 characters to prevent excessive memory usage
            doc = nlp(text[:250000])
            for ent in doc.ents:
                mapped_type = SPACY_TO_CANONICAL_TYPE.get(ent.label_)
                if mapped_type:
                    # Capture surrounding sentence context
                    sent_snippet = ent.sent.text.strip() if ent.sent else ent.text
                    add_entity(ent.text, mapped_type, sent_snippet, source="spacy_ner")
        except Exception as e:
            logger.error(f"Error during spaCy NER inference: {e}")

    # 2. Domain & Contextual Regex Patterns (Reinforces specific logistics/forensics patterns)
    # Extract Person (e.g. "Dr. Marcus Vance", "Received by: John Doe")
    for pat in PERSON_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            raw = m.group(1) if m.groups() else m.group(0)
            add_entity(raw, "PERSON", m.group(0), source="domain_pattern")

    # Extract Organization (e.g. "Health Ministry", "Central Warehouse Corp")
    for pat in ORG_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "ORG", m.group(0), source="domain_pattern")

    # Extract Location (e.g. "Sector 4 Warehouse", "Regional Hub Alpha")
    for pat in LOCATION_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "LOCATION", m.group(0), source="domain_pattern")

    # Extract Dates (e.g. "March 14, 2026", "2026-03-14")
    for pat in DATE_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "DATE", m.group(0), source="domain_pattern")

    # Extract Products (e.g. "Medical Kits", "PPE Units")
    for pat in PRODUCT_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0).title(), "PRODUCT", m.group(0), source="domain_pattern")

    # Extract Events (e.g. "Operation Alpha", "Shipment #BOL-77312")
    for pat in EVENT_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            add_entity(m.group(0), "EVENT", m.group(0), source="domain_pattern")

    # Extract Quantities (e.g. "1000 kits", "800 units")
    for pat in QUANTITY_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            qty_str = f"{m.group(1)} {m.group(2)}"
            add_entity(qty_str, "QUANTITY", m.group(0), source="domain_pattern")

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
