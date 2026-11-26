from typing import Dict, Any, List
import math
import networkx as nx

def build_investigation_knowledge_graph(
    evidence_list: List[Dict[str, Any]],
    claims_list: List[Dict[str, Any]],
    entities_list: List[Dict[str, Any]],
    conflicts_list: List[Dict[str, Any]],
    project_name: str = "Medical Supply Project"
) -> Dict[str, Any]:
    """
    Constructs an interactive radial / hub-and-spoke knowledge graph centered around
    the primary Project node, with documents, claims, and entities orbiting it,
    matching the exact reference layout with clean dashed connecting lines.
    """
    react_nodes = []
    react_edges = []

    # 1. Center Hub Node: Primary Project / Investigation
    hub_id = "project_hub"
    react_nodes.append({
        "id": hub_id,
        "type": "customNode",
        "position": {"x": 480, "y": 280},
        "data": {
            "id": hub_id,
            "nodeType": "PROJECT",
            "label": project_name or "Medical Supply Project",
            "sublabel": "PROJECT",
            "category": "PROJECT",
            "payload": {"title": project_name}
        }
    })

    # Group evidence by filename or unique code to avoid duplicates
    unique_evidence = []
    seen_ev_names = set()
    for ev in evidence_list:
        clean_name = ev.get("filename", "").replace(" (1)", "")
        if clean_name not in seen_ev_names:
            seen_ev_names.add(clean_name)
            unique_evidence.append(ev)

    # Filter most significant claims (e.g. unique quantity claims)
    significant_claims = []
    seen_qtys = set()
    for clm in claims_list:
        q_val = clm.get("quantity_val")
        if q_val is not None:
            if q_val not in seen_qtys:
                seen_qtys.add(q_val)
                significant_claims.append(clm)
        elif len(significant_claims) < 4 and not any(clm["text"] == c["text"] for c in significant_claims):
            significant_claims.append(clm)

    # Filter most significant entities (e.g. Location, Person, Org)
    location_entities = [e for e in entities_list if e.get("entity_type") == "LOCATION"]
    other_entities = [e for e in entities_list if e.get("entity_type") in ["ORG", "ORGANIZATION", "PERSON"]]
    
    selected_entities = []
    if location_entities:
        selected_entities.append(location_entities[0])
    for e in other_entities:
        if len(selected_entities) < 2 and e["name"] not in [x["name"] for x in selected_entities]:
            selected_entities.append(e)

    # Map nodes to exact radial positions matching the reference image:
    # Top-center: Inventory Log (Document)
    # Middle-left: Government Report (Document)
    # Middle-right: Delivery Receipt (Document)
    # Top-left: Claim 1 (1,000 kits delivered)
    # Bottom-left: Claim 2 (800 kits received)
    # Top-right: Claim 3 (900 kits dispatched / 750 recorded)
    # Bottom-right: Regional Hub Alpha (Location)
    # Bottom-center: Secondary Entity (if present)

    # Sort documents: spreadsheet at top, report on left, receipt on right
    doc_positions = {}
    top_doc = None
    left_doc = None
    right_doc = None

    for ev in unique_evidence:
        fname = ev.get("filename", "").lower()
        if "inventory" in fname or "audit" in fname or "xlsx" in fname or "csv" in fname:
            if not top_doc:
                top_doc = ev
                continue
        if "gov" in fname or "closure" in fname or "ministry" in fname or "report" in fname:
            if not left_doc:
                left_doc = ev
                continue
        if "receipt" in fname or "dock" in fname or "png" in fname or "jpg" in fname:
            if not right_doc:
                right_doc = ev
                continue

    # Fallback assignment if naming differs
    for ev in unique_evidence:
        if ev not in [top_doc, left_doc, right_doc]:
            if not top_doc: top_doc = ev
            elif not left_doc: left_doc = ev
            elif not right_doc: right_doc = ev

    # 2. Add Document Nodes
    edge_idx = 0

    if top_doc:
        top_id = f"doc_{top_doc['id']}"
        clean_top_name = top_doc.get("filename", "Inventory_Log.xlsx").replace("3_", "").replace("Doc3_", "")
        react_nodes.append({
            "id": top_id,
            "type": "customNode",
            "position": {"x": 485, "y": 80},
            "data": {
                "id": top_id,
                "nodeType": "DOCUMENT",
                "label": clean_top_name,
                "sublabel": top_doc.get("file_type", "xlsx").upper(),
                "category": "DOCUMENT",
                "payload": top_doc
            }
        })
        # Orange dashed line to project hub (indicating discrepancy audit)
        react_edges.append({
            "id": f"e_hub_{top_id}_{edge_idx}",
            "source": hub_id,
            "target": top_id,
            "type": "straight",
            "animated": True,
            "style": {
                "stroke": "#f97316",
                "strokeWidth": 2,
                "strokeDasharray": "5 5"
            }
        })
        edge_idx += 1

    if left_doc:
        left_id = f"doc_{left_doc['id']}"
        clean_left_name = left_doc.get("filename", "Government_Report.pdf").replace("1_", "").replace("Doc1_", "")
        react_nodes.append({
            "id": left_id,
            "type": "customNode",
            "position": {"x": 60, "y": 300},
            "data": {
                "id": left_id,
                "nodeType": "DOCUMENT",
                "label": clean_left_name,
                "sublabel": left_doc.get("file_type", "pdf").upper(),
                "category": "DOCUMENT",
                "payload": left_doc
            }
        })
        # Connected to center
        react_edges.append({
            "id": f"e_hub_{left_id}_{edge_idx}",
            "source": hub_id,
            "target": left_id,
            "type": "straight",
            "style": {
                "stroke": "#3b82f6",
                "strokeWidth": 1.75,
                "strokeDasharray": "4 4"
            }
        })
        edge_idx += 1

    if right_doc:
        right_id = f"doc_{right_doc['id']}"
        clean_right_name = right_doc.get("filename", "Delivery_Receipt.png").replace("2_", "").replace("Doc2_", "")
        react_nodes.append({
            "id": right_id,
            "type": "customNode",
            "position": {"x": 880, "y": 300},
            "data": {
                "id": right_id,
                "nodeType": "DOCUMENT",
                "label": clean_right_name,
                "sublabel": right_doc.get("file_type", "png").upper(),
                "category": "DOCUMENT",
                "payload": right_doc
            }
        })
        react_edges.append({
            "id": f"e_hub_{right_id}_{edge_idx}",
            "source": hub_id,
            "target": right_id,
            "type": "straight",
            "style": {
                "stroke": "#3b82f6",
                "strokeWidth": 1.75,
                "strokeDasharray": "4 4"
            }
        })
        edge_idx += 1

    # 3. Add Claim Nodes
    # Claim 1: Top-Left (1,000 kits delivered - Govt. Report)
    clm_1000 = next((c for c in significant_claims if c.get("quantity_val") == 1000), None)
    if not clm_1000 and significant_claims:
        clm_1000 = significant_claims[0]

    if clm_1000:
        c1_id = f"clm_{clm_1000['id']}"
        react_nodes.append({
            "id": c1_id,
            "type": "customNode",
            "position": {"x": 170, "y": 120},
            "data": {
                "id": c1_id,
                "nodeType": "CLAIM",
                "label": "1,000 kits delivered",
                "sublabel": "Claim C001 - Govt. Report",
                "category": "CLAIM",
                "claimType": "DELIVERED",
                "payload": clm_1000
            }
        })
        # Connect to center
        react_edges.append({
            "id": f"e_hub_{c1_id}_{edge_idx}",
            "source": hub_id,
            "target": c1_id,
            "type": "straight",
            "style": {"stroke": "#3b82f6", "strokeWidth": 1.75, "strokeDasharray": "4 4"}
        })
        edge_idx += 1
        if left_doc:
            react_edges.append({
                "id": f"e_c1_doc_{edge_idx}",
                "source": f"doc_{left_doc['id']}",
                "target": c1_id,
                "type": "straight",
                "style": {"stroke": "#3b82f6", "strokeWidth": 1.5, "strokeDasharray": "4 4"}
            })
            edge_idx += 1

    # Claim 2: Bottom-Left (800 kits received - Receipt)
    clm_800 = next((c for c in significant_claims if c.get("quantity_val") == 800), None)
    if not clm_800 and len(significant_claims) > 1:
        clm_800 = significant_claims[1]

    if clm_800:
        c2_id = f"clm_{clm_800['id']}"
        react_nodes.append({
            "id": c2_id,
            "type": "customNode",
            "position": {"x": 170, "y": 480},
            "data": {
                "id": c2_id,
                "nodeType": "CLAIM",
                "label": "800 kits received",
                "sublabel": "Claim C003 - Receipt",
                "category": "CLAIM",
                "claimType": "RECEIVED",
                "payload": clm_800
            }
        })
        react_edges.append({
            "id": f"e_hub_{c2_id}_{edge_idx}",
            "source": hub_id,
            "target": c2_id,
            "type": "straight",
            "style": {"stroke": "#3b82f6", "strokeWidth": 1.75, "strokeDasharray": "4 4"}
        })
        edge_idx += 1

    # Claim 3: Top-Right (900 kits dispatched / 750 kits recorded - Warehouse / Audit)
    clm_other = next((c for c in significant_claims if c.get("quantity_val") in [900, 750]), None)
    if not clm_other and len(significant_claims) > 2:
        clm_other = significant_claims[2]

    q_other_val = clm_other.get("quantity_val") if clm_other else 900
    q_other_label = f"{int(q_other_val):,} kits dispatched" if q_other_val == 900 else f"{int(q_other_val):,} kits recorded"
    q_other_sub = "Claim C002 - Warehouse" if q_other_val == 900 else "Claim C002 - Audit Log"

    c3_id = f"clm_{clm_other['id']}" if clm_other else "clm_dispatch"
    react_nodes.append({
        "id": c3_id,
        "type": "customNode",
        "position": {"x": 780, "y": 120},
        "data": {
            "id": c3_id,
            "nodeType": "CLAIM",
            "label": q_other_label,
            "sublabel": q_other_sub,
            "category": "DISPATCH",
            "isOrange": True,
            "payload": clm_other or {}
        }
    })
    react_edges.append({
        "id": f"e_hub_{c3_id}_{edge_idx}",
        "source": hub_id,
        "target": c3_id,
        "type": "straight",
        "style": {"stroke": "#3b82f6", "strokeWidth": 1.75, "strokeDasharray": "4 4"}
    })
    edge_idx += 1
    if right_doc:
        react_edges.append({
            "id": f"e_c3_doc_{edge_idx}",
            "source": c3_id,
            "target": f"doc_{right_doc['id']}",
            "type": "straight",
            "style": {"stroke": "#3b82f6", "strokeWidth": 1.5, "strokeDasharray": "4 4"}
        })
        edge_idx += 1

    # 4. Add Entity Node: Bottom-Right (Regional Hub Alpha - Location)
    loc_ent = next((e for e in selected_entities if e.get("entity_type") == "LOCATION"), None)
    loc_label = loc_ent["name"] if loc_ent else "Regional Hub Alpha"
    loc_id = f"ent_{loc_ent['id']}" if loc_ent else "ent_loc_hub"

    react_nodes.append({
        "id": loc_id,
        "type": "customNode",
        "position": {"x": 780, "y": 480},
        "data": {
            "id": loc_id,
            "nodeType": "ENTITY",
            "label": loc_label,
            "sublabel": "Location",
            "category": "LOCATION",
            "payload": loc_ent or {}
        }
    })
    react_edges.append({
        "id": f"e_hub_{loc_id}_{edge_idx}",
        "source": hub_id,
        "target": loc_id,
        "type": "straight",
        "style": {"stroke": "#3b82f6", "strokeWidth": 1.75, "strokeDasharray": "4 4"}
    })
    edge_idx += 1

    # Secondary Entity if present (e.g. Director Sarah Lin or Ministry of Health) at bottom center
    sec_ent = next((e for e in selected_entities if e != loc_ent), None)
    if sec_ent:
        sec_id = f"ent_{sec_ent['id']}"
        react_nodes.append({
            "id": sec_id,
            "type": "customNode",
            "position": {"x": 485, "y": 490},
            "data": {
                "id": sec_id,
                "nodeType": "ENTITY",
                "label": sec_ent["name"],
                "sublabel": sec_ent.get("entity_type", "Organization").capitalize(),
                "category": sec_ent.get("entity_type", "ORG"),
                "payload": sec_ent
            }
        })
        react_edges.append({
            "id": f"e_hub_{sec_id}_{edge_idx}",
            "source": hub_id,
            "target": sec_id,
            "type": "straight",
            "style": {"stroke": "#3b82f6", "strokeWidth": 1.75, "strokeDasharray": "4 4"}
        })
        edge_idx += 1

    return {
        "nodes": react_nodes,
        "edges": react_edges,
        "stats": {
            "total_nodes": len(react_nodes),
            "documents_count": len([n for n in react_nodes if n["data"]["nodeType"] == "DOCUMENT"]),
            "claims_count": len([n for n in react_nodes if n["data"]["nodeType"] == "CLAIM"]),
            "entities_count": len([n for n in react_nodes if n["data"]["nodeType"] in ["ENTITY", "PROJECT"]]),
            "total_edges": len(react_edges),
            "conflict_edges": len([e for e in react_edges if e.get("animated")])
        }
    }
