# Aegis Bank Intelligence 🛡️
### Banking Simulation, Transaction Graph Intelligence & Financial Crime Investigation Platform

> **SIMULATION ENVIRONMENT — SYNTHETIC DATA ONLY**  
> Built as an advanced Data Structures and Algorithms (DSA) microproject and fintech engineering platform. Demonstrates graph algorithms, ACID-compliant ledger transactions, explainable heuristic fraud detection, and a high-contrast Black, White, and Mandarin Orange enterprise UI.

---

## 1. Executive Abstract

**Aegis Bank Intelligence** is a full-stack financial operations simulation and fraud investigation platform. It models real-world core banking primitives—including double-entry-style atomic transfers, daily allowance enforcement, and status-restricted account operations—coupled with an in-memory directed graph intelligence engine implemented in **Python 3**.

Unlike static educational prototypes, every button executes real database transactions and invokes authentic graph traversal algorithms:
- **Depth-First Search (DFS)** with a 3-color recursion stack to detect directed circular fund loops (e.g. $A \to B \to C \to A$).
- **Breadth-First Search (BFS)** utilizing `collections.deque` for true level-order traversal and shortest hop blast-radius tracing.
- **Explainable Risk Scoring (0–100)** evaluating topological fan-out dispersion, velocity bursts, and threshold breaches with zero demographic bias.

---

## 2. System Architecture

Aegis enforces strict client-server role separation and distinct user experiences:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AEGIS BANK INTELLIGENCE                         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     CUSTOMER BANKING PORTAL   │               │   ADMIN FRAUD INTELLIGENCE    │
│            (/customer)        │               │            (/admin)           │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • Balance & Allowance Gauges  │               │ • Interactive Network Flow    │
│ • Atomic Inter-Account Send   │               │ • DFS Cycle Highlighting      │
│ • Cash Deposit & Withdrawal   │               │ • BFS Blast Radius (1-5 Hops) │
│ • Daily & Monthly Limits      │               │ • Heuristic Risk Dossier      │
│ • Statement CSV Export        │               │ • Account Freeze Controls     │
│ • Persona Switcher            │               │ • Audit Logs & Cases Board    │
└──────────────┬────────────────┘               └───────────────┬───────────────┘
               │                                                │
               └───────────────────────┬────────────────────────┘
                                       │ REST APIs / CORS
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND (Python 3)                    │
│   Ledger Engine  •  Monitoring Engine  •  Audit Trail  •  Pydantic     │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           ▼                                                       ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│      PYTHON DSA ENGINE        │               │      DATABASE REPOSITORY      │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • Adjacency List (Directed)   │               │ • MySQL 8.0+ / SQLite Hybrid  │
│ • DFS 3-Color Cycle Detection │               │ • ACID Transactions           │
│ • BFS collections.deque       │               │ • Row Locks (FOR UPDATE)      │
│ • Centrality Metrics Engine   │               │ • Strict Parameterization     │
│ • Transparent 0-100 Scorer    │               │ • Seed Data Reset Hook        │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 16+ (App Router, Turbopack)
- **Library:** React 19, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 (Obsidian Black, Crisp White & Mandarin Orange `#ff7a00` Palette)
- **Graph Visualization:** `@xyflow/react` (React Flow) with custom nodes, animated edges, minimap, and inspector drawer
- **Data Visualization:** `Recharts` for risk band distribution
- **Icons:** `lucide-react`

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Data Validation:** Pydantic
- **Graph Algorithms:** Pure Python DSA (`collections.deque`, recursion stack, adjacency dicts)
- **Database Drivers:** `mysql-connector-python` and standard library `sqlite3`

### Database
- **Primary:** MySQL 8.0+ relational schema (`database/schema.sql` and `database/seed.sql`)
- **Portability Engine:** Seamless fallback to SQLite with identical parameterization and row-level transaction safety for zero-friction laptop demonstrations.

---

## 4. DSA Concepts & Mathematical Analysis

