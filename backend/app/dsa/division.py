"""
Bank Organization Hierarchy Data Structure (DSA Tree).

Implements an N-ary Tree (Hierarchical Tree Structure) representing:
    Head Branch (Root)
       └── Regional Divisions / Banking Divisions (e.g. Retail Banking, Commercial Banking, Wealth Management)
             └── Local Branches / Units (e.g. Downtown Metro Branch, Northside Corporate Branch)
                   └── Officers / Relationship Managers / Customers (Users)
                         └── User Accounts (Leaves)

Supports:
- Hierarchical tree nodes with bidirectional parent-child navigation
- Depth, height, and path calculation (Root -> Division -> Branch -> User -> Account)
- Tree traversals (DFS Pre-order, Post-order, and BFS Level-order)
- Querying subtrees, finding ancestors, and aggregating statistics (total accounts, balance, users)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set


class NodeType(str, Enum):
    HEAD_BRANCH = "head_branch"
    DIVISION = "division"
    BRANCH = "branch"
    USER = "user"
    ACCOUNT = "account"


@dataclass
class TreeNode:
    """
    General N-ary Tree Node for Bank Hierarchy.
    """
    node_id: str
    name: str
    node_type: NodeType
    metadata: Dict[str, Any] = field(default_factory=dict)
    parent: Optional["TreeNode"] = None
    children: List["TreeNode"] = field(default_factory=list)

    def add_child(self, child: "TreeNode") -> "TreeNode":
        """Adds a child node and links parent pointer."""
        child.parent = self
        self.children.append(child)
        return child

    def remove_child(self, child_node_id: str) -> Optional["TreeNode"]:
        """Removes a child by ID and clears its parent pointer."""
        for i, child in enumerate(self.children):
            if child.node_id == child_node_id:
                removed = self.children.pop(i)
                removed.parent = None
                return removed
        return None

    def is_root(self) -> bool:
        return self.parent is None

    def is_leaf(self) -> bool:
        return len(self.children) == 0

    def depth(self) -> int:
        """Distance from this node to root (Head Branch = 0)."""
        d = 0
        curr = self.parent
        while curr is not None:
            d += 1
            curr = curr.parent
        return d

    def path_from_root(self) -> List[str]:
        """Returns ordered path of node names from Head Branch down to this node."""
        path = []
        curr: Optional["TreeNode"] = self
        while curr is not None:
            path.append(f"{curr.name} ({curr.node_type.value})")
            curr = curr.parent
        return list(reversed(path))

    def to_dict(self, include_children: bool = True) -> Dict[str, Any]:
        """Serializes the node and recursively its subtree to a dictionary."""
        data: Dict[str, Any] = {
            "node_id": self.node_id,
            "name": self.name,
            "node_type": self.node_type.value,
            "depth": self.depth(),
            "metadata": self.metadata,
        }
        if include_children:
            data["children"] = [child.to_dict(include_children=True) for child in self.children]
        else:
            data["children_count"] = len(self.children)
        return data


class BankHierarchyTree:
    """
    Hierarchical Tree Structure for Aegis Bank.
    Maintains Head Branch as the main root, organizing Divisions, Branches, Users, and Accounts.
    """

    def __init__(
        self,
        head_branch_id: str = "HEAD-001",
        head_branch_name: str = "Aegis Central Head Office",
        city: str = "Metropolis HQ"
    ):
        self.root = TreeNode(
            node_id=head_branch_id,
            name=head_branch_name,
            node_type=NodeType.HEAD_BRANCH,
            metadata={"address": city, "established": 2015, "routing_prefix": "AEGIS"}
        )
        self._index: Dict[str, TreeNode] = {self.root.node_id: self.root}

    # ================= CRUD Operations =================

    def add_node(
        self,
        parent_id: str,
        node_id: str,
        name: str,
        node_type: NodeType,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TreeNode:
        """
        Inserts a new node under the given parent_id.
        Raises KeyError if parent_id does not exist.
        """
        if node_id in self._index:
            return self._index[node_id]

        parent_node = self._index.get(parent_id)
        if not parent_node:
            raise KeyError(f"Parent node '{parent_id}' not found in bank hierarchy tree.")

        new_node = TreeNode(
            node_id=node_id,
            name=name,
            node_type=node_type,
            metadata=metadata or {}
        )
        parent_node.add_child(new_node)
        self._index[node_id] = new_node
        return new_node

    def find_node(self, node_id: str) -> Optional[TreeNode]:
        """Finds any node in O(1) via hash table indexing."""
        return self._index.get(node_id)

    # ================= Traversals & DSA Algorithms =================

    def preorder_traversal(self, start_node: Optional[TreeNode] = None) -> List[Dict[str, Any]]:
        """
        DFS Pre-order Traversal (Root, Left, Right).
        Visits the organizational supervisor before subordinates.
        """
        result: List[Dict[str, Any]] = []
        root = start_node or self.root

        def _dfs(node: TreeNode):
            result.append(node.to_dict(include_children=False))
            for child in node.children:
                _dfs(child)

        _dfs(root)
        return result

    def level_order_traversal(self, start_node: Optional[TreeNode] = None) -> Dict[int, List[Dict[str, Any]]]:
        """
        BFS Level-order Traversal.
        Groups tree members strictly by organizational rank/tier:
        Level 0: Head Branch
        Level 1: Divisions
        Level 2: Branches
        Level 3: Users / Customers
        Level 4: Accounts
        """
        from collections import deque
        levels: Dict[int, List[Dict[str, Any]]] = {}
        root = start_node or self.root

        queue = deque([(root, 0)])
        while queue:
            node, level = queue.popleft()
            if level not in levels:
                levels[level] = []
            levels[level].append(node.to_dict(include_children=False))

            for child in node.children:
                queue.append((child, level + 1))

        return levels

    def get_ancestors(self, node_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves line-of-management chain from node up to Head Branch.
        """
        node = self.find_node(node_id)
        if not node:
            return []

        ancestors = []
        curr = node.parent
        while curr is not None:
            ancestors.append(curr.to_dict(include_children=False))
            curr = curr.parent
        return ancestors

    def get_subtree_aggregate(self, node_id: str) -> Dict[str, Any]:
        """
        DSA Tree Fold / Bottom-Up Aggregate:
        Calculates total users, total accounts, and total balance under this subtree.
        """
        node = self.find_node(node_id)
        if not node:
            return {"error": f"Node '{node_id}' not found"}

        stats = {
            "node_id": node.node_id,
            "name": node.name,
            "node_type": node.node_type.value,
            "total_divisions": 0,
            "total_branches": 0,
            "total_users": 0,
            "total_accounts": 0,
            "total_balance": 0.0,
            "active_accounts": 0,
            "frozen_accounts": 0,
        }

        def _aggregate(curr: TreeNode):
            if curr.node_type == NodeType.DIVISION:
                stats["total_divisions"] += 1
            elif curr.node_type == NodeType.BRANCH:
                stats["total_branches"] += 1
            elif curr.node_type == NodeType.USER:
                stats["total_users"] += 1
            elif curr.node_type == NodeType.ACCOUNT:
                stats["total_accounts"] += 1
                bal = float(curr.metadata.get("balance", 0.0))
                stats["total_balance"] += bal
                status = curr.metadata.get("status", "active")
                if status == "frozen":
                    stats["frozen_accounts"] += 1
                else:
                    stats["active_accounts"] += 1

            for child in curr.children:
                _aggregate(child)

        _aggregate(node)
        stats["total_balance"] = round(stats["total_balance"], 2)
        return stats

    def to_hierarchy_dict(self) -> Dict[str, Any]:
        """Returns complete hierarchical tree structure starting from Head Branch."""
        return self.root.to_dict(include_children=True)
