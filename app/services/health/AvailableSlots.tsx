"use client";

import type { AvailableSlot } from "@/src/lib/services/health/types";

type Props = {
  slots: AvailableSlot[];
  selectedTime?: string;
  onSelect: (time: string) => void;
};

export default function AvailableSlots({
  slots,
  selectedTime,
  onSelect,
}: Props) {
  if (!slots.length) {
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-500">
        No available slots for this date.
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Available time slots</h3>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isDisabled = !slot.available;

          return (
            <button
              key={`${slot.time}-${slot.end_time}`}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(slot.time)}
              className={[
                "rounded-lg border px-3 py-2 text-sm transition",
                isDisabled
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "hover:bg-gray-50",
                isSelected ? "border-black bg-black text-white hover:bg-black" : "",
              ].join(" ")}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}