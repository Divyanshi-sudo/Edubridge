export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TimeSlot = {
  day: DayOfWeek;
  start: string;
  end: string;
};

export type TimetableEntry = {
  subject: string;
  day: DayOfWeek;
  start: string;
  end: string;
};

export type AvailableSlot = {
  day: DayOfWeek;
  start: string;
  end: string;
};

export type Booking = {
  day: DayOfWeek;
  start: string;
  end: string;
};

// Convert HH:MM into minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes back into HH:MM
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Calculate free slots for one day
export function calculateFreeSlots(
  day: DayOfWeek,
  workingStart: string,
  workingEnd: string,
  occupiedSlots: TimetableEntry[]
): AvailableSlot[] {
  const startMinutes = timeToMinutes(workingStart);
  const endMinutes = timeToMinutes(workingEnd);

  const busySlots = occupiedSlots
    .filter((slot) => slot.day === day)
    .map((slot) => ({
      start: Math.max(startMinutes, timeToMinutes(slot.start)),
      end: Math.min(endMinutes, timeToMinutes(slot.end)),
    }))
    .filter((slot) => slot.start < slot.end)
    .sort((a, b) => a.start - b.start);

  const freeSlots: AvailableSlot[] = [];
  let currentTime = startMinutes;

  for (const slot of busySlots) {
    if (slot.start > currentTime) {
      freeSlots.push({
        day,
        start: minutesToTime(currentTime),
        end: minutesToTime(slot.start),
      });
    }

    currentTime = Math.max(currentTime, slot.end);
  }

  if (currentTime < endMinutes) {
    freeSlots.push({
      day,
      start: minutesToTime(currentTime),
      end: minutesToTime(endMinutes),
    });
  }

  return freeSlots;
}

// Find time slots when both people are free
export function findCommonSlots(
  studentSlots: AvailableSlot[],
  guideSlots: AvailableSlot[],
  minimumDuration = 30
): AvailableSlot[] {
  const commonSlots: AvailableSlot[] = [];

  for (const studentSlot of studentSlots) {
    for (const guideSlot of guideSlots) {
      if (studentSlot.day !== guideSlot.day) continue;

      const start = Math.max(
        timeToMinutes(studentSlot.start),
        timeToMinutes(guideSlot.start)
      );

      const end = Math.min(
        timeToMinutes(studentSlot.end),
        timeToMinutes(guideSlot.end)
      );

      if (end - start >= minimumDuration) {
        commonSlots.push({
          day: studentSlot.day,
          start: minutesToTime(start),
          end: minutesToTime(end),
        });
      }
    }
  }

  return commonSlots;
}