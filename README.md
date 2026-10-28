# Aegis Bank Transaction Fraud Alert & Intelligence System 🛡️
### Banking Simulation, Transaction Graph Intelligence, Multi-Agent AI Forensics & Financial Crime Investigation Platform

> **SIMULATION ENVIRONMENT — SYNTHETIC DATA ONLY**  
> An advanced full-stack fintech engineering and Data Structures & Algorithms (DSA) platform demonstrating ACID-compliant core banking operations, in-memory directed graph forensics, explainable heuristic fraud detection, and an AI Fraud Forensic engine featuring Bayesian updating, AO* heuristic graph search, DSU disjoint-set clustering, and receipt image tampering analysis.

---

## 1. Executive Abstract

**Aegis Bank Intelligence** is an enterprise-grade banking simulation and fraud detection platform designed to detect, trace, and prevent fraudulent financial activities in real time. 

Unlike static mockups, every interaction executes real transactional workflows and invokes authentic algorithmic engines:
- **Core Banking Primitives:** Double-entry atomic transfers, balance enforcement, daily/monthly limit gauges, status-restricted operations (account freezing), and cash deposit/withdrawal ledger operations.
- **Python Graph Intelligence Engine:** In-memory directed adjacency-list graph processing Depth-First Search (DFS) 3-color circular fund cycle detection and Breadth-First Search (BFS) blast-radius hop tracing.
- **AI Fraud Forensics Suite:**
  - **Bayesian Sequential Updating:** Multi-evidence probabilistic risk assessment combining prior risk with observed anomalous signals.
  - **AO\* Heuristic AND/OR Search:** Optimal fraud proof-tree generation demonstrating goal decomposition and rule convergence.
  - **DSU (Disjoint Set Union / Union-Find):** Dynamic clustering of suspicious entity networks and connected fraud syndicates.
  - **Document & Image Forensics:** OpenCV-powered Error Level Analysis (ELA), OCR invoice/receipt verification, and metadata inconsistency checks.
  - **Interactive Forensic AI Copilot:** Real-time conversational investigation assistant with full case context.

---

## 2. System Architecture

Aegis enforces a unified full-stack architecture with strict client-server role separation:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AEGIS BANK INTELLIGENCE                                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│  CUSTOMER BANKING PORTAL  │   │  ADMIN FRAUD CONSOLE      │   │   AI FRAUD & FORENSICS    │
│        (/customer)        │   │         (/admin)          │   │        (/ai-fraud)        │
├───────────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
│ • Balance & Limits Gauge  │   │ • Interactive Graph View  │   │ • Receipt / ELA Analyzer  │
│ • Atomic Inter-Account Tx │   │ • DFS Cycle Highlighting  │   │ • Bayesian Likelihood Post│
│ • Cash Deposit / Withdraw │   │ • BFS Hop Blast-Radius    │   │ • AO* Proof Tree Graph    │
│ • Transaction History CSV │   │ • Heuristic Risk Dossier  │   │ • DSU Syndicate Clusters  │
│ • Persona Switcher        │   │ • Freeze / Unfreeze Accts │   │ • Interactive AI Copilot  │
└─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                               │                               │
              └───────────────────────┬───────┴───────────────────────────────┘
                                      │ REST APIs / CORS
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND (Python 3.11+)                           │
│  Ledger Engine  •  Monitoring Engine  •  Audit Trail  •  AI Forensics  •  Chat Copilot │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│     PYTHON DSA ENGINE     │   │     AI FRAUD ENGINE       │   │    DATABASE REPOSITORY    │
├───────────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
│ • Directed Adjacency List │   │ • Bayesian Probability    │   │ • MySQL 8.0+ / SQLite     │
│ • DFS 3-Color Cycle Check │   │ • AO* Heuristic Search    │   │ • ACID Atomic Transfers   │
│ • BFS Deque Blast-Radius  │   │ • DSU Syndicate Grouping  │   │ • Row Locks (FOR UPDATE)  │
│ • Centrality Metrics      │   │ • OpenCV Image ELA & OCR  │   │ • Strict Parameterization │
│ • 0–100 Risk Scorer       │   │ • Benchmark Test Cases    │   │ • Idempotency & Auditing  │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 16+ (React 19, TypeScript Strict Mode, Turbopack)
- **Styling:** Tailwind CSS (Enterprise Obsidian Black, Crisp White & Mandarin Orange `#ff7a00` accents)
- **Graph Visualization:** `@xyflow/react` (React Flow) with animated directional flows, minimap, custom nodes, and inspector drawer
- **Forensic & Data Visualizations:** Recharts for risk bands, HTML Canvas for ELA and heatmaps, Cytoscape / SVG for AO* proof trees
- **Icons & UI:** `lucide-react`, headless transition primitives

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Data Validation & Serializers:** Pydantic v2
- **Image & Document Processing:** OpenCV (`opencv-python-headless`), Pillow (`PIL`), Tesseract OCR (`pytesseract`)
- **Graph & Algorithms:** Pure Python DSA (`collections.deque`, recursion stack, disjoint set union, memoization)
- **Database Engine:** MySQL 8.0+ relational schema with automatic seamless zero-config fallback to SQLite for local demonstration

