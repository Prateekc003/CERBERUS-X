import networkx as nx
from typing import Dict, Any, List
import math

def build_investigation_knowledge_graph(
    evidence_list: List[Dict[str, Any]],
    claims_list: List[Dict[str, Any]],
    entities_list: List[Dict[str, Any]],
    conflicts_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Constructs a NetworkX directed graph connecting Documents, Claims, Entities, and Conflicts,
    and returns a React Flow compatible payload with pre-arranged layout coordinates.
    """
    G = nx.DiGraph()

    # 1. Add Evidence (Document) Nodes
    for ev in evidence_list:
        node_id = f"doc_{ev['id']}"
        G.add_node(
            node_id,
            node_type="DOCUMENT",
            label=ev["filename"],
            sublabel=f"Code: {ev.get('evidence_code', '')} | Type: {ev.get('file_type', '').upper()}",
            category=ev.get("file_type", "").upper(),
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

    # 2. Add Entity Nodes
    for ent in entities_list:
        node_id = f"ent_{ent['id']}"
        G.add_node(
            node_id,
            node_type="ENTITY",
            label=ent["name"],
            sublabel=f"Type: {ent['entity_type']} | Mentions: {ent.get('mention_count', 1)}",
            category=ent["entity_type"],
            data={
                "id": ent["id"],
                "name": ent["name"],
                "normalized_name": ent["normalized_name"],
                "entity_type": ent["entity_type"],
                "mention_count": ent.get("mention_count", 1)
            }
        )

    # 3. Add Claim Nodes & MENTIONS edges
    for clm in claims_list:
        node_id = f"clm_{clm['id']}"
        G.add_node(
            node_id,
            node_type="CLAIM",
            label=f"{clm.get('claim_code', 'CLM')}: {clm.get('claim_type', 'CLAIM')}",
            sublabel=clm["text"][:75] + ("..." if len(clm["text"]) > 75 else ""),
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

        # Edge from Document to Claim (BELONGS_TO / CONTAINS)
        doc_node_id = f"doc_{clm['evidence_id']}"
        if G.has_node(doc_node_id):
            G.add_edge(doc_node_id, node_id, edge_type="CONTAINS", label="CONTAINS")

        # Connect Claim to matching Entities
        for ent in entities_list:
            ent_node_id = f"ent_{ent['id']}"
            if ent["name"].lower() in clm["text"].lower() or ent["normalized_name"] in clm["text"].lower():
                G.add_edge(node_id, ent_node_id, edge_type="MENTIONS", label="MENTIONS")

    # 4. Add Conflict Edges & Nodes (CONTRADICTS)
    for cnf in conflicts_list:
        clm_a_node = f"clm_{cnf['claim_a_id']}"
        clm_b_node = f"clm_{cnf['claim_b_id']}"

        if G.has_node(clm_a_node) and G.has_node(clm_b_node):
            # Direct contradiction edge between claims
            G.add_edge(
                clm_a_node,
                clm_b_node,
                edge_type="CONTRADICTS",
                label="CONTRADICTS",
                severity=cnf.get("severity", "HIGH"),
                explanation=cnf.get("explanation", "")
            )

        # Also connect documents with CONFLICT relationship
        doc_a_node = f"doc_{cnf['evidence_a_id']}"
        doc_b_node = f"doc_{cnf['evidence_b_id']}"
        if G.has_node(doc_a_node) and G.has_node(doc_b_node):
            G.add_edge(
                doc_a_node,
                doc_b_node,
                edge_type="CONFLICTS_WITH",
                label="CONFLICTS_WITH",
                severity=cnf.get("severity", "HIGH")
            )

    # 5. Arrange Layout Coordinates for React Flow
    react_nodes = []
    react_edges = []

    # Simple column/layer based positioning:
    # Col 1: Documents (x=100)
    # Col 2: Claims (x=500)
    # Col 3: Entities (x=950)
    doc_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "DOCUMENT"]
    clm_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "CLAIM"]
    ent_nodes = [n for n, d in G.nodes(data=True) if d.get("node_type") == "ENTITY"]

    for idx, n in enumerate(doc_nodes):
        d = G.nodes[n]
        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": 50, "y": 80 + idx * 160},
            "data": {
                "id": n,
                "nodeType": "DOCUMENT",
                "label": d["label"],
                "sublabel": d.get("sublabel", ""),
                "category": d.get("category", ""),
                "payload": d.get("data", {})
            }
        })

    for idx, n in enumerate(clm_nodes):
        d = G.nodes[n]
        # Check if this claim has contradiction
        has_conflict = any(
            (u == n or v == n) and edata.get("edge_type") == "CONTRADICTS"
            for u, v, edata in G.edges(data=True)
        )
        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": 450, "y": 60 + idx * 110},
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

    for idx, n in enumerate(ent_nodes):
        d = G.nodes[n]
        react_nodes.append({
            "id": n,
            "type": "customNode",
            "position": {"x": 880, "y": 80 + idx * 120},
            "data": {
                "id": n,
                "nodeType": "ENTITY",
                "label": d["label"],
                "sublabel": d.get("sublabel", ""),
                "category": d.get("category", ""),
                "payload": d.get("data", {})
            }
        })

    # Edges
    edge_idx = 0
    for u, v, edata in G.edges(data=True):
        edge_type = edata.get("edge_type", "RELATED_TO")
        is_conflict = edge_type in ["CONTRADICTS", "CONFLICTS_WITH"]
        
        react_edges.append({
            "id": f"e_{u}_{v}_{edge_idx}",
            "source": u,
            "target": v,
            "label": edata.get("label", edge_type),
            "type": "smoothstep",
            "animated": is_conflict,
            "style": {
                "stroke": "#dc2626" if is_conflict else "#2563eb" if edge_type == "MENTIONS" else "#64748b",
                "strokeWidth": 2.5 if is_conflict else 1.5,
                "strokeDasharray": "5,5" if is_conflict else "none"
            },
            "data": {
                "edge_type": edge_type,
                "severity": edata.get("severity"),
                "explanation": edata.get("explanation")
            }
        })
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
            "conflict_edges": len([e for e in react_edges if "strokeDasharray" in e.get("style", {}) and e["style"]["strokeDasharray"] != "none"])
        }
    }
