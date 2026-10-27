from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_get_accounts():
    res = client.get("/api/accounts")
    assert res.status_code == 200
    data = res.json()
    assert len(data["accounts"]) >= 14


def test_investigation_overview_and_dfs():
    res = client.get("/api/investigation/overview")
    assert res.status_code == 200
    data = res.json()
    assert "dfs_results" in data
    assert data["dfs_results"]["cycle_count"] >= 1
    # Check the seeded cycle ACC-2001 -> ACC-2002 -> ACC-2003 -> ACC-2001 is found
    cycles = data["dfs_results"]["cycles"]
    cycle_nodes = set(data["dfs_results"]["participating_accounts"])
    assert "ACC-2001" in cycle_nodes
    assert "ACC-2002" in cycle_nodes
    assert "ACC-2003" in cycle_nodes


def test_bfs_endpoint():
    res = client.post("/api/investigation/bfs", json={"source_account": "ACC-2004", "max_hops": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["blast_radius_count"] >= 3
    nodes = [n["account_ref"] for n in data["reachable_nodes"]]
    # Chain is ACC-2004 -> ACC-2005 -> ACC-2006 -> ACC-2007
    assert "ACC-2005" in nodes
    assert "ACC-2006" in nodes
    assert "ACC-2007" in nodes


def test_freeze_and_unfreeze_admin():
    freeze_res = client.post("/api/admin/accounts/ACC-2010/freeze", json={"reason": "Testing freeze", "analyst_actor": "Tester"})
    assert freeze_res.status_code == 200
    assert freeze_res.json()["status"] == "frozen"

    unfreeze_res = client.post("/api/admin/accounts/ACC-2010/unfreeze", json={"reason": "Testing unfreeze", "analyst_actor": "Tester"})
    assert unfreeze_res.status_code == 200
    assert unfreeze_res.json()["status"] == "active"