---

## 4. Core Algorithms & Mathematical Foundations

### A. Adjacency List Directed Graph
- **Representation:** `dict[str, list[str]]` mapping source accounts to destination accounts with hash-mapped edge attributes (timestamps, amounts, transaction references).
- **Space Complexity:** $\mathcal{O}(V + E)$ space, avoiding the $\Theta(V^2)$ overhead of adjacency matrices in sparse financial networks ($|E| \ll |V|^2$). Traversal for node $u$ runs in $\mathcal{O}(\text{deg}(u))$.

### B. DFS 3-Color Circular Cycle Detection
- **Color State Machine:**
  - `WHITE (0)`: Unvisited vertex.
  - `GRAY (1)`: Currently on active recursion stack.
  - `BLACK (2)`: Node and all child paths thoroughly explored.
- **Back-Edge Theorem:** A directed cycle exists if and only if an edge points to a `GRAY` vertex.
- **Loop Canonicalization:** Lexicographical rotation prevents duplicate cycles ($A \to B \to C \to A \equiv B \to C \to A \to B$).
- **Complexity:** Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

### C. BFS Layered Blast-Radius Tracing
- **FIFO Queue:** Implemented via Python's `collections.deque` with $O(1)$ amortized push/pop.
- **Shortest Hop Property:** Evaluates vertices level-by-level ($k = 1, 2, \dots$), guaranteeing the earliest visit to any counterparty represents the shortest chain of intermediary hops.
- **Bounded Exploration:** Configurable boundary hop limit $k$ bounds complexity to the local subgraph $\mathcal{O}(V_k + E_k)$.

### D. Bayesian Sequential Updating
- Continuously refines risk probability given prior baseline $P(\text{Fraud})$ and conditional likelihoods of multiple independent or correlated fraud signals:
  $$P(\text{Fraud} \mid E_1, E_2, \dots, E_n) = \frac{P(\text{Fraud}) \prod_{i=1}^n P(E_i \mid \text{Fraud})}{P(E)}$$
- Yields a continuous, calibrated posterior confidence score without arbitrary magic constants.

### E. AO\* Heuristic AND/OR Search
- Decomposes high-level fraud hypotheses into AND branches (all sub-conditions required, e.g., mismatched UTR AND altered font) and OR branches (alternative indicators).
- Computes heuristic cost estimates $h(n)$ and discovers the optimal proof tree validating fraud presence with minimal evaluation overhead.

### F. Disjoint Set Union (DSU / Union-Find)
- Implements path compression and union-by-rank to group accounts and counterparties into connected fraud syndicates in near $\mathcal{O}(\alpha(N))$ time.

### G. OpenCV Error Level Analysis (ELA) & Image Forensics
- Resaves incoming transaction receipts/vouchers at a fixed compression ratio and analyzes pixel error discrepancies. High compression variances identify digital manipulation (e.g. cut-and-paste amount tampering).

---

## 5. Seeded Fraud Scenarios & Benchmarks

| Scenario | Architectural Pattern | Accounts / Inputs | Observable Signal |
| :--- | :--- | :--- | :--- |
| **Circular Loop** | $A \to B \to C \to A$ | `ACC-2001`, `ACC-2002`, `ACC-2003` | Flagged by 3-color DFS; pulsing cycle visual; $+35$ risk score |
| **Layering Chain** | $D \to E \to F \to G$ | `ACC-2004` $\to$ `2005` $\to$ `2006` $\to$ `2007` | Traced by BFS blast-radius across 3 hops |
| **Fan-Out Dispersion** | Rapid multi-party split | `ACC-2008` $\to$ `2009`, `2010`, `2011`, `2012` | High out-degree ($\ge 4$); $+25$ risk score |
| **Velocity Burst** | Rapid consecutive transfers | `ACC-2009` $\to$ `ACC-2011` | 3 transfers in $< 5$ minutes; triggers burst alert |
| **Tampered Receipt** | Visual ELA & UTR check | Uploaded UPI/Bank Voucher | ELA compression anomalies + invalid UTR checksum flagged by AO* |
| **Syndicate Clustering** | Shared mule network | Dispersed mule accounts | DSU merges connected components into linked syndicate |

