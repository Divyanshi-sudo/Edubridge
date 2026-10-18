import { seedState } from '../data/seed';
import type { AppState, GuideAvailability, User } from '../types';

const STORAGE_KEY = 'edubridge-state-v1';
const CURRENT_USER_KEY = 'edubridge-current-user';

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedState));
    return structuredClone(seedState);
  }

  try {
    const state = JSON.parse(raw) as AppState;
    let stateChanged = false;
    if (!Array.isArray(state.guideAvailability)) {
      state.guideAvailability = structuredClone(seedState.guideAvailability);
      stateChanged = true;
    }
    if (!Array.isArray(state.groupInvitations)) {
      state.groupInvitations = [];
      stateChanged = true;
    }
    const oldDemoStudent = state.users.find((user) => user.id === 'u-student-a' && user.email === 'aisha@college.edu');
    if (oldDemoStudent) {
      oldDemoStudent.fullName = 'Divyanshi';
      oldDemoStudent.email = 'divyanshi@college.edu';
      stateChanged = true;
    }
    for (const demoStudent of seedState.users.filter((user) => ['u-student-d', 'u-student-e'].includes(user.id))) {
      if (!state.users.some((user) => user.id === demoStudent.id)) {
        state.users.push(demoStudent);
        stateChanged = true;
      }
    }
    if (stateChanged) {
      saveState(state);
    }
    return state;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedState));
    return structuredClone(seedState);
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY) ?? null;
}

export function setCurrentUserId(userId: string | null) {
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
    return;
  }
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): User | null {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const state = loadState();
  return state.users.find((user) => user.id === userId) ?? null;
}

export function login(email: string, password: string): User | null {
  const state = loadState();
  const found = state.users.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password,
  );

  if (!found) return null;

  setCurrentUserId(found.id);
  return found;
}

export function logout() {
  setCurrentUserId(null);
}

export function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
  department: string;
  year: string;
  rollNumber?: string;
}) {
  const state = loadState();
  const exists = state.users.some((user) => user.email.toLowerCase() === payload.email.trim().toLowerCase());

  if (exists) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    role: 'student',
    department: payload.department,
    year: payload.year,
    rollNumber: payload.rollNumber,
    profile: 'New student account created through institutional onboarding.',
  };

  state.users.push(newUser);

  saveState(state);
  setCurrentUserId(newUser.id);
  return newUser;
}

export function createGroupInvitation(groupId: string, senderId: string, recipientId: string) {
  const state = loadState();
  const group = state.groups.find((item) => item.id === groupId);
  const sender = state.users.find((user) => user.id === senderId && user.role === 'student');
  const recipient = state.users.find((user) => user.id === recipientId && user.role === 'student');

  if (!group || !sender || !group.memberIds.includes(senderId)) {
    throw new Error('You must be a member of a group to invite a classmate.');
  }
  if (!recipient || group.memberIds.includes(recipientId)) {
    throw new Error('Choose a student who is not already in this group.');
  }
  if (state.groupInvitations.some((invitation) =>
    invitation.groupId === groupId &&
    invitation.recipientId === recipientId &&
    invitation.status === 'pending',
  )) {
    throw new Error('This student already has a pending invitation to the group.');
  }

  const invitation = {
    id: `gi-${Date.now()}`,
    groupId,
    senderId,
    recipientId,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  state.groupInvitations.unshift(invitation);
  state.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: recipientId,
    title: 'Group invitation',
    body: `${sender.fullName} invited you to join ${group.name}.`,
    read: false,
    href: '/groups',
    createdAt: invitation.createdAt,
  });
  saveState(state);
  return invitation;
}

export function respondToGroupInvitation(invitationId: string, recipientId: string, response: 'accepted' | 'declined') {
  const state = loadState();
  const invitation = state.groupInvitations.find((item) =>
    item.id === invitationId &&
    item.recipientId === recipientId &&
    item.status === 'pending',
  );
  if (!invitation) {
    throw new Error('This group invitation is no longer available.');
  }

  const group = state.groups.find((item) => item.id === invitation.groupId);
  const recipient = state.users.find((user) => user.id === recipientId && user.role === 'student');
  if (!group || !recipient) {
    throw new Error('The group or student account for this invitation could not be found.');
  }

  invitation.status = response;
  if (response === 'accepted' && !group.memberIds.includes(recipientId)) {
    group.memberIds.push(recipientId);
  }
  state.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: invitation.senderId,
    title: response === 'accepted' ? 'Group invitation accepted' : 'Group invitation declined',
    body: `${recipient.fullName} ${response} the invitation to join ${group.name}.`,
    read: false,
    href: '/groups',
    createdAt: new Date().toISOString(),
  });
  saveState(state);
  return invitation;
}

