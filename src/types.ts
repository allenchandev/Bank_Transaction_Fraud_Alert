export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  timestamp: string;
}

export interface Account {
  id: string;
  name: string;
}

export type AdjacencyList = Record<string, string[]>;

export interface Cycle {
  path: string[];
}

export interface ReachableAccount {
  node: string;
  hops: number;
}

export interface AccountRanking {
  node: string;
  count: number;
  inDegree: number;
  outDegree: number;
  riskScore: number;
}
