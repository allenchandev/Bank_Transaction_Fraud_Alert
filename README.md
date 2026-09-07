# 🛡️ Bank Transaction Fraud Alert System

An interactive, visual fraud detection and transaction monitoring system powered by core **Data Structures and Algorithms (DSA)** such as **Directed Graphs**, **Depth-First Search (DFS)**, and **Breadth-First Search (BFS)** with a modern React & Tailwind CSS dashboard.

---

## 📌 Overview

Millions of financial transactions occur daily. Analyzing spreadsheets or tabular logs manually is slow and ineffective for spotting coordinated criminal activity. The **Bank Transaction Fraud Alert System** models financial transactions as a directed network graph to detect suspicious patterns, money laundering cycles, and fund diffusion in real time.

---

## ✨ Key Features

- **🌐 Interactive Network Graph Visualization:** Visualizes accounts as nodes and directed money transfers as edges.
- **🔄 Circular Fund Transfer / Cycle Detection (DFS):** Detects money laundering loops ($A \rightarrow B \rightarrow C \rightarrow A$) automatically using recursion and recursion stack tracking.
- **🎯 Blast Radius & Account Reachability (BFS):** Traces where stolen or flagged funds can travel within $N$ transaction hops using a queue-based exploration.
- **📊 Risk Scoring & Ranking Algorithm:** Evaluates accounts based on in-degree, out-degree, transaction volume, and cycle participation to assign actionable risk scores ($0-100$).
- **💡 Educational & Operational Explanations:** Intuitive guides and built-in FAQ explaining technical graph concepts to both technical developers and non-technical compliance staff.

---

## 🧠 Data Structures & Algorithms (DSA) Mapping

| DSA Concept | Real-World Fraud Detection Application |
| :--- | :--- |
| **Directed Graph ($G = (V, E)$)** | Represents the entire banking network where **Nodes ($V$)** are accounts and **Directed Edges ($E$)** are fund transfers. |
| **Adjacency List** | Fast lookup structure (`Record<string, string[]>`) to map accounts to recipient accounts. |
| **Depth-First Search (DFS)** | Detects cycles and circular transaction loops indicative of layering and money laundering. |
| **Breadth-First Search (BFS)** | Calculates the reachability / "blast radius" of compromised accounts across $N$ hops using a FIFO Queue. |
| **In-Degree & Out-Degree** | Evaluates hub behaviors and high-volume transaction dispersal. |
| **Sorting & Heuristics** | Ranks suspicious accounts by composite risk score and activity volume. |

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Motion
- **Graph Algorithms:** Custom TypeScript DSA implementations (`/DSA/DFS.ts`, `/DSA/BFS.ts`)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/allenchandev/Bank_Transaction_Fraud_Alert.git
   cd Bank_Transaction_Fraud_Alert_System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
Bank_Transaction_Fraud_Alert_System/
├── DSA/                      # Core Graph and Traversal Algorithms
│   ├── BFS.ts                # Breadth-First Search (Reachability / Blast Radius)
│   ├── DFS.ts                # Depth-First Search (Cycle & Loop Detection)
│   └── Terms.md              # DSA Terminology & Concepts explanation
├── src/
│   ├── components/           # Interactive UI Components & Visualizations
│   │   ├── InteractiveDashboard.tsx
│   │   ├── NetworkGraph.tsx
│   │   ├── VisualGraph.tsx
│   │   └── Overview.tsx
│   ├── lib/                  # Graph utility helpers & mock transaction data
│   │   ├── graph.ts
│   │   └── mockData.ts
│   ├── types.ts              # TypeScript interfaces & types
│   ├── App.tsx               # Root component
│   └── main.tsx              # Application entry point
├── package.json
└── vite.config.ts
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