---

## 6. Project Directory Layout

```text
Bank_Transaction_Fraud_Alert_System/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Root Gateway & Portal Selection
│   │   │   ├── login/page.tsx         # Dedicated Authentication Portal
│   │   │   ├── customer/page.tsx      # Customer Retail Banking Portal
│   │   │   ├── admin/page.tsx         # Admin Fraud Intelligence Console
│   │   │   ├── ai-fraud/page.tsx      # AI Forensic Verification & Document Studio
│   │   │   ├── layout.tsx             # Root layout & Theme Providers
│   │   │   └── globals.css            # Dark mode & Mandarin Orange tokens
│   │   ├── components/
│   │   │   ├── AIFraudDetection/      # AI Forensics, AO* Proof Tree, Bayes, DSU
│   │   │   ├── ChatPanel/             # Interactive AI Forensic Copilot
│   │   │   ├── DocumentIntelligence/  # OCR & Forensic ELA Inspection
│   │   │   ├── common/                # Navigation, SimulationBanner, Badges
│   │   │   └── graph/                 # AccountNode, TransactionEdge, NetworkGraph
│   │   ├── context/                   # AuthContext for role persistence
│   │   ├── features/
│   │   │   ├── customer/              # Balances, Transfers, History, Limits
│   │   │   └── investigation/         # Network Explorer, Case Files, Alert Board
│   │   ├── lib/api.ts                 # Full typed REST client
│   │   └── types/index.ts             # TypeScript entity definitions
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/                       # Customers, Ledger, Investigation, AI Fraud, Chat
│   │   ├── core/                      # Config, Database Engine (MySQL + SQLite)
│   │   ├── dsa/                       # Graph, DFS, BFS, Centrality, Heuristic Risk
│   │   ├── fraud_ai/                  # AO* Search, Bayesian Detector, DSU Engine, Receipt ELA
│   │   ├── repositories/              # Atomic Ledger, Row Locking, Constraints
│   │   ├── services/                  # GraphService, MonitoringService
│   │   └── main.py                    # FastAPI entrypoint
│   ├── tests/
│   │   ├── test_dsa.py                # Graph algorithm unit tests
│   │   ├── test_ledger.py             # Atomic ledger integrity tests
│   │   └── test_api.py                # REST endpoint integration tests
│   ├── requirements.txt
│   └── .env.example
├── database/
│   ├── schema.sql                     # Relational MySQL 8.0+ schema DDL
│   └── seed.sql                       # Synthetic customer & account records
├── dev.sh                             # One-command dual server launcher
└── README.md
```

---

## 7. Installation & Quickstart

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- *(Optional)* **Tesseract OCR** (`sudo apt install tesseract-ocr`) and **MySQL 8.0+** (defaults automatically to SQLite if MySQL is absent).

### Quickstart (Single Command)
Run the bundled development launcher:
```bash
chmod +x dev.sh
./dev.sh
```
This script launches:
- **Backend API:** `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)
- **Frontend App:** `http://localhost:3000`

---

### Manual Setup

#### Step 1: Start Backend API
```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 2: Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3000
```

---

## 8. Automated Test Suite

Aegis includes automated unit and integration tests covering graph algorithms, edge cases, atomic ledger operations, and server-side limits:

```bash
# Run all backend tests with pytest
python -m pytest backend/tests -v -o pythonpath=backend
```

**Key Test Coverage:**
- `test_empty_graph` & `test_canonicalize_cycle`
- `test_dfs_cycle_detection` & `test_dfs_acyclic_graph`
- `test_bfs_fund_tracing` & `test_bfs_unknown_account`
- `test_graph_metrics` & `test_risk_scoring_bounds_and_explanations`
- `test_deposit_and_withdraw` & `test_atomic_transfer_success`
- `test_transfer_insufficient_funds` & `test_transfer_per_tx_limit_exceeded`
- `test_transfer_frozen_account` & `test_idempotency_protection`
- `test_investigation_overview_and_dfs` & `test_freeze_and_unfreeze_admin`

