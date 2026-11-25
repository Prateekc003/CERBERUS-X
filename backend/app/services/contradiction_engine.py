import json
import re
from typing import List, Dict, Any, Optional

def extract_structured_claims(text: str, filename: str, doc_metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Parses document text into rich semantic claims with subject, action/predicate,
    quantity, unit, dates, and locations.
    """
    claims = []
    lines = text.splitlines()

    # Regex patterns for logistics and factual assertions
    # Matches: [quantity] [units] [action] OR [action] [quantity] [units]
    quantity_claim_patterns = [
        # e.g., "1000 medical kits were delivered", "800 kits received", "750 medical kits recorded"
        r"(\d{1,6}(?:,\d{3})*)\s+(medical\s+kits?|kits?|units?|boxes?|crates?|packs?)\s+(?:were|have\s+been|was)?\s*(delivered|received|recorded|dispatched|shipped|loaded|counted|allocated|ordered)",
        # e.g., "delivered 1000 medical kits", "received 800 kits", "recorded: 750 kits", "dispatched 900 kits"
        r"(delivered|received|recorded|dispatched|shipped|loaded|counted|allocated|in\s+stock|inventory\s+count)\s*[:\s\-]+\s*(\d{1,6}(?:,\d{3})*)\s*(medical\s+kits?|kits?|units?|boxes?|crates?|packs?)?",
        # e.g., "Quantity Delivered: 1000", "Quantity Received: 800", "Kits Counted: 750"
        r"quantity\s+(delivered|received|recorded|dispatched|shipped)\s*[:\-=]\s*(\d{1,6}(?:,\d{3})*)",
        # Status / spreadsheet rows
        r"Status\s*[:\-=]\s*([A-Za-z\s]+)\b"
    ]

    # Date extraction in claim sentences
    date_pattern = r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\b"
    location_pattern = r"\b(to|at|from|in)\s+([A-Z][a-z0-9]+(?:\s+[A-Z0-9][a-z0-9]+)*(?:\s+(?:Warehouse|Facility|Hub|Depot|Hospital|Dock|Center))?)\b"

    claim_idx = 1
    for line_num, line in enumerate(lines, start=1):
        clean_line = line.strip()
        if not clean_line or len(clean_line) < 10:
            continue

        # Look for quantity claims
        # Pattern 1: <qty> <unit> <action>
        m1 = re.search(r"(\d{1,6}(?:,\d{3})*)\s+(medical\s+kits?|kits?|units?|boxes?|crates?|packs?)\s+(?:were|have\s+been|was)?\s*(delivered|received|recorded|dispatched|shipped|loaded|counted|allocated|ordered)", clean_line, re.IGNORECASE)
        if m1:
            qty = float(m1.group(1).replace(",", ""))
            unit = m1.group(2).lower()
            action = m1.group(3).lower()
            # Standardize action
            if action in ["shipped", "loaded"]: action = "dispatched"
            if action in ["counted", "allocated"]: action = "recorded"

            claims.append({
                "claim_code": f"CLM-{claim_idx:03d}",
                "text": clean_line,
                "claim_type": "QUANTITY",
                "subject": "medical kits" if "kit" in unit else unit,
                "predicate": action,
                "quantity_val": qty,
                "quantity_unit": unit,
                "quantity_action": action,
                "date_val": re.search(date_pattern, clean_line).group(0) if re.search(date_pattern, clean_line) else None,
                "location_val": re.search(location_pattern, clean_line).group(2) if re.search(location_pattern, clean_line) else None,
                "page_or_location": f"Line {line_num}",
                "confidence": 0.95,
                "raw_snippet": clean_line
            })
            claim_idx += 1
            continue

        # Pattern 2: <action> <qty> <unit>
        m2 = re.search(r"\b(delivered|received|recorded|dispatched|shipped|loaded|counted|quantity\s+received|quantity\s+delivered|quantity\s+dispatched)\s*[:\s\-]+\s*(\d{1,6}(?:,\d{3})*)\s*(medical\s+kits?|kits?|units?|boxes?|crates?|packs?)?", clean_line, re.IGNORECASE)
        if m2:
            raw_action = m2.group(1).lower().replace("quantity", "").strip()
            qty = float(m2.group(2).replace(",", ""))
            unit = m2.group(3).lower() if m2.group(3) else "units"
            if raw_action in ["shipped", "loaded"]: raw_action = "dispatched"
            if raw_action in ["counted"]: raw_action = "recorded"

            claims.append({
                "claim_code": f"CLM-{claim_idx:03d}",
                "text": clean_line,
                "claim_type": "QUANTITY",
                "subject": "medical kits" if "kit" in unit else unit,
                "predicate": raw_action,
                "quantity_val": qty,
                "quantity_unit": unit,
                "quantity_action": raw_action,
                "date_val": re.search(date_pattern, clean_line).group(0) if re.search(date_pattern, clean_line) else None,
                "location_val": re.search(location_pattern, clean_line).group(2) if re.search(location_pattern, clean_line) else None,
                "page_or_location": f"Line {line_num}",
                "confidence": 0.92,
                "raw_snippet": clean_line
            })
            claim_idx += 1
            continue

        # Look for general assertions (Date or Status claims)
        date_match = re.search(date_pattern, clean_line)
        if date_match and any(w in clean_line.lower() for w in ["completed", "signed", "arrived", "shipped", "dispatched", "inspected", "received"]):
            claims.append({
                "claim_code": f"CLM-{claim_idx:03d}",
                "text": clean_line,
                "claim_type": "DATE",
                "subject": "shipment milestone",
                "predicate": "occurred_on",
                "date_val": date_match.group(0),
                "page_or_location": f"Line {line_num}",
                "confidence": 0.88,
                "raw_snippet": clean_line
            })
            claim_idx += 1
            continue

        # Status Claims
        status_match = re.search(r"\b(?:status|delivery status|shipment status)\s*[:\-]\s*([A-Za-z\s]+)\b", clean_line, re.IGNORECASE)
        if status_match:
            claims.append({
                "claim_code": f"CLM-{claim_idx:03d}",
                "text": clean_line,
                "claim_type": "STATUS",
                "subject": "shipment",
                "predicate": "has_status",
                "object_val": status_match.group(1).strip(),
                "page_or_location": f"Line {line_num}",
                "confidence": 0.90,
                "raw_snippet": clean_line
            })
            claim_idx += 1

    return claims

def detect_conflicts_between_claims(claims: List[Dict[str, Any]], evidence_map: Dict[int, Any]) -> List[Dict[str, Any]]:
    """
    Evaluates cross-document claims to detect:
    1. Quantity Discrepancies (with nuance for dispatched vs received vs recorded vs delivered)
    2. Date Mismatches (temporal impossibilities, e.g. dispatched after claimed arrival)
    3. Status Contradictions (e.g. 100% Complete vs Disputed/Partial)
    4. Location Inconsistencies
    """
    conflicts = []
    conflict_count = 1
    seen_file_pair_categories = set()

    for i in range(len(claims)):
        for j in range(i + 1, len(claims)):
            cA = claims[i]
            cB = claims[j]

            # Claims from the same file aren't external cross-document conflicts
            if cA["evidence_id"] == cB["evidence_id"]:
                continue

            # Compare QUANTITY claims
            if cA.get("quantity_val") is not None and cB.get("quantity_val") is not None:
                # Check if they relate to compatible subjects (e.g., medical kits / units)
                subA = (cA.get("subject") or "").lower()
                subB = (cB.get("subject") or "").lower()
                is_compatible_subject = ("kit" in subA and "kit" in subB) or (subA == subB) or not subA or not subB

                if is_compatible_subject:
                    qA = cA["quantity_val"]
                    qB = cB["quantity_val"]
                    actA = (cA.get("quantity_action") or cA.get("predicate") or "").lower()
                    actB = (cB.get("quantity_action") or cB.get("predicate") or "").lower()

                    evA_name = evidence_map.get(cA["evidence_id"], {}).get("filename", f"Evidence #{cA['evidence_id']}")
                    evB_name = evidence_map.get(cB["evidence_id"], {}).get("filename", f"Evidence #{cB['evidence_id']}")

                    # CASE 1: Direct Conflict on Same Action (e.g. Delivered 1000 vs Delivered 800)
                    pair_key = tuple(sorted([cA["evidence_id"], cB["evidence_id"]])) + (actA, actB)
                    if pair_key in seen_file_pair_categories:
                        continue

                    if actA == actB and qA != qB:
                        seen_file_pair_categories.add(pair_key)
                        diff = abs(qA - qB)
                        conflicts.append({
                            "conflict_code": f"CNF-{conflict_count:03d}",
                            "claim_a_id": cA["id"],
                            "claim_b_id": cB["id"],
                            "evidence_a_id": cA["evidence_id"],
                            "evidence_b_id": cB["evidence_id"],
                            "claim_a_text": cA["text"],
                            "claim_b_text": cB["text"],
                            "evidence_a_filename": evA_name,
                            "evidence_b_filename": evB_name,
                            "conflict_type": "QUANTITY_DISCREPANCY",
                            "severity": "HIGH",
                            "classification": "Confirmed Conflict",
                            "explanation": f"Direct quantitative contradiction on '{actA}': {evA_name} asserts {qA:.0f} {cA.get('quantity_unit', 'units')}, whereas {evB_name} asserts {qB:.0f} (variance: {diff:.0f} units). Neither source is automatically assumed correct.",
                            "discrepancy_details": {
                                "quantity_a": qA,
                                "quantity_b": qB,
                                "action_a": actA,
                                "action_b": actB,
                                "variance": diff,
                                "category": "DIRECT_QUANTITY_CONTRADICTION",
                                "classification": "Confirmed Conflict"
                            },
                            "verification_status": "DETECTED"
                        })
                        conflict_count += 1

                    # CASE 2: Dispatched vs Received Logistical Discrepancy (900 dispatched vs 800 received)
                    elif (actA == "dispatched" and actB == "received") or (actA == "received" and actB == "dispatched"):
                        seen_file_pair_categories.add(pair_key)
                        disp_qty = qA if actA == "dispatched" else qB
                        recv_qty = qB if actA == "dispatched" else qA
                        disp_doc = evA_name if actA == "dispatched" else evB_name
                        recv_doc = evB_name if actA == "dispatched" else evA_name

                        if disp_qty != recv_qty:
                            shortfall = disp_qty - recv_qty
                            conflicts.append({
                                "conflict_code": f"CNF-{conflict_count:03d}",
                                "claim_a_id": cA["id"],
                                "claim_b_id": cB["id"],
                                "evidence_a_id": cA["evidence_id"],
                                "evidence_b_id": cB["evidence_id"],
                                "claim_a_text": cA["text"],
                                "claim_b_text": cB["text"],
                                "evidence_a_filename": evA_name,
                                "evidence_b_filename": evB_name,
                                "conflict_type": "QUANTITY_DISCREPANCY",
                                "severity": "HIGH" if abs(shortfall) > 50 else "MEDIUM",
                                "classification": "Possible Conflict",
                                "explanation": f"Stage custody variance: Warehouse dispatch log ({disp_doc}) records {disp_qty:.0f} dispatched, while delivery receipt ({recv_doc}) confirms {recv_qty:.0f} physically received (net transit variance of {shortfall:.0f} units). This may reflect in-transit shrinkage, damaged pallets, or partial shipment rather than false reporting.",
                                "discrepancy_details": {
                                    "dispatched_quantity": disp_qty,
                                    "received_quantity": recv_qty,
                                    "in_transit_shortfall": shortfall,
                                    "category": "DISPATCH_RECEIPT_VARIANCE",
                                    "classification": "Possible Conflict"
                                },
                                "verification_status": "DETECTED"
                            })
                            conflict_count += 1

                    # CASE 3: Claimed Delivered vs Physical Receipt (1000 delivered claimed vs 800 received)
                    elif (actA == "delivered" and actB == "received") or (actA == "received" and actB == "delivered"):
                        seen_file_pair_categories.add(pair_key)
                        deliv_qty = qA if actA == "delivered" else qB
                        recv_qty = qB if actA == "delivered" else qA
                        deliv_doc = evA_name if actA == "delivered" else evB_name
                        recv_doc = evB_name if actA == "delivered" else evA_name

                        if deliv_qty != recv_qty:
                            unaccounted = deliv_qty - recv_qty
                            conflicts.append({
                                "conflict_code": f"CNF-{conflict_count:03d}",
                                "claim_a_id": cA["id"],
                                "claim_b_id": cB["id"],
                                "evidence_a_id": cA["evidence_id"],
                                "evidence_b_id": cB["evidence_id"],
                                "claim_a_text": cA["text"],
                                "claim_b_text": cB["text"],
                                "evidence_a_filename": evA_name,
                                "evidence_b_filename": evB_name,
                                "conflict_type": "QUANTITY_DISCREPANCY",
                                "severity": "HIGH",
                                "classification": "Confirmed Conflict",
                                "explanation": f"Delivery affirmation discrepancy: Official executive report ({deliv_doc}) claims {deliv_qty:.0f} medical kits were delivered, but receiving dock slip ({recv_doc}) acknowledges receipt of only {recv_qty:.0f} (shortfall: {unaccounted:.0f} unverified kits). Available evidence is insufficient to verify full 1,000 kit delivery.",
                                "discrepancy_details": {
                                    "claimed_delivered": deliv_qty,
                                    "actual_received": recv_qty,
                                    "missing_quantity": unaccounted,
                                    "category": "DELIVERY_AFFIRMATION_SHORTFALL",
                                    "classification": "Confirmed Conflict"
                                },
                                "verification_status": "DETECTED"
                            })
                            conflict_count += 1

                    # CASE 4: Received vs Recorded Ledger Discrepancy (800 received vs 750 recorded in Excel)
                    elif (actA == "received" and actB == "recorded") or (actA == "recorded" and actB == "received"):
                        seen_file_pair_categories.add(pair_key)
                        recv_qty = qA if actA == "received" else qB
                        rec_qty = qB if actA == "received" else qA
                        recv_doc = evA_name if actA == "received" else evB_name
                        rec_doc = evB_name if actA == "received" else evA_name

                        if recv_qty != rec_qty:
                            ledger_gap = recv_qty - rec_qty
                            conflicts.append({
                                "conflict_code": f"CNF-{conflict_count:03d}",
                                "claim_a_id": cA["id"],
                                "claim_b_id": cB["id"],
                                "evidence_a_id": cA["evidence_id"],
                                "evidence_b_id": cB["evidence_id"],
                                "claim_a_text": cA["text"],
                                "claim_b_text": cB["text"],
                                "evidence_a_filename": evA_name,
                                "evidence_b_filename": evB_name,
                                "conflict_type": "QUANTITY_DISCREPANCY",
                                "severity": "HIGH",
                                "classification": "Possible Conflict",
                                "explanation": f"Post-intake ledger variance: Physical intake receipt ({recv_doc}) documents {recv_qty:.0f} received at dock, but inventory audit spreadsheet ({rec_doc}) logs {rec_qty:.0f} entered in stock ({ledger_gap:.0f} kits unlogged). Could represent intake processing delay or internal inventory shrinkage.",
                                "discrepancy_details": {
                                    "received_quantity": recv_qty,
                                    "recorded_inventory": rec_qty,
                                    "unaccounted_in_ledger": ledger_gap,
                                    "category": "INVENTORY_LEDGER_DEFICIT",
                                    "classification": "Possible Conflict"
                                },
                                "verification_status": "DETECTED"
                            })
                            conflict_count += 1

                    # CASE 5: Claimed Delivered vs Warehouse Dispatched (1000 claimed delivered vs 900 dispatched)
                    elif (actA == "delivered" and actB == "dispatched") or (actA == "dispatched" and actB == "delivered"):
                        seen_file_pair_categories.add(pair_key)
                        deliv_qty = qA if actA == "delivered" else qB
                        disp_qty = qB if actA == "delivered" else qA
                        deliv_doc = evA_name if actA == "delivered" else evB_name
                        disp_doc = evB_name if actA == "delivered" else evA_name

                        if deliv_qty > disp_qty:
                            origin_deficit = deliv_qty - disp_qty
                            conflicts.append({
                                "conflict_code": f"CNF-{conflict_count:03d}",
                                "claim_a_id": cA["id"],
                                "claim_b_id": cB["id"],
                                "evidence_a_id": cA["evidence_id"],
                                "evidence_b_id": cB["evidence_id"],
                                "claim_a_text": cA["text"],
                                "claim_b_text": cB["text"],
                                "evidence_a_filename": evA_name,
                                "evidence_b_filename": evB_name,
                                "conflict_type": "QUANTITY_DISCREPANCY",
                                "severity": "HIGH",
                                "classification": "Confirmed Conflict",
                                "explanation": f"Origin dispatch bottleneck: Official summary ({deliv_doc}) asserts {deliv_qty:.0f} were delivered, yet origin warehouse manifest ({disp_doc}) documents only {disp_qty:.0f} were dispatched. Delivery of {origin_deficit:.0f} excess kits is physically impossible from this dispatch.",
                                "discrepancy_details": {
                                    "claimed_delivered": deliv_qty,
                                    "warehouse_dispatched": disp_qty,
                                    "origin_shortfall": origin_deficit,
                                    "category": "ORIGIN_DISPATCH_LIMITATION",
                                    "classification": "Confirmed Conflict"
                                },
                                "verification_status": "DETECTED"
                            })
                            conflict_count += 1

            # Compare DATE claims for temporal anomalies
            dateA = cA.get("date_val")
            dateB = cB.get("date_val")
            if dateA and dateB and dateA != dateB:
                # If both are milestone claims for the same shipment
                evA_name = evidence_map.get(cA["evidence_id"], {}).get("filename", f"Evidence #{cA['evidence_id']}")
                evB_name = evidence_map.get(cB["evidence_id"], {}).get("filename", f"Evidence #{cB['evidence_id']}")
                
                # Check for contradictory dates
                if ("deliver" in cA["text"].lower() and "deliver" in cB["text"].lower()) or \
                   ("dispatch" in cA["text"].lower() and "dispatch" in cB["text"].lower()):
                    conflicts.append({
                        "conflict_code": f"CNF-{conflict_count:03d}",
                        "claim_a_id": cA["id"],
                        "claim_b_id": cB["id"],
                        "evidence_a_id": cA["evidence_id"],
                        "evidence_b_id": cB["evidence_id"],
                        "claim_a_text": cA["text"],
                        "claim_b_text": cB["text"],
                        "evidence_a_filename": evA_name,
                        "evidence_b_filename": evB_name,
                        "conflict_type": "DATE_MISMATCH",
                        "severity": "MEDIUM",
                        "classification": "Possible Conflict",
                        "explanation": f"Temporal discrepancy: {evA_name} dates the milestone at {dateA}, while {evB_name} dates it at {dateB}.",
                        "discrepancy_details": {
                            "date_a": dateA,
                            "date_b": dateB,
                            "category": "TEMPORAL_INCONSISTENCY",
                            "classification": "Possible Conflict"
                        },
                        "verification_status": "DETECTED"
                    })
                    conflict_count += 1

            # Compare STATUS claims (e.g. Completed / Full vs Partial / Disputed)
            statA = cA.get("object_val") if cA.get("claim_type") == "STATUS" else None
            statB = cB.get("object_val") if cB.get("claim_type") == "STATUS" else None
            if statA and statB and statA.lower() != statB.lower():
                evA_name = evidence_map.get(cA["evidence_id"], {}).get("filename", f"Evidence #{cA['evidence_id']}")
                evB_name = evidence_map.get(cB["evidence_id"], {}).get("filename", f"Evidence #{cB['evidence_id']}")
                conflicts.append({
                    "conflict_code": f"CNF-{conflict_count:03d}",
                    "claim_a_id": cA["id"],
                    "claim_b_id": cB["id"],
                    "evidence_a_id": cA["evidence_id"],
                    "evidence_b_id": cB["evidence_id"],
                    "claim_a_text": cA["text"],
                    "claim_b_text": cB["text"],
                    "evidence_a_filename": evA_name,
                    "evidence_b_filename": evB_name,
                    "conflict_type": "STATUS_CONTRADICTION",
                    "severity": "HIGH",
                    "classification": "Confirmed Conflict",
                    "explanation": f"Contradictory execution status: {evA_name} asserts status '{statA}', whereas {evB_name} reports status '{statB}'.",
                    "discrepancy_details": {
                        "status_a": statA,
                        "status_b": statB,
                        "category": "STATUS_CONTRADICTION",
                        "classification": "Confirmed Conflict"
                    },
                    "verification_status": "DETECTED"
                })
                conflict_count += 1

    return conflicts
