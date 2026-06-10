export interface User {
  id: string;
  email: string;
  tier: 'A' | 'B' | 'C' | 'D';
  paidUntil: Date | null;
}