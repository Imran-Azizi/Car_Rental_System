/**
 * Overdue / delay penalty calculation utilities for rental contracts.
 *
 * Business rules:
 *   - Every completed 24-hour period after the official return deadline
 *     incurs one day of delay penalty.
 *   - The daily penalty rate defaults to the contract's rentPrice (daily rate)
 *     but can be overridden via delayPenaltyRate on the contract.
 *   - The total delay penalty is added to the original totalRent to produce
 *     the final payable amount.
 *
 * Deadline resolution:
 *   - endTime present and not '00:00' → use exact datetime
 *   - endTime is '00:00' or absent    → deadline = end of endDate (23:59:59)
 */

/**
 * Build the return deadline from endDate + optional endTime.
 * @param {Date|string} endDate
 * @param {string|null}  endTime  'HH:MM' format
 * @returns {Date}
 */
import { getKabulDateTimeParts, toKabulUtcDate } from './dateUtils.js';

export function buildDeadline(endDate, endTime) {
  const dateValue = new Date(endDate);
  const parts = getKabulDateTimeParts(dateValue);

  if (endTime && endTime.trim() && endTime.trim() !== '00:00') {
    const [h = '0', m = '0'] = endTime.split(':');
    return toKabulUtcDate({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: Number(h),
      minute: Number(m),
      second: 0,
      millisecond: 0,
    });
  }

  return toKabulUtcDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  });
}

/**
 * Resolve the daily penalty rate for a contract.
 * Uses delayPenaltyRate if set and > 0, otherwise falls back to rentPrice.
 */
export function resolvePenaltyRate(contract) {
  const explicit = parseFloat(contract?.delayPenaltyRate);
  if (explicit > 0) return explicit;
  return parseFloat(contract?.rentPrice) || 0;
}

/**
 * Calculate live overdue days and charges for a contract.
 *
 * @param {Date|string} endDate
 * @param {string|null}  endTime
 * @param {number}       penaltyRate  daily penalty rate
 * @returns {{ overdueDays: number, overdueCharges: number, deadline: Date }}
 */
export function calcLiveOverdue(endDate, endTime, penaltyRate) {
  const deadline = buildDeadline(endDate, endTime);
  const now      = new Date();

  if (now <= deadline) {
    return { overdueDays: 0, overdueCharges: 0, deadline };
  }

  const diffMs        = now.getTime() - deadline.getTime();
  const overdueDays   = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const overdueCharges = overdueDays * (parseFloat(penaltyRate) || 0);

  return { overdueDays, overdueCharges, deadline };
}

/**
 * Append live overdue / delay-penalty data to a contract object (mutates in place).
 * For COMPLETED/CANCELLED contracts the stored values are used.
 *
 * @param {object} contract  Prisma RentalContract
 * @returns {object} same contract with added fields:
 *   liveOverdueDays, liveOverdueCharges, liveDelayPenaltyRate,
 *   liveTotalDelayPenalty, liveFinalTotal, liveTotalPayable
 */
export function enrichWithOverdue(contract) {
  const active = contract.status === 'ACTIVE' || contract.status === 'OVERDUE';
  const penaltyRate = resolvePenaltyRate(contract);

  if (active) {
    const { overdueDays, overdueCharges } = calcLiveOverdue(
      contract.endDate,
      contract.endTime,
      penaltyRate,
    );
    contract.liveOverdueDays      = overdueDays;
    contract.liveOverdueCharges   = overdueCharges;
    contract.liveDelayPenaltyRate = penaltyRate;
    contract.liveTotalDelayPenalty = overdueCharges;
  } else {
    contract.liveOverdueDays      = 0;
    contract.liveOverdueCharges   = contract.overdueCharges || 0;
    contract.liveDelayPenaltyRate = contract.delayPenaltyRate || penaltyRate || 0;
    contract.liveTotalDelayPenalty = contract.totalDelayPenalty ?? contract.overdueCharges ?? 0;
  }

  const baseRent = parseFloat(contract.totalRent) || 0;
  const penalty  = contract.liveTotalDelayPenalty;
  contract.liveFinalTotal    = baseRent + penalty;
  contract.liveTotalPayable  = contract.liveFinalTotal;

  return contract;
}
