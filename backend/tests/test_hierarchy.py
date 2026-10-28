import pytest
from app.dsa.hierarchy import BankHierarchyTree, NodeType
from app.services.graph_service import graph_service


def test_bank_hierarchy_tree_crud_and_traversals():
    tree = BankHierarchyTree(
        head_branch_id="HEAD-MAIN",
        head_branch_name="Aegis Central Head Office",
        city="Metropolis"
    )

    assert tree.root.node_id == "HEAD-MAIN"
    assert tree.root.node_type == NodeType.HEAD_BRANCH
    assert tree.root.depth() == 0
    assert tree.root.is_root() is True

    # 1. Add Division
    div = tree.add_node(
        parent_id="HEAD-MAIN",
        node_id="DIV-RETAIL",
        name="Retail Division",
        node_type=NodeType.DIVISION
    )
    assert div.parent == tree.root
    assert div.depth() == 1
    assert div.is_leaf() is True

    # 2. Add Branch
    branch = tree.add_node(
        parent_id="DIV-RETAIL",
        node_id="BR-01",
        name="Downtown Branch",
        node_type=NodeType.BRANCH
    )
    assert branch.depth() == 2

    # 3. Add User
    user = tree.add_node(
        parent_id="BR-01",
        node_id="USER-1001",
        name="Alice Vance",
        node_type=NodeType.USER
    )
    assert user.depth() == 3

    # 4. Add Accounts under User
    acc1 = tree.add_node(
        parent_id="USER-1001",
        node_id="ACC-2001",
        name="Savings Account",
        node_type=NodeType.ACCOUNT,
        metadata={"balance": 1500.0, "status": "active"}
    )
    acc2 = tree.add_node(
        parent_id="USER-1001",
        node_id="ACC-2002",
        name="Current Account",
        node_type=NodeType.ACCOUNT,
        metadata={"balance": 3500.0, "status": "active"}
    )
    assert acc1.depth() == 4
    assert acc2.depth() == 4

    # Path from root
    path = acc1.path_from_root()
    assert len(path) == 5
    assert "Aegis Central Head Office" in path[0]

    # Preorder Traversal
    preorder = tree.preorder_traversal()
    node_ids = [n["node_id"] for n in preorder]
    assert node_ids[0] == "HEAD-MAIN"
    assert "DIV-RETAIL" in node_ids
    assert "USER-1001" in node_ids
    assert "ACC-2001" in node_ids

    # BFS Level-order Traversal
    levels = tree.level_order_traversal()
    assert len(levels[0]) == 1  # Head Branch
    assert levels[0][0]["node_id"] == "HEAD-MAIN"
    assert len(levels[1]) == 1  # Divisions
    assert len(levels[4]) == 2  # Accounts

    # Subtree Aggregation
    agg_head = tree.get_subtree_aggregate("HEAD-MAIN")
    assert agg_head["total_divisions"] == 1
    assert agg_head["total_branches"] == 1
    assert agg_head["total_users"] == 1
    assert agg_head["total_accounts"] == 2
    assert agg_head["total_balance"] == 5000.0


def test_bank_hierarchy_service_and_db_integration():
    tree = graph_service.build_bank_hierarchy()

    assert tree.root.node_id == "HEAD-MAIN"
    assert tree.root.node_type == NodeType.HEAD_BRANCH
    assert len(tree.root.children) >= 3  # Retail, Commercial, Wealth

    # Check that users and accounts were mapped from DB
    agg = tree.get_subtree_aggregate("HEAD-MAIN")
    assert agg["total_users"] > 0
    assert agg["total_accounts"] > 0
    assert agg["total_balance"] > 0.0

    # Test API serializable structure
    hierarchy_dict = tree.to_hierarchy_dict()
    assert hierarchy_dict["node_id"] == "HEAD-MAIN"
    assert "children" in hierarchy_dict
    assert len(hierarchy_dict["children"]) >= 3
