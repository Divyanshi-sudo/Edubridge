import type { PDFTextItem } from './pdfExtractor';

export type FreeSlot = {
  day: string;
  start: string;
  end: string;
};

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function parseTime(text: string): { start: number; end: number } | null {
  const match = text.match(
    /(\d{1,2}):?(\d{2})\s*[-–]\s*(\d{1,2}):?(\d{2})/
  );

  if (!match) return null;

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const endHour = Number(match[3]);
  const endMinute = Number(match[4]);

  const start = startHour * 100 + startMinute;
  const end = endHour * 100 + endMinute;

  if (
    startHour > 23 ||
    endHour > 23 ||
    startMinute > 59 ||
    endMinute > 59 ||
    end <= start
  ) {
    return null;
  }

  return { start, end };
}

function formatTime(value: number): string {
  const hour = Math.floor(value / 100);
  const minute = value % 100;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function parseTimetableItems(items: PDFTextItem[]) {
  /*
   * STEP 1: Identify weekday headers.
   */

  const dayItems = items
    .filter((item) =>
      DAYS.some((day) => normalize(item.text) === normalize(day))
    )
    .map((item) => ({
      day: DAYS.find((day) => normalize(day) === normalize(item.text))!,
      x: item.x + item.width / 2,
      y: item.y + item.height / 2,
    }))
    .sort((a, b) => a.x - b.x);

  if (dayItems.length < 2) {
    return { freeSlots: [] as FreeSlot[] };
  }

  /*
   * STEP 2: Identify time labels ONLY in the left-side
   * time column. This prevents times inside lecture cells
   * from becoming timetable rows.
   */

  const firstDayX = dayItems[0].x;

  const timeItems = items
    .map((item) => {
      const parsed = parseTime(item.text);

      if (!parsed) return null;

      const centerX = item.x + item.width / 2;

      // Time labels must be left of the weekday columns.
      if (centerX >= firstDayX) return null;

      return {
        ...parsed,
        y: item.y + item.height / 2,
        x: centerX,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.y - b.y);

  if (timeItems.length < 2) {
    return { freeSlots: [] as FreeSlot[] };
  }

  /*
   * STEP 3: Calculate weekday column boundaries.
   */

  const dayColumns = dayItems.map((day, index) => {
    const previous = dayItems[index - 1];
    const next = dayItems[index + 1];

    const left = previous
      ? (previous.x + day.x) / 2
      : day.x - (next ? next.x - day.x : 100) / 2;

    const right = next
      ? (day.x + next.x) / 2
      : day.x + (previous ? day.x - previous.x : 100) / 2;

    return {
      day: day.day,
      left,
      right,
    };
  });

  /*
   * STEP 4: Calculate vertical row boundaries.
   *
   * Each row extends halfway toward the rows above
   * and below it.
   */

  const rows = timeItems.map((row, index) => {
    const previous = timeItems[index - 1];
    const next = timeItems[index + 1];

    const top = previous
      ? (previous.y + row.y) / 2
      : row.y - (next ? next.y - row.y : 40) / 2;

    const bottom = next
      ? (row.y + next.y) / 2
      : row.y + (previous ? row.y - previous.y : 40) / 2;

    return {
      ...row,
      top,
      bottom,
    };
  });

  /*
   * STEP 5: Determine whether each timetable cell
   * contains a lecture or is genuinely empty.
   */

  const freeSlots: FreeSlot[] = [];

  for (const column of dayColumns) {
    const freePeriods: { start: number; end: number }[] = [];

    for (const row of rows) {
      const occupied = items.some((item) => {
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        const text = normalize(item.text);

        // Ignore weekday headers.
        if (DAYS.some((day) => normalize(day) === text)) {
          return false;
        }

        // Ignore timetable time labels.
        if (parseTime(item.text)) {
          return false;
        }

        // Ignore empty text.
        if (!text) {
          return false;
        }

        // Text must be within this weekday column.
        if (
          centerX < column.left ||
          centerX >= column.right
        ) {
          return false;
        }

        // Text must be within this timetable row.
        if (
          centerY < row.top ||
          centerY >= row.bottom
        ) {
          return false;
        }

        return true;
      });

      // Only genuinely empty cells are free.
      if (!occupied) {
        freePeriods.push({
          start: row.start,
          end: row.end,
        });
      }
    }

    /*
     * STEP 6: Merge consecutive free periods.
     */

    const merged: { start: number; end: number }[] = [];

    for (const period of freePeriods) {
      const previous = merged[merged.length - 1];

      if (previous && previous.end === period.start) {
        previous.end = period.end;
      } else {
        merged.push({ ...period });
      }
    }

    /*
     * STEP 7: Publish detected free periods.
     */

    for (const period of merged) {
      freeSlots.push({
        day: column.day,
        start: formatTime(period.start),
        end: formatTime(period.end),
      });
    }
  }

  return { freeSlots };
}