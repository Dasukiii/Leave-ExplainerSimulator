export type User = { id: string; name: string; email: string; role: string; balances: { annual: number; sick: number; personal: number; parental: number }; hireDate: string; tenureYears: number; };

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isSimulation?: boolean;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  content: string;
}

export enum AppView {
  LANDING = 'LANDING',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  POLICIES = 'POLICIES',
  SETTINGS = 'SETTINGS',
}