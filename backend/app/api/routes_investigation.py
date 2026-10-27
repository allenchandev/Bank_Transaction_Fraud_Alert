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