### A. Adjacency List Directed Graph
- **Representation:** `dict[str, list[str]]` mapping source account to destination accounts. Edge metadata (amount, tx_ref, timestamp) is stored in a hash map `dict[tuple[str, str], list[TransactionEdge]]`.
- **Why Adjacency List over Adjacency Matrix?**
  Financial networks are sparse graphs where $|E| \ll |V|^2$. An adjacency matrix requires $\Theta(V^2)$ space regardless of transfer density. The adjacency list optimizes space to $\Theta(V + E)$ and allows neighbor traversal in $O(\text{deg}(u))$ rather than $O(V)$.

### B. DFS Cycle Detection (3-Color State Machine)
- **Color States:**
  - `WHITE (0)`: Unvisited vertex.
  - `GRAY (1)`: Currently in the active recursion call stack (visiting).
  - `BLACK (2)`: Exploration finished; all descendants verified.
- **Back-Edge Principle:** In a directed graph, a directed cycle exists **if and only if** DFS encounters an edge $(u, v)$ where $v$ is `GRAY`.
- **Path Reconstruction:** Aegis maintains the current DFS trajectory stack `path: list[str]`. Upon discovering a back-edge $(u, v)$, the exact loop $v \to \dots \to u \to v$ is extracted, canonicalized (lexicographically rotated) to prevent duplicate reporting, and highlighted on the canvas.
- **Complexity:** Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

### C. BFS Fund Tracing & Blast Radius
- **FIFO Queue:** Implemented via Python's `collections.deque` with $O(1)$ amortized `append()` and `popleft()`.
- **Shortest Hop Property:** In an unweighted graph, BFS explores nodes level by level ($d = 0, 1, 2, \dots$), guaranteeing that the first time a counterparty is dequeued, it has been reached via the minimum number of intermediary hops.
- **Configurable Hop Boundary:** Search terminates when depth reaches $k$ (default 2 to 4), keeping worst-case exploration bounded by the local subgraph.
- **Complexity:** Time $\mathcal{O}(V_k + E_k)$, Space $\mathcal{O}(V_k)$.

### D. Explainable Heuristic Risk Scoring
Aegis eschews opaque black-box models in favor of a weighted, explainable 0–100 score strictly derived from observable ledger behaviors:
1. **Cycle Participation (`RULE_CYCLE_PARTICIPATION`):** $+35$ pts (circular fund routing).
2. **High Outgoing Fan-Out (`RULE_HIGH_DISPERSION`):** $+20$ to $+25$ pts ($\ge 3$ distinct recipients).
3. **Transit Passthrough Flow (`RULE_PASSTHROUGH_FLOW`):** $+15$ pts ($\ge 70\%$ match between inflow and outflow).
4. **Near-Threshold Daily Usage (`RULE_LIMIT_PROXIMITY`):** $+15$ pts ($\ge 80\%$ daily transfer limit consumed).
5. **High-Frequency Velocity Burst (`RULE_BURST_ACTIVITY`):** $+15$ pts ($\ge 3$ outbound transfers within 5 minutes).
6. **Large Single Value (`RULE_LARGE_AMOUNT`):** $+10$ pts (exceeding $\$4,000.00$ threshold).

*Ethical Requirement:* Demographic attributes (age, occupation, income) are displayed for context only and never contribute to suspicious points.

---

## 5. Seeded Fraud Scenarios

| Scenario | Pattern | Accounts Involved | Observable Signal |
| :--- | :--- | :--- | :--- |
| **Circular Loop** | $A \to B \to C \to A$ | `ACC-2001`, `ACC-2002`, `ACC-2003` | Detected by DFS; pulsing orange loop; $+35$ risk points |
| **Layering Chain** | $D \to E \to F \to G$ | `ACC-2004` $\to$ `2005` $\to$ `2006` $\to$ `2007` | Traced by BFS blast radius across 3 hops |
| **Fan-Out Dispersion** | Rapid multi-party distribution | `ACC-2008` $\to$ `2009`, `2010`, `2011`, `2012` | High out-degree ($4$), $+25$ risk points |
| **Velocity Burst** | Rapid consecutive transfers | `ACC-2009` $\to$ `ACC-2011` | $3$ transfers in $< 5$ minutes; triggers burst alert |
| **Normal Baseline** | Everyday utility & deposits | `ACC-2013`, `ACC-2014` | Normal risk band ($< 40$), clean transaction history |

