import dayjs from "dayjs";

export function toISODate(d: Date | dayjs.Dayjs): string {
  return dayjs(d).format("YYYY-MM-DD");
}

export function formatTime(iso: string): string {
  return dayjs(iso).format("h:mm A");
}

export function formatDate(iso: string): string {
  return dayjs(iso).format("MMM D, YYYY");
}

export function formatDayHeader(d: Date | dayjs.Dayjs): string {
  return dayjs(d).format("dddd, MMMM D");
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return dayjs(a).isSame(b, "day");
}

export function isToday(d: string | Date): boolean {
  return dayjs(d).isSame(dayjs(), "day");
}

export function startOfMonthGrid(month: dayjs.Dayjs): dayjs.Dayjs {
  // Grid starts on Sunday
  const first = month.startOf("month");
  return first.subtract(first.day(), "day");
}

export function buildMonthGrid(month: dayjs.Dayjs): dayjs.Dayjs[] {
  const start = startOfMonthGrid(month);
  const days: dayjs.Dayjs[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(start.add(i, "day"));
  }
  return days;
}

export function dayRangeISO(date: Date | dayjs.Dayjs) {
  const d = dayjs(date);
  return {
    start: d.startOf("day").toISOString(),
    end: d.endOf("day").toISOString(),
  };
}

export function monthRangeISO(month: dayjs.Dayjs) {
  const start = startOfMonthGrid(month);
  const end = start.add(42, "day");
  return {
    start: start.startOf("day").toISOString(),
    end: end.endOf("day").toISOString(),
  };
}