---

## 9. Live Demonstration & Walkthrough Guide

1. **Gateway Landing (`http://localhost:3000`):**
   - Review system health and connected database engine status.
   - Choose between **Customer Banking**, **Fraud Intelligence Console**, or **AI Fraud Detection**.
2. **Customer Banking Portal (`/customer`):**
   - Check balances and daily transfer limits for `Alice Vance` (`ACC-2001`).
   - Execute an atomic transfer of $\$500.00$ to `Bob Martinez` (`ACC-2002`). Observe updated balance, dynamic limit consumption, and instant cryptographic transaction reference.
   - Attempt an over-limit transfer ($\$15,000.00$) to verify transactional limit enforcement.
3. **Admin Fraud Intelligence Console (`/admin`):**
   - View top-level KPIs: Active accounts, monitored transactions, cycle warnings, and frozen accounts.
   - **DFS Cycle Detection:** Discover circular funds (`ACC-2001 → ACC-2002 → ACC-2003 → ACC-2001`) with highlighted animated edges and recursion stack trace.
   - **BFS Blast-Radius:** Trace multi-hop layered money distribution outward from `ACC-2004`.
   - Freeze a compromised account with an immutable compliance audit record.
4. **AI Fraud Detection & Forensics (`/ai-fraud`):**
   - **Voucher ELA & Tamper Analysis:** Upload a payment receipt or test sample to analyze compression artifacts, OCR discrepancy, and invalid UTR checksums.
   - **Bayesian Risk Updating:** Observe the posterior probability calculation adapting as multi-source risk signals are evaluated.
   - **AO\* Proof Search:** Inspect the generated AND/OR proof tree showing why a transaction or voucher was flagged.
   - **Forensic AI Copilot:** Ask questions directly to the investigator chat assistant about transaction anomalies.

---

## 10. Technical Viva Q&A

### Q1: Why use an Adjacency List over an Adjacency Matrix?
**Answer:** Financial transaction graphs are sparse graphs where $|E| \ll |V|^2$. An adjacency matrix allocates $\Theta(V^2)$ memory regardless of transactions, which is wasteful and makes finding neighbors $\mathcal{O}(V)$. An adjacency list requires only $\mathcal{O}(V + E)$ memory and retrieves outbound neighbors in $\mathcal{O}(\text{deg}(u))$, which is optimal for real-time traversal.

### Q2: How does the DFS 3-Color algorithm detect cycles?
**Answer:** DFS assigns nodes three states: White (unvisited), Gray (currently visiting on recursion stack), and Black (fully explored). If an edge targets a Gray node, it represents a back-edge, confirming the existence of a directed cycle. Path canonicalization ensures identical circular loops are not duplicated in the investigation report.

### Q3: Why does BFS guarantee shortest-hop distance in blast-radius tracing?
**Answer:** BFS operates via a FIFO queue (`collections.deque`), exploring nodes in order of their hop distance ($k, k+1, \dots$). In an unweighted transaction graph, the first time a counterparty is reached, the path taken is mathematically guaranteed to have the minimum number of hops.

### Q4: How does the platform preserve transactional integrity during simultaneous transfers?
**Answer:** All balance mutations run inside ACID database transactions using row-level locking (`SELECT ... FOR UPDATE` in MySQL, `BEGIN IMMEDIATE` in SQLite). Both the debit and credit are atomic. If an error, insufficient fund, or limit violation occurs, the transaction aborts and rolls back completely, preventing race conditions and phantom balances.

### Q5: How do Bayesian updating and AO\* search enhance fraud detection beyond simple rules?
**Answer:** Rule thresholds can be brittle. Bayesian updating provides a mathematically calibrated posterior probability by combining prior baseline risks with cumulative likelihoods of observed evidence (tampering, velocity, out-degree). AO\* search decomposes complex fraud hypotheses into structured AND/OR dependency goals, producing an interpretable proof tree that pinpoints the exact conditions proving fraudulent intent.

---

## 11. License

This project is licensed under the MIT License — see the [LICENSE](file:///run/media/allen/Allen/ALLEN/PROJECT/Bank%20Transaction%20Fraud%20Alert%20System/Bank_Transaction_Fraud_Alert_System/LICENSE) file for details.
