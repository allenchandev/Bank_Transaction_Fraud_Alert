import { Transaction, Account } from '../types';

const accountNames = [
  "Alice Smith", "Bob Johnson", "Charlie Brown", "Diana Prince",
  "Shell Company A", "Shady LLC", "Fake Trading Co", "Eve Adams",
  "Frank Castle", "George King", "Hannah Lee", "Ian Wright",
  "Julia Child", "Kevin Hart", "Laura Croft", "Mike Tyson"
];

export const mockAccounts: Account[] = Array.from({ length: 16 }, (_, i) => ({
  id: `ACC${(i + 1).toString().padStart(3, '0')}`,
  name: accountNames[i]
}));

// Generates transactions that include cycles and varying degrees
export const mockTransactions: Transaction[] = [
  // Normal flow
  { id: 'T01', senderId: 'ACC001', receiverId: 'ACC002', amount: 500, timestamp: '2023-10-01T10:00:00Z' },
  { id: 'T02', senderId: 'ACC002', receiverId: 'ACC004', amount: 300, timestamp: '2023-10-01T11:00:00Z' },
  { id: 'T03', senderId: 'ACC004', receiverId: 'ACC005', amount: 150, timestamp: '2023-10-01T12:00:00Z' },
  
  // Cycle 1: ACC005 -> ACC006 -> ACC007 -> ACC005 (Potential laundering)
  { id: 'T04', senderId: 'ACC005', receiverId: 'ACC006', amount: 1000, timestamp: '2023-10-02T09:00:00Z' },
  { id: 'T05', senderId: 'ACC006', receiverId: 'ACC007', amount: 950, timestamp: '2023-10-02T10:00:00Z' },
  { id: 'T06', senderId: 'ACC007', receiverId: 'ACC005', amount: 900, timestamp: '2023-10-02T11:00:00Z' },

  // Hub account (high out-degree)
  { id: 'T07', senderId: 'ACC008', receiverId: 'ACC001', amount: 5000, timestamp: '2023-10-03T08:00:00Z' },
  { id: 'T08', senderId: 'ACC008', receiverId: 'ACC009', amount: 4500, timestamp: '2023-10-03T08:05:00Z' },
  { id: 'T09', senderId: 'ACC008', receiverId: 'ACC010', amount: 4800, timestamp: '2023-10-03T08:10:00Z' },
  { id: 'T10', senderId: 'ACC008', receiverId: 'ACC011', amount: 5200, timestamp: '2023-10-03T08:15:00Z' },

  // Cycle 2: Short cycle ACC012 -> ACC013 -> ACC012
  { id: 'T11', senderId: 'ACC012', receiverId: 'ACC013', amount: 200, timestamp: '2023-10-04T14:00:00Z' },
  { id: 'T12', senderId: 'ACC013', receiverId: 'ACC012', amount: 190, timestamp: '2023-10-04T15:00:00Z' },

  // Long trace for BFS
  { id: 'T13', senderId: 'ACC011', receiverId: 'ACC014', amount: 1000, timestamp: '2023-10-05T09:00:00Z' },
  { id: 'T14', senderId: 'ACC014', receiverId: 'ACC015', amount: 900, timestamp: '2023-10-05T10:00:00Z' },
  { id: 'T15', senderId: 'ACC015', receiverId: 'ACC016', amount: 800, timestamp: '2023-10-05T11:00:00Z' },
  
  // Extra noise
  { id: 'T16', senderId: 'ACC003', receiverId: 'ACC002', amount: 50, timestamp: '2023-10-06T10:00:00Z' },
];
