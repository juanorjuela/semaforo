export type UserRole = 'super-admin' | 'day-manager';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  defaultHourlyWage?: number;
  healthInsuranceProvider?: string;
  healthInsurancePolicy?: string;
  backgroundNotes?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export type EventStatus = 'draft' | 'active' | 'completed';

export interface Event {
  id: string;
  name: string;
  venueName: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  createdAt: number;
  updatedAt: number;
}

export interface EventDay {
  id: string;
  eventId: string;
  date: string;
  createdAt: number;
}

export type PaymentStatus = 'pending' | 'paid';

export interface ShiftAssignment {
  id: string;
  eventId: string;
  eventDayId: string;
  staffMemberId: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  hourlyWage: number;
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  paidAt?: number;
  paidBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  details: string;
  timestamp: number;
}

export interface DaySummary {
  date: string;
  eventDayId: string;
  staffCount: number;
  totalHours: number;
  totalPay: number;
  pendingCount: number;
  paidCount: number;
}

export interface AssignmentWithStaff extends ShiftAssignment {
  staffName: string;
}
