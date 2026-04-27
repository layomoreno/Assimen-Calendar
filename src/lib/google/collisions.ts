import { checkAvailability } from "./calendar";
import type { CollisionCheckResult, TimeSlot } from "@/types/database";

/**
 * Collision Detection Algorithm
 * 
 * Checks if a proposed time block (2-3 hours) conflicts with existing
 * calendar events. If a collision is found, it automatically searches
 * for the next available slot on the same day.
 * 
 * Rules from assiten_calendar.md:
 * - Blocks are 2-3 hours long
 * - If occupied, search for next free slot on the same day
 * - Search window: 08:00 - 21:00
 */

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;
const SLOT_INCREMENT_MINUTES = 30;

export async function findAvailableSlot(
  accessToken: string,
  refreshToken: string,
  preferredDate: Date,
  blockDurationHours: number = 2,
  timeZone: string = "America/Bogota"
): Promise<CollisionCheckResult> {
  // Set search window for the entire day
  const dayStart = new Date(preferredDate);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);

  const dayEnd = new Date(preferredDate);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

  // Get all busy slots for this day
  const busySlots = await checkAvailability(
    accessToken,
    refreshToken,
    dayStart.toISOString(),
    dayEnd.toISOString(),
    timeZone
  );

  // Default preferred slot: same time as the due date
  const preferredStart = new Date(preferredDate);
  const preferredEnd = new Date(preferredDate);
  preferredEnd.setHours(preferredEnd.getHours() + blockDurationHours);

  const originalSlot: TimeSlot = {
    start: preferredStart,
    end: preferredEnd,
    available: true,
  };

  // Check if preferred slot is free
  const hasCollision = busySlots.some(
    (busy) => preferredStart < busy.end && preferredEnd > busy.start
  );

  if (!hasCollision) {
    return {
      hasCollision: false,
      originalSlot,
      suggestedSlot: originalSlot,
    };
  }

  // Collision detected — search for alternative slot
  let currentStart = new Date(dayStart);

  while (currentStart.getHours() + blockDurationHours <= DAY_END_HOUR) {
    const currentEnd = new Date(currentStart);
    currentEnd.setHours(currentEnd.getHours() + blockDurationHours);

    const slotFree = !busySlots.some(
      (busy) => currentStart < busy.end && currentEnd > busy.start
    );

    if (slotFree) {
      return {
        hasCollision: true,
        originalSlot,
        suggestedSlot: {
          start: currentStart,
          end: currentEnd,
          available: true,
        },
      };
    }

    // Move to next slot
    currentStart = new Date(
      currentStart.getTime() + SLOT_INCREMENT_MINUTES * 60 * 1000
    );
  }

  // No slot found on this day — suggest previous day
  const previousDay = new Date(preferredDate);
  previousDay.setDate(previousDay.getDate() - 1);
  previousDay.setHours(DAY_START_HOUR, 0, 0, 0);

  const previousDayEnd = new Date(previousDay);
  previousDayEnd.setHours(DAY_START_HOUR + blockDurationHours, 0, 0, 0);

  return {
    hasCollision: true,
    originalSlot,
    suggestedSlot: {
      start: previousDay,
      end: previousDayEnd,
      available: true,
    },
  };
}