---

## 6. Project Directory Layout

```text
aegis-bank-intelligence/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Root Gateway & Portal Selection
│   │   │   ├── login/page.tsx         # Dedicated Authentication Gateway
│   │   │   ├── customer/page.tsx      # Dedicated Customer Banking Portal
│   │   │   ├── admin/page.tsx         # Dedicated Fraud Intelligence Console
│   │   │   ├── layout.tsx             # Root layout & AuthProvider
│   │   │   └── globals.css            # Dark mode & Mandarin Orange tokens
│   │   ├── components/
│   │   │   ├── common/                # Navbar, Sidebar, SimulationBanner
│   │   │   └── graph/                 # AccountNode, TransactionEdge, NetworkGraph
│   │   ├── context/                   # AuthContext for role persistence
│   │   ├── features/
│   │   │   ├── customer/              # Dashboard, Transfer, Deposit, History, Limits
│   │   │   └── investigation/         # Overview, NetworkExplorer, Alerts, Directory, Cases
│   │   ├── lib/api.ts                 # Typed REST Client
│   │   └── types/index.ts             # TypeScript entity definitions
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/                       # Customers, Ledger, Investigation, Alerts, Admin
│   │   ├── core/                      # Config, Database Engine (MySQL + SQLite)
│   │   ├── dsa/                       # Graph, DFS, BFS, Metrics, RiskEngine
│   │   ├── repositories/              # Atomic Ledger, Row Locking, Constraints
│   │   ├── services/                  # GraphService, MonitoringService
│   │   └── main.py                    # FastAPI entrypoint
│   ├── tests/
│   │   ├── test_dsa.py                # 8 comprehensive DSA unit tests
│   │   ├── test_ledger.py             # 6 atomic ledger tests
│   │   └── test_api.py                # 5 REST endpoint integration tests
│   ├── requirements.txt
│   └── .env.example
├── database/
│   ├── schema.sql                     # Relational MySQL 8.0+ schema DDL
│   └── seed.sql                       # 14 synthetic customer & account records
└── README.md
```

---

## 7. Installation & Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Start Backend API
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API will start on `http://localhost:8000`. Interactive Swagger documentation is available at `http://localhost:8000/docs`.*

### Step 2: Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
*Frontend will launch on `http://localhost:3000`.*

---

## 8. Verification & Automated Test Suite

Aegis includes 19 automated unit and integration tests covering graph algorithms, edge cases, atomic ledger operations, and server-side limits:

```bash
# Run all tests with pytest
python -m pytest backend/tests -v -o pythonpath=backend
```

**Results:**
- `test_empty_graph` — PASSED
- `test_dfs_cycle_detection` — PASSED
- `test_dfs_acyclic_graph` — PASSED
- `test_bfs_fund_tracing` — PASSED
- `test_bfs_unknown_account` — PASSED
- `test_graph_metrics` — PASSED
- `test_risk_scoring_bounds_and_explanations` — PASSED
- `test_canonicalize_cycle` — PASSED
- `test_deposit_and_withdraw` — PASSED
- `test_atomic_transfer_success` — PASSED
- `test_transfer_insufficient_funds` — PASSED
- `test_transfer_per_tx_limit_exceeded` — PASSED
- `test_transfer_frozen_account` — PASSED
- `test_idempotency_protection` — PASSED
- `test_health` — PASSED
- `test_get_accounts` — PASSED
- `test_investigation_overview_and_dfs` — PASSED
- `test_bfs_endpoint` — PASSED
- `test_freeze_and_unfreeze_admin` — PASSED

---

## 9. 5-Minute Live Demonstration Plan (Viva Sequence)

