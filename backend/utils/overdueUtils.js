/**
 * Overdue calculation utilities for rental contracts.
 *
 * Business rule:
 *   Every completed 24-hour period after the official return deadline
 *   incurs one additional daily rental charge.
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
export function buildDeadline(endDate, endTime) {
  const d = new Date(endDate);

  if (endTime && endTime.trim() && endTime.trim() !== '00:00') {
    const [h, m] = endTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    // No specific return time → entire end-day is included; charge starts next day
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

/**
 * Calculate live overdue days and charges for a contract.
 *
 * @param {Date|string} endDate
 * @param {string|null}  endTime
 * @param {number}       rentPrice  daily rate
 * @returns {{ overdueDays: number, overdueCharges: number, deadline: Date }}
 */
export function calcLiveOverdue(endDate, endTime, rentPrice) {
  const deadline = buildDeadline(endDate, endTime);
  const now      = new Date();

  if (now <= deadline) {
    return { overdueDays: 0, overdueCharges: 0, deadline };
  }

  const diffMs        = now.getTime() - deadline.getTime();
  const overdueDays   = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const overdueCharges = overdueDays * (parseFloat(rentPrice) || 0);

  return { overdueDays, overdueCharges, deadline };
}

/**
 * Append live overdue data to a contract object (mutates in place).
 * For COMPLETED/CANCELLED contracts the stored overdueCharges are used.
 *
 * @param {object} contract  Prisma RentalContract (must include rentPrice, endDate, endTime)
 * @returns {object} same contract with added fields:
 *   liveOverdueDays, liveOverdueCharges, liveFinalTotal
 */
export function enrichWithOverdue(contract) {
  const active = contract.status === 'ACTIVE' || contract.status === 'OVERDUE';

  if (active) {
    const { overdueDays, overdueCharges } = calcLiveOverdue(
      contract.endDate,
      contract.endTime,
      contract.rentPrice,
    );
    contract.liveOverdueDays   = overdueDays;
    contract.liveOverdueCharges = overdueCharges;
  } else {
    // Completed / cancelled — use what was frozen at return time
    contract.liveOverdueDays    = 0;
    contract.liveOverdueCharges = contract.overdueCharges || 0;
  }

  contract.liveFinalTotal =
    (parseFloat(contract.totalRent) || 0) + contract.liveOverdueCharges;

  return contract;
}
