<div align="center">

# Aegis — Bank Transaction Fraud Alert & Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

**A high-performance banking simulation and real-time financial crime investigation platform combining ACID-compliant transaction processing, in-memory graph intelligence, and multi-agent AI forensic verification.**

[Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [AI & DSA Engines](#-core-engines--algorithms) • [API Reference](#-api-endpoints) • [License](#-license)

---

</div>

## 📌 Overview

**Aegis** is an end-to-end fintech operations and fraud detection suite. It couples double-entry core retail banking workflows with an intelligence engine that discovers circular fund routing, layering chains, mule accounts, and tampered payment proofs in real time.

Built for both **everyday banking simulation** and **deep forensic investigation**, Aegis gives compliance teams instant graph-level visibility into suspicious transaction networks while offering customers an intuitive banking portal.

---

## ✨ Key Features

### 🏦 Retail Banking Portal (`/customer`)
- **Atomic Double-Entry Transfers:** Strict ACID-compliant ledger transactions with instant hash references.
- **Dynamic Limits & Allowance Gauges:** Real-time enforcement of per-transaction and 24-hour aggregate limits.
- **Cash Operations:** Instant cash deposits, withdrawals, and balance recalculations.
- **Exportable Statement History:** Full searchable history with CSV ledger exports.
- **Multi-Persona Testing:** Seamless switching between synthetic customer accounts.

### 🛡️ Fraud Intelligence Console (`/admin`)
- **Interactive Transaction Network:** Real-time directed graph visualization using React Flow (`@xyflow/react`).
- **DFS Circular Loop Detection:** Detects circular money velocity ($A \to B \to C \to A$) via a 3-color state machine.
- **BFS Blast-Radius Tracing:** Hop-by-hop level-order traversal outward from suspicious accounts using `collections.deque`.
- **Explainable 0–100 Risk Scoring:** Transparent scoring based on velocity bursts, high fan-out dispersion, pass-through transit ratio, and proximity to thresholds.
- **Compliance Interventions:** Immediate account freezing with mandatory compliance audit logging.

### 🔬 Multi-Agent AI Forensics (`/ai-fraud`)
- **Voucher & Receipt ELA Analysis:** OpenCV-powered Error Level Analysis (ELA) to detect visual cut-and-paste manipulation.
- **Automated OCR Verification:** Text extraction and UTR/reference verification against ledger constraints.
- **Bayesian Sequential Updating:** Dynamically calculates posterior fraud likelihood as multi-source risk evidence accumulates.
- **AO\* Heuristic AND/OR Search:** Generates optimal, interpretable proof trees showing why transactions triggered risk rules.
- **DSU Syndicate Grouping:** Disjoint Set Union (Union-Find) clustering to uncover coordinated mule rings.
- **Forensic AI Copilot:** Interactive, context-aware chatbot for real-time case inquiry.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              AEGIS UNIFIED PLATFORM                              │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│   Customer Banking   │      │    Admin Console     │      │   AI Forensic Lab    │
│     (/customer)      │      │       (/admin)       │      │     (/ai-fraud)      │
└──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
           │                             │                             │
           └─────────────────────────────┼─────────────────────────────┘
                                         │ RESTful APIs / WebSocket
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND ENGINE                                 │
│    Ledger  •  Graph Traversal  •  Bayesian  •  AO* Search  •  ELA  •  Audit      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
┌───────────────────────────────┐               ┌──────────────────────────────────┐
│      IN-MEMORY DSA GRAPH      │               │       DATABASE REPOSITORY        │
│ • Directed Adjacency List     │               │ • MySQL 8.0+ / SQLite Auto Fallback│
│ • DFS 3-Color Cycle Detector  │               │ • ACID Transactions (Row Locks)  │
│ • BFS collections.deque       │               │ • Idempotency & Audit Logs       │
│ • DSU Syndicate Clustering    │               │ • Seed Data Reset Hook           │
└───────────────────────────────┘               └──────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**
- *(Optional)* MySQL 8.0+ *(Aegis automatically falls back to an embedded SQLite database if MySQL is not detected)*
- *(Optional)* Tesseract OCR (`sudo apt install tesseract-ocr`)

---

### Quick Start (One Command)

Aegis includes a unified launcher script that spins up both the frontend and backend servers simultaneously:

```bash
chmod +x dev.sh
./dev.sh
```

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:3000` | Landing gateway, Customer, Admin & AI portals |
| **Backend API** | `http://localhost:8000` | REST API |
| **Interactive Docs** | `http://localhost:8000/docs` | Swagger UI with test runners |

---

### Manual Setup

<details>
<summary><b>1. Backend Setup (FastAPI)</b></summary>

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
</details>

<details>
<summary><b>2. Frontend Setup (Next.js)</b></summary>

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev -- -p 3000
```
</details>

---

## 🧠 Core Engines & Algorithms

| Module | Technique | Purpose | Complexity |
| :--- | :--- | :--- | :--- |
| **Network Graph** | Directed Adjacency List | Sparse transaction network representation ($|E| \ll |V|^2$) | Space: $\mathcal{O}(V + E)$ |
| **Circular Loops** | DFS 3-Coloring | Identifies directed cycles with loop canonicalization | Time: $\mathcal{O}(V + E)$ |
| **Blast-Radius** | BFS FIFO Queue | Shortest-hop multi-tier transaction tracing | Time: $\mathcal{O}(V_k + E_k)$ |
| **Mule Clusters** | Disjoint Set Union (DSU) | Path compression + rank union to group fraud syndicates | Time: $\mathcal{O}(\alpha(N))$ |
| **Risk Scoring** | Bayesian Updating | Dynamically refines posterior fraud probability | Real-time |
| **Proof Search** | AO\* Heuristic Search | Explores AND/OR graphs for minimal fraud proof trees | Heuristic-guided |
| **Image Forensics** | Error Level Analysis (ELA) | Highlights compression discrepancies in manipulated receipts | Pixel-matrix diff |

---

## 📂 Project Structure

```text
├── frontend/                     # Next.js 16+ React Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Portal Gateway
│   │   │   ├── customer/page.tsx # Retail Banking Portal
│   │   │   ├── admin/page.tsx    # Fraud Intelligence Console
│   │   │   ├── ai-fraud/page.tsx # AI Forensic Studio
│   │   │   └── login/page.tsx    # Authentication Portal
│   │   ├── components/
│   │   │   ├── AIFraudDetection/ # Bayes, AO*, DSU, and Proof Tree UI
│   │   │   ├── ChatPanel/        # AI Copilot Assistant
│   │   │   ├── DocumentIntelligence/ # ELA & Receipt Analyzer
│   │   │   └── graph/            # React Flow interactive network canvas
│   │   └── lib/api.ts            # Typed API client
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                  # REST API routes (ledger, fraud, admin, chat)
│   │   ├── core/                 # Config & DB engine (MySQL + SQLite fallback)
│   │   ├── dsa/                  # Graph, DFS, BFS, Metrics, and Risk logic
│   │   ├── fraud_ai/             # AO*, Bayesian, DSU, and OpenCV ELA modules
│   │   ├── repositories/         # Row-locked atomic ledger operations
│   │   └── main.py               # Application entrypoint
│   └── tests/                    # Automated pytest suite
├── database/                     # MySQL DDL & Seed records
├── dev.sh                        # Dual-service dev script
└── README.md
```

---

## 🔌 API Endpoints

A complete interactive OpenAPI specification is available at `http://localhost:8000/docs`. Key routes include:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ledger/transfer` | Execute atomic inter-account transfer |
| `POST` | `/api/ledger/deposit` | Process account cash deposit |
| `POST` | `/api/ledger/withdraw` | Process cash withdrawal with balance check |
| `GET` | `/api/investigation/network` | Full directed transaction graph |
| `GET` | `/api/investigation/dfs/cycles` | Detected circular fund cycles with call stack |
| `GET` | `/api/investigation/bfs/blast-radius` | Bounded hop-level fund tracing |
| `POST` | `/api/fraud-ai/analyze-transaction` | Bayesian posterior & AO\* proof evaluation |
| `POST` | `/api/fraud-ai/analyze-receipt` | ELA image tamper inspection and OCR parsing |
| `POST` | `/api/chat/query` | Query forensic AI copilot |

---

## 🧪 Testing

Aegis includes automated test suites validating graph algorithms, transactional edge cases, and API routes:

```bash
python -m pytest backend/tests -v -o pythonpath=backend
```

```text
backend/tests/test_dsa.py::test_empty_graph PASSED
backend/tests/test_dsa.py::test_dfs_cycle_detection PASSED
backend/tests/test_dsa.py::test_bfs_fund_tracing PASSED
backend/tests/test_ledger.py::test_atomic_transfer_success PASSED
backend/tests/test_ledger.py::test_transfer_insufficient_funds PASSED
backend/tests/test_api.py::test_investigation_overview_and_dfs PASSED
...
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