1. **Gateway Landing (`http://localhost:3000`):**
   - Show the Black, White, and Mandarin Orange interface and persistent simulation banner.
   - Explain the dual architecture: Customer Retail Banking vs Admin Forensic Console.
2. **Customer Banking Portal (`/customer`):**
   - Point out Alice Vance (`ACC-2001`) with available balance and daily limit gauge.
   - Execute an atomic transfer of $\$500.00$ to Bob Martinez (`ACC-2002`). Show instant receipt with transaction hash, updated balance, and server-side limit consumption.
   - Attempt an over-limit transfer of $\$15,000.00$ to prove server-side constraint enforcement.
3. **Authentication Gateway (`/login`):**
   - Click "Authentication Portal" in header. Show separate Customer Persona vs Admin Investigator login flows.
4. **Admin Fraud Intelligence Console (`/admin`):**
   - Show KPI metrics: 14 accounts, aggregate volume, open alerts, detected cycles.
   - Switch to **Network Explorer**:
     - Click **DFS Cycle Detection**: Point out the detected loop banner (`ACC-2001 → ACC-2002 → ACC-2003 → ACC-2001`) and the pulsing Mandarin Orange cycle edges. Click **View Trace** to explain the 3-color state machine.
     - Click **Trace Fund Flow (BFS)**: Show level-order traversal outward from `ACC-2004` through the layering chain (`ACC-2005 → ACC-2006 → ACC-2007`).
   - Click on node `ACC-2001`: Inspect the slide-over drawer showing in-degree, out-degree, flow volume, and transparent heuristic risk rules.
5. **Compliance Action & Audit Trail:**
   - In **Customer Directory**, click **Freeze** on `ACC-2010` (Jack Sullivan) with justification memo.
   - Navigate to **Audit Logs**: Show the immutable entry recorded with actor, action, timestamp, and details.
   - Click **Reset Seed Data** to demonstrate reproducible restoration to canonical presentation state.

---

## 10. Technical Viva Questions & Answers

### Q1: Why did you choose an Adjacency List over an Adjacency Matrix?
**Answer:** In bank transaction networks, most accounts only interact with a handful of counterparties. The graph is very sparse ($|E| \ll |V|^2$). An adjacency matrix allocates $|V| \times |V|$ memory regardless of transactions, which is wasteful and makes finding neighbors $O(V)$. An adjacency list requires only $O(V + E)$ memory and retrieves neighbors in $O(\text{out-degree})$, which is optimal for traversal algorithms.

### Q2: How does your DFS detect cycles, and why does a cycle not prove money laundering?
**Answer:** DFS uses a 3-color state machine: White (unvisited), Gray (on current recursion stack), and Black (completed). If an edge leads to a Gray node, it is a back-edge, proving a directed cycle exists.  
A directed cycle indicates circular money velocity (round-tripping), which is an anomalous signal justifying review, but it is not legal proof of money laundering because legitimate circular payments exist (e.g., debt settlement chains, refund loops).

### Q3: Why does BFS guarantee shortest hop distances?
**Answer:** BFS uses a First-In-First-Out (FIFO) queue (`collections.deque`). It visits all vertices at hop distance $k$ before any vertices at distance $k+1$. Because every edge represents one transfer step (unweighted), the first time a counterparty vertex is discovered, the path taken must have the minimum number of hops.

### Q4: How does the application ensure balance integrity during simultaneous transfers?
**Answer:** Ledger operations run inside atomic database transactions using row-level locking (`SELECT ... FOR UPDATE` in MySQL, `BEGIN IMMEDIATE` in SQLite). Both the source debit and destination credit occur in the same transaction. If an error, insufficient fund, or limit violation occurs, the transaction aborts and rolls back completely, ensuring no money is created or destroyed.

### Q5: What is the time complexity of your BFS fund tracer?
**Answer:** The standard BFS complexity is $O(V + E)$. In our implementation, since we have a configurable hop limit $k$, the traversal explores only the bounded local subgraph $O(V_k + E_k)$, preventing unnecessary expansion across unrelated network clusters.