export function createTask(task: { title: string; assigneeId: string; dueDate: string; priority: 'low' | 'medium' | 'high'; milestone: string; groupId: string }) {
  const state = loadState();
  state.tasks.push({
    id: `t-${Date.now()}`,
    title: task.title,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    status: 'todo',
    priority: task.priority,
    milestone: task.milestone,
    groupId: task.groupId,
  });
  saveState(state);
}

export function createBooking(booking: {
  groupId: string;
  studentId: string;
  guideId: string;
  date: string;
  start: string;
  end: string;
  purpose: string;
  agenda: string;
}) {
  const state = loadState();
  const guide = state.users.find((user) => user.id === booking.guideId && user.role === 'faculty');
  if (!guide) {
    throw new Error('Choose a valid faculty guide before requesting a meeting.');
  }
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  if (booking.date < today) {
    throw new Error('Choose a future availability slot.');
  }

  const availableSlot = state.guideAvailability.some((slot) =>
    slot.guideId === booking.guideId &&
    slot.date === booking.date &&
    slot.start === booking.start &&
    slot.end === booking.end,
  );
  if (!availableSlot) {
    throw new Error('Choose one of the guide’s published availability slots.');
  }

  const conflict = state.bookings.some((item) => {
    return (
      item.guideId === booking.guideId &&
      item.date === booking.date &&
      ['pending', 'confirmed', 'reschedule_requested'].includes(item.status) &&
      ((item.start <= booking.start && booking.start < item.end) ||
        (booking.start <= item.start && item.start < booking.end))
    );
  });

  if (conflict) {
    throw new Error('This slot overlaps with an existing confirmed or pending booking.');
  }

  const record = {
    id: `b-${Date.now()}`,
    ...booking,
    status: 'pending' as const,
  };

  state.bookings.push(record);
  state.notifications.push({
    id: `nt-${Date.now()}`,
    userId: booking.guideId,
    title: 'New booking request',
    body: `${booking.purpose} has been requested for ${booking.date} at ${booking.start}.`,
    read: false,
    href: '/bookings',
    createdAt: new Date().toISOString(),
  });
  saveState(state);
  return record;
}

export function createGuideAvailability(availability: Omit<GuideAvailability, 'id'>) {
  const state = loadState();
  const guide = state.users.find((user) => user.id === availability.guideId && user.role === 'faculty');
  if (!guide) {
    throw new Error('Only a faculty guide can publish availability.');
  }
  if (availability.start >= availability.end) {
    throw new Error('The end time must be later than the start time.');
  }
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  if (availability.date < today) {
    throw new Error('Availability must be published for today or a future date.');
  }

  const overlaps = (start: string, end: string, otherStart: string, otherEnd: string) =>
    start < otherEnd && otherStart < end;
  const slotConflict = state.guideAvailability.some((slot) =>
    slot.guideId === availability.guideId &&
    slot.date === availability.date &&
    overlaps(availability.start, availability.end, slot.start, slot.end),
  );
  const bookingConflict = state.bookings.some((booking) =>
    booking.guideId === availability.guideId &&
    booking.date === availability.date &&
    ['pending', 'confirmed', 'reschedule_requested'].includes(booking.status) &&
    overlaps(availability.start, availability.end, booking.start, booking.end),
  );
  if (slotConflict || bookingConflict) {
    throw new Error('This time overlaps with another availability slot or meeting request.');
  }

  state.guideAvailability.push({ ...availability, id: `av-${Date.now()}` });
  saveState(state);
}

export function removeGuideAvailability(slotId: string, guideId: string) {
  const state = loadState();
  const slot = state.guideAvailability.find((item) => item.id === slotId && item.guideId === guideId);
  if (!slot) {
    throw new Error('The availability slot could not be found.');
  }
  const isBooked = state.bookings.some((booking) =>
    booking.guideId === guideId &&
    booking.date === slot.date &&
    booking.start < slot.end &&
    slot.start < booking.end &&
    ['pending', 'confirmed', 'reschedule_requested'].includes(booking.status),
  );
  if (isBooked) {
    throw new Error('This slot has a pending or confirmed meeting and cannot be removed.');
  }
  state.guideAvailability = state.guideAvailability.filter((item) => item.id !== slotId);
  saveState(state);
}

export function updateBookingStatus(bookingId: string, nextStatus: 'confirmed' | 'rejected' | 'cancelled' | 'completed') {
  const state = loadState();
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) return;
  booking.status = nextStatus;
  saveState(state);
}

export function createAnnouncement(body: string, audience: 'all' | 'students' | 'faculty' | 'admin' = 'all') {
  const state = loadState();
  state.announcements.unshift({
    id: `n-${Date.now()}`,
    title: 'Institutional update',
    body,
    audience,
    createdBy: 'u-admin',
    createdAt: new Date().toISOString(),
  });
  saveState(state);
}

export function markNotificationsRead(userId: string) {
  const state = loadState();
  state.notifications.forEach((notification) => {
    if (notification.userId === userId) notification.read = true;
  });
  saveState(state);
}
