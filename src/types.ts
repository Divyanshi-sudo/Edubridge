export type Role = 'student' | 'faculty' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'reschedule_requested'
  | 'completed';

export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ConferenceStatus = 'planned' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  year: string;
  rollNumber?: string;
  phone?: string;
  profile: string;
}

export interface Group {
  id: string;
  name: string;
  projectTitle: string;
  abstract: string;
  status: 'active' | 'review' | 'completed';
  semester: string;
  guideIds: string[];
  memberIds: string[];
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  senderId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Booking {
  id: string;
  groupId: string;
  studentId: string;
  guideId: string;
  date: string;
  start: string;
  end: string;
  purpose: string;
  agenda: string;
  status: BookingStatus;
}

export interface GuideAvailability {
  id: string;
  guideId: string;
  date: string;
  start: string;
  end: string;
}

export interface DocumentItem {
  id: string;
  groupId: string;
  title: string;
  category: string;
  uploadedBy: string;
  size: string;
  updatedAt: string;
  status: DocumentStatus;
  description: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  doi: string;
  topic: string;
  status: 'read' | 'review' | 'cited';
  relevance: number;
  notes: string;
}

export interface ConferenceOpportunity {
  id: string;
  name: string;
  topic: string;
  date: string;
  deadline: string;
  website: string;
  status: ConferenceStatus;
  fee: string;
  verified: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  milestone: string;
  groupId: string;
}

export interface MeetingMinute {
  id: string;
  title: string;
  groupId: string;
  date: string;
  attendees: string[];
  summary: string;
  actionItems: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'students' | 'faculty' | 'admin';
  createdBy: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  href: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  groups: Group[];
  groupInvitations: GroupInvitation[];
  bookings: Booking[];
  guideAvailability: GuideAvailability[];
  documents: DocumentItem[];
  papers: ResearchPaper[];
  conferences: ConferenceOpportunity[];
  tasks: TaskItem[];
  meetingMinutes: MeetingMinute[];
  announcements: Announcement[];
  notifications: NotificationItem[];
}
