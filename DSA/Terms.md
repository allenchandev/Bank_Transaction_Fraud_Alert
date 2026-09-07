# Data Structures and Algorithms (DSA) Concepts

This folder contains simplified explanations of the core Data Structures and Algorithms used in the Bank Transaction Fraud Alert System.

## The Problem
We need to analyze bank transactions to find:
1. **Circular fund transfers:** Money moving from A to B to C and back to A (often a sign of money laundering or fraud).
2. **Account reachability:** Tracing where money could have flowed from a suspicious account within a certain number of steps.
3. **High-activity accounts:** Finding accounts involved in the most transactions.

## DSA Concepts Mapping

Here is how the core Data Structures and Algorithms directly map to the project features:

| DSA Concept | Your Project Use |
| :--- | :--- |
| **Graph** | Represent bank transactions |
| **Adjacency List** | Store transaction connections |
| **DFS** | Detect circular transaction patterns |
| **BFS** | Find accounts within N transaction hops |
| **Sorting** | Rank accounts by transaction count |
| **Queue** | BFS implementation |
| **Stack/Recursion** | DFS implementation |
| **HashMap/Dictionary** | Store adjacency lists |
| **Risk Score** | Combine suspicious indicators |

## Technical Terms Used

*   **Graph:** A mathematical structure used to model pairwise relations between objects. It's made up of Nodes (Vertices) and Edges.
*   **Node (Vertex):** The fundamental unit of a graph. In our system, a **Node represents a Bank Account**.
*   **Edge:** A connection between two nodes. In our system, an **Edge represents a Transaction** between two accounts.
*   **Directed Graph:** A graph where the edges have a direction. If Account A sends money to Account B, the edge goes from A $\rightarrow$ B, but not vice-versa (unless B also sends money to A).
*   **Adjacency List:** A way to represent a graph in code. It's usually a dictionary (or Map) where every key is a Node, and the value is a list of all Nodes it points to.
    *   *Example:* `{ "Acc_A": ["Acc_B", "Acc_C"], "Acc_B": ["Acc_D"] }`
*   **Cycle:** A path in a graph that starts and ends at the exact same node, following the direction of the edges.
*   **In-Degree & Out-Degree:** 
    *   In-degree: The number of transactions coming *into* an account.
    *   Out-degree: The number of transactions going *out* of an account.
    *   Total Activity = In-degree + Out-degree.
