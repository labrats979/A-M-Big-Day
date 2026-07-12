export type UserRole = 'admin' | 'groomsman' | 'bridesmaid' | 'guest';

export interface Guest {
  id: string;
  name: string;
  role: UserRole;
  rsvpStatus: 'going' | 'declined' | 'pending';
  tableId: string | null;
  seatIndex: number | null; // 0-indexed position at the table
  familyName?: string;       // Name of the family, e.g. "Smith Family"
  age?: number;              // Age of the guest
}

export interface Table {
  id: string;
  name: string;
  x: number; // percentage layout coordinate
  y: number; // percentage layout coordinate
  seatsCount: number;
  type?: 'round_table' | 'rectangular_table' | 'stage' | 'dance_floor' | 'bar' | 'decoration';
  width?: number;  // custom dimension width
  height?: number; // custom dimension height
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  paid: boolean;
  dueDate?: string;
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  contact: string;
  email: string;
  cost: number;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  time: string;
  location: string;
  targetSide: 'groomsman' | 'bridesmaid' | 'all';
}

export interface Message {
  id: string;
  senderName: string;
  role: UserRole;
  content: string;
  timestamp: string;
  imageUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  stage: 'preparation' | 'ceremony' | 'reception' | 'post-wedding';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
}

export interface WeddingData {
  guests: Guest[];
  tables: Table[];
  expenses: Expense[];
  vendors: Vendor[];
  schedule: ScheduleItem[];
  messages: Message[];
  tasks: Task[];
}
