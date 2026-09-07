# Graph-Based Fraud Detection Architecture

This document details the algorithmic foundations and data structures utilized in the Bank Transaction Fraud Alert System.

---

## 1. Problem Formulation

Financial fraud networks frequently employ complex transaction structures to evade rule-based filters:
1. **Circular Layering:** Routing stolen capital through multi-hop cycles ($A \rightarrow B \rightarrow C \rightarrow A$) to obscure provenance.
2. **Dispersal & Mule Networks:** Rapidly diffusing illicit funds across downstream accounts to prevent total asset freezing.
3. **High-Velocity Hubs:** Shell entities exhibiting disproportionate transaction concentration and abnormal out-degree dispersal.

---

## 2. Algorithmic Mapping

| Data Structure / Algorithm | Technical Implementation | Practical Application |
| :--- | :--- | :--- |
| **Directed Graph ($G = (V, E)$)** | Adjacency List (`Record<string, string[]>`) | Network topology representing accounts ($V$) and transfers ($E$) |
| **Depth-First Search (DFS)** | 3-state recursion with recursion stack tracking | Detection of cyclic transaction patterns / laundering loops |
| **Breadth-First Search (BFS)** | FIFO Queue (`shift()`) with visited set | Downstream reachability analysis and blast-radius tracing within $N$ hops |
| **Degree Centrality** | In-degree and Out-degree calculation | Identification of mule routing hubs and accumulation accounts |
| **Composite Heuristic Scoring** | Multi-factor weighted formula | Risk quantification ($0 - 100$) for triage and automated alerting |

---

## 3. Core Terminology & Complexity

- **Adjacency List:** Memory-efficient representation optimized for sparse financial transaction graphs. Lookup complexity for out-neighbors is $\mathcal{O}(1)$.
- **Cycle Detection (DFS):** Traverses the directed graph in $\mathcal{O}(V + E)$ time and $\mathcal{O}(V)$ auxiliary space, capturing closed loops without infinite recursion.
- **Reachability (BFS):** Explores shortest path hop-distances in $\mathcal{O}(V + E)$ time, isolating compromised network branches level by level.
- **In-Degree / Out-Degree:** In-degree measures incoming transaction volume; out-degree measures outbound dispersal. An elevated out-degree-to-in-degree ratio often indicates fund fragmentation.

