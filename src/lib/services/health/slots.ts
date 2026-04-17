import type { AvailableSlot, HealthDoctorSchedule } from "./types";

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateSlotsFromSchedule(
  schedule: Pick<
    HealthDoctorSchedule,
    "start_time" | "end_time" | "slot_duration_minutes"
  >,
  bookedTimes: string[],
): AvailableSlot[] {
  const start = timeToMinutes(schedule.start_time);
  const end = timeToMinutes(schedule.end_time);
  const duration = schedule.slot_duration_minutes;

  const bookedSet = new Set(
    bookedTimes.map((time) => (time.length >= 5 ? time.slice(0, 5) : time)),
  );

  const slots: AvailableSlot[] = [];

  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    const time = minutesToTime(cursor);
    const endTime = minutesToTime(cursor + duration);

    slots.push({
      time,
      end_time: endTime,
      available: !bookedSet.has(time),
    });
  }

  return slots;
}

export function mergeScheduleSlots(
  schedules: Array<
    Pick<HealthDoctorSchedule, "start_time" | "end_time" | "slot_duration_minutes">
  >,
  bookedTimes: string[],
): AvailableSlot[] {
  const all = schedules.flatMap((schedule) =>
    generateSlotsFromSchedule(schedule, bookedTimes),
  );

  const map = new Map<string, AvailableSlot>();

  for (const slot of all) {
    if (!map.has(slot.time)) {
      map.set(slot.time, slot);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
}