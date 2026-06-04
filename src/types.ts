/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tenant {
  tenantId: string;
  name: string;
  residingSince: string; // YYYY-MM-DD
  roomNumber: string;
  bedNumber?: string; // e.g. "Bed A", "Seat 1", or "Bed 2"
  assignedBed?: string; // e.g. "Bed A", "Bed B", "Bed C"
  sharingType: string; // "Single" | "Double" | "Triple" | etc.
  address: string;
  phoneNumber: string;
  gender: string;
  mailId: string;
  password?: string;
  photoUrl: string; // URL or base64
  createdAt: string; // ISO string
  statusBadge: 'hostel' | 'leave' | 'late'; // "In Hostel" | "On Leave" | "Late Entry"
  rentAmount: number; // monthly PG rent
  paymentStatus: 'paid' | 'pending' | 'overdue'; // billing status
  dueDate: string; // YYYY-MM-DD
  onboarded?: boolean; // Tag for new tenant onboarding wizard completion status
  emergencyContact?: string; // Emergency Contact Name & Number
  securityDepositAmount?: number; // Security Deposit agreed
  securityDepositStatus?: 'paid' | 'pending' | 'refunded'; // Security Deposit status
  idProofType?: string; // ID proof category (Passport, Driving License, National ID, PAN, Aadhaar)
  idProofStatus?: 'verified' | 'pending' | 'rejected'; // ID proof verification stage
}

export interface GatePass {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  type: 'leave' | 'late-entry' | 'visitor';
  departureDate: string;
  returnDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  visitorName?: string;
  visitorRelation?: string;
  visitDate?: string;
  visitTime?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  urgency: 'info' | 'important' | 'critical';
  createdAt: string;
}

export interface MealFeedback {
  day: string;
  breakfastVotes: { up: number; down: number };
  lunchVotes: { up: number; down: number };
  dinnerVotes: { up: number; down: number };
  breakfastMenu?: string;
  breakfastSub?: string;
  lunchMenu?: string;
  lunchSub?: string;
  dinnerMenu?: string;
  dinnerSub?: string;
}

export interface TicketComment {
  id: string;
  authorRole: 'tenant' | 'manager';
  authorName: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  category: 'food' | 'housekeeping' | 'laundry' | 'maintenance' | 'sales' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  followupCount: number;
  comments: TicketComment[];
  assignedTo?: string;
}

export interface Notification {
  id: string;
  recipientRole: 'tenant' | 'manager';
  recipientId?: string; // Optional specific tenant ID
  title: string;
  message: string;
  ticketId?: string;
  createdAt: string;
  read: boolean;
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  dateStr: string; // YYYY-MM-DD
  status: 'active' | 'resolved'; // resolved means item found/returned
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  photoUrl: string; // Base64 or URL
  createdAt: string; // ISO string
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface RoomDoc {
  roomNumber: string;
  roomType: 'Single' | 'Double' | 'Triple';
  monthlyRent: string; // styled check with Indian Rupees symbol ₹
  totalCapacity: number;
  vacantSpots: number;
}

export interface RentPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  amount: number;
  paidAt?: string; // ISO format
  month: string; // e.g. "June 2026"
  status: 'paid' | 'pending';
}

export interface Salary {
  id: string;
  employeeName: string;
  role: string;
  amountPaid: number;
  month: string;
  status: string; // e.g. "Paid", "Pending"
  createdAt: string; // ISO format
}

export interface Session {
  id: string;
  userId: string;
  role: 'tenant' | 'manager' | 'employee';
  name: string;
  userAgent: string;
  lastActive: string; // ISO timestamp
  status: 'active' | 'revoked';
  buildVersion?: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}
