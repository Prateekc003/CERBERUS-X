import networkx as nx
from typing import Dict, Any, List

def build_investigation_knowledge_graph(
    evidence_list: List[Dict[str, Any]],
    claims_list: List[Dict[str, Any]],
    entities_list: List[Dict[str, Any]],
    conflicts_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Constructs a NetworkX directed graph connecting Documents, Claims, Entities, and Conflicts,
    and returns a clean, spacious React Flow compatible layout.
    """
    G = nx.DiGraph()

    # 1. Add Evidence (Document) Nodes
    for ev in evidence_list:
        node_id = f"doc_{ev['id']}"
        G.add_node(
            node_id,
            node_type="DOCUMENT",
            label=ev["filename"],
            sublabel=f"{ev.get('evidence_code', '')} • {ev.get('file_type', '').upper()}",
            category="DOCUMENT",
            data={
                "id": ev["id"],
                "evidence_code": ev.get("evidence_code"),
                "filename": ev["filename"],
                "file_type": ev.get("file_type"),
                "status": ev.get("status"),
                "adversarial_flagged": ev.get("adversarial_flagged", False),
                "reliability_score": ev.get("reliability_score"),
                "claims_count": ev.get("claims_count", 0)
            }
        )

    # 2. Add Claim Nodes
    for clm in claims_list:
        node_id = f"clm_{clm['id']}"
        # Clean claim text snippet for sublabel
        clean_text = clm["text"]
        if "Auditor_Notes:" in clean_text:
            clean_text = clean_text.split("Auditor_Notes:")[-1].strip()
        elif "Row " in clean_text and ";" in clean_text:
            parts = [p.strip() for p in clean_text.split(";") if "Quantity" in p or "Item" in p or "Audit" in p]
            if parts:
                clean_text = " • ".join(parts)
        
        display_sub = clean_text[:80] + ("..." if len(clean_text) > 80 else "")

        G.add_node(
            node_id,
            node_type="CLAIM",
            label=f"{clm.get('claim_code', 'CLM')}",
            sublabel=display_sub,
            category=clm.get("claim_type", "CLAIM"),
            data={
                "id": clm["id"],
                "claim_code": clm.get("claim_code"),
                "text": clm["text"],
                "claim_type": clm.get("claim_type"),
                "quantity_val": clm.get("quantity_val"),
                "quantity_action": clm.get("quantity_action"),
                "evidence_id": clm["evidence_id"],
                "evidence_filename": clm.get("evidence_filename")
            }
        )

        # Single directed edge: Document -> Claim
        doc_node_id = f"doc_{clm['evidence_id']}"
        if G.has_node(doc_node_id):
            G.add_edge(doc_node_id, node_id, edge_type="CONTAINS")

    # 3. Add Entity Nodes (Prioritize entities referenced in claims or with multiple mentions)
    referenced_entities = []
    other_entities = []

    claims_text_corpus = " ".join([c["text"].lower() for c in claims_list])

    for ent in entities_list:
        ent_name_lower = ent["name"].lower()
        if ent_name_lower in claims_text_corpus or ent.get("mention_count", 1) > 1:
            referenced_entities.append(ent)
        else:
            other_entities.append(ent)

    # Cap total displayed entities to keep graph balanced and non-overwhelming
    selected_entities = (referenced_entities + other_entities)[:18]

    for ent in selected_entities:
        node_id = f"ent_{ent['id']}"
        G.add_node(
            node_id,
            node_type="ENTITY",
            label=ent["name"],
            sublabel=f"{ent['entity_type']}",
            category=ent["entity_type"],
            data={
                "id": ent["id"],
                "name": ent["name"],
                "normalized_name": ent["normalized_name"],
                "entity_type": ent["entity_type"],
                "mention_count": ent.get("mention_count", 1)
            }
        )

        # Connect Claim to matching Entity (single directed edge: Claim -> Entity)
        for clm in claims_list:
            clm_node_id = f"clm_{clm['id']}"
            if ent["name"].lower() in clm["text"].lower() or ent["normalized_name"] in clm["text"].lower():
                if G.has_node(clm_node_id) and G.has_node(node_id):
                    G.add_edge(clm_node_id, node_id, edge_type="MENTIONS")

    # 4. Add Conflict Relationships (CONTRADICTS)
    conflict_claim_ids = set()
    for cnf in conflicts_list:
        clm_a_node = f"clm_{cnf['claim_a_id']}"
        clm_b_node = f"clm_{cnf['claim_b_id']}"

        if G.has_node(clm_a_node) and G.has_node(clm_b_node):
            conflict_claim_ids.add(clm_a_node)
            conflict_claim_ids.add(clm_b_node)
            G.add_edge(
                clm_a_node,
                clm_b_node,
                edge_type="CONTRADICTS",
                label="CONTRADICTS",
                severity=cnf.get("severity", "HIGH"),
                explanation=cnf.get("explanation", "")
            )

    # 5. Position nodes in a clean, spacious 3-column layout
    react_nodes = []
    react_edges = []

    doc_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "DOCUMENT"]
    clm_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "CLAIM"]
    ent_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "ENTITY"]

    # Calculate vertical spacing to balance the height of each column
    max_count = max(len(doc_nodes), len(clm_nodes), (len(ent_nodes) + 1) // 2, 1)
    base_height = max(500, max_count * 120)

    # Column 1: Documents (x: 50)
    doc_spacing = base_height / (len(doc_nodes) + 1) if doc_nodes else 150
    for idx, n in enumerate(doc_nodes):
        d = G.nodes[n]
        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": 50, "y": int(80 + (idx + 0.5) * doc_spacing)},
            "data": {
                "id": n,
                "nodeType": "DOCUMENT",
                "label": d["label"],
                "sublabel": d.get("sublabel", ""),
                "category": d.get("category", ""),
                "payload": d.get("data", {})
            }
        })

    # Column 2: Claims (x: 440)
    clm_spacing = base_height / (len(clm_nodes) + 1) if clm_nodes else 120
    for idx, n in enumerate(clm_nodes):
        d = G.nodes[n]
        has_conflict = n in conflict_claim_ids
        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": 440, "y": int(60 + (idx + 0.5) * clm_spacing)},
            "data": {
                "id": n,
                "nodeType": "CLAIM",
                "label": d["label"],
                "sublabel": d.get("sublabel", ""),
                "category": d.get("category", ""),
                "hasConflict": has_conflict,
                "payload": d.get("data", {})
            }
        })

    # Column 3 & 4: Entities arranged in a compact 2-column grid (x: 820, 1080)
    for idx, n in enumerate(ent_nodes):
        d = G.nodes[n]
        col = idx % 2
        row = idx // 2
        x_pos = 820 + col * 260
        y_pos = 80 + row * 95

        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": x_pos, "y": y_pos},
            "data": {
                "id": n,
                "nodeType": "ENTITY",
                "label": d["label"],
                "sublabel": d.get("sublabel", ""),
                "category": d.get("category", ""),
                "payload": d.get("data", {})
            }
        })

    # 6. Edges (Clean lines, zero clutter on standard edges, only CONTRADICTS has a badge)
    edge_idx = 0
    for u, v, edata in G.edges(data=True):
        edge_type = edata.get("edge_type", "RELATED_TO")
        is_conflict = edge_type == "CONTRADICTS"

        edge_obj = {
            "id": f"e_{u}_{v}_{edge_idx}",
            "source": u,
            "target": v,
            "type": "smoothstep",
            "animated": is_conflict,
            "style": {
                "stroke": "#f43f5e" if is_conflict else "#3b82f6" if edge_type == "MENTIONS" else "#475569",
                "strokeWidth": 2.5 if is_conflict else 1.2,
                "opacity": 1.0 if is_conflict else 0.45,
                "strokeDasharray": "5,5" if is_conflict else "none"
            },
            "data": {
                "edge_type": edge_type,
                "severity": edata.get("severity"),
                "explanation": edata.get("explanation")
            }
        }

        # ONLY label the contradiction edge! Do NOT put 'MENTIONS' text labels everywhere!
        if is_conflict:
            edge_obj["label"] = "CONTRADICTION"
            edge_obj["labelStyle"] = {"fill": "#fda4af", "fontWeight": 700, "fontSize": "10px"}
            edge_obj["labelBgStyle"] = {"fill": "#881337", "fillOpacity": 0.9, "rx": 4, "ry": 4}

        react_edges.append(edge_obj)
        edge_idx += 1

    return {
        "nodes": react_nodes,
        "edges": react_edges,
        "stats": {
            "total_nodes": len(react_nodes),
            "documents_count": len(doc_nodes),
            "claims_count": len(clm_nodes),
            "entities_count": len(ent_nodes),
            "total_edges": len(react_edges),
            "conflict_edges": len([e for e in react_edges if e.get("animated")])
        }
    }
