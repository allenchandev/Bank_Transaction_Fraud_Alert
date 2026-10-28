from fastapi import APIRouter, HTTPException, Query
from app.services.graph_service import graph_service
from app.api.schemas import BFSRequest

router = APIRouter(prefix="/api/investigation", tags=["Graph & DSA Investigation"])


@router.get("/overview")
def get_investigation_overview():
    """
    Returns complete system intelligence overview:
    - DFS cycles
    - Risk ranking of all accounts
    - Topology nodes and edges formatted for React Flow
    - Summary metrics
    """
    return graph_service.get_full_network_overview()


@router.get("/accounts/{account_ref}/graph")
def get_account_subgraph(account_ref: str, depth: int = Query(2, ge=1, le=5)):
    bfs_res = graph_service.execute_bfs(account_ref, max_hops=depth)
    return bfs_res


@router.get("/accounts/{account_ref}")
def get_account_investigation(account_ref: str):
    res = graph_service.get_account_investigation(account_ref)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/dfs")
def run_dfs_cycle_detection():
    """
    Executes Depth-First Search cycle detection with step-by-step trace and cycle reconstruction.
    """
    return graph_service.execute_dfs()


@router.post("/bfs")
def run_bfs_fund_tracing(req: BFSRequest):
    """
    Executes Breadth-First Search fund tracing from source account up to max_hops.
    """
    res = graph_service.execute_bfs(req.source_account, max_hops=req.max_hops)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/risk-ranking")
def get_risk_ranking():
    overview = graph_service.get_full_network_overview()
    return {"ranking": overview["risk_ranking"]}


# ================= HIERARCHICAL TREE (DSA) ENDPOINTS =================

@router.get("/hierarchy")
def get_bank_hierarchy():
    """
    Returns the complete N-ary Tree hierarchical structure:
    Head Branch (Root) -> Divisions -> Branches -> Users -> Accounts
    """
    tree = graph_service.build_bank_hierarchy()
    return tree.to_hierarchy_dict()


@router.get("/hierarchy/levels")
def get_bank_hierarchy_levels():
    """
    Returns BFS Level-Order traversal of the organizational hierarchy:
    Level 0: Head Branch
    Level 1: Divisions
    Level 2: Operating Branches
    Level 3: Users / Customers
    Level 4: Accounts
    """
    tree = graph_service.build_bank_hierarchy()
    return {"levels": tree.level_order_traversal()}


@router.get("/hierarchy/nodes/{node_id}")
def get_hierarchy_node_detail(node_id: str):
    """
    Inspects a single node in the hierarchy, including its ancestors chain up to Head Branch,
    immediate children, and aggregate statistics.
    """
    tree = graph_service.build_bank_hierarchy()
    node = tree.find_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Hierarchy node '{node_id}' not found.")

    return {
        "node": node.to_dict(include_children=False),
        "path_from_root": node.path_from_root(),
        "ancestors": tree.get_ancestors(node_id),
        "children": [c.to_dict(include_children=False) for c in node.children],
        "aggregate": tree.get_subtree_aggregate(node_id)
    }


@router.get("/hierarchy/divisions/{division_id}/aggregate")
def get_division_aggregate(division_id: str):
    """
    Computes bottom-up subtree roll-up statistics (total users, accounts, balance)
    for a specific division or branch.
    """
    tree = graph_service.build_bank_hierarchy()
    stats = tree.get_subtree_aggregate(division_id)
    if "error" in stats:
        raise HTTPException(status_code=404, detail=stats["error"])
    return stats

