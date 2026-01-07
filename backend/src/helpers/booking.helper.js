// Extract time string (HH:mm:ss) from datetime
function extractTime(datetime) {
  const date = new Date(datetime);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

// Calculate end datetime based on start datetime and slot duration
function calculateEndDatetime(startDatetime, slotDurationMinutes) {
  const endDatetime = new Date(startDatetime);
  endDatetime.setMinutes(endDatetime.getMinutes() + slotDurationMinutes);
  return endDatetime;
}

// Find price for a specific time from price slots
function findPriceForTime(priceSlots, startDatetime) {
  if (priceSlots.length === 0) {
    return 0;
  }

  const startTime = extractTime(startDatetime);

  for (const slot of priceSlots) {
    if (startTime >= slot.start_time && startTime < slot.end_time) {
      return parseFloat(slot.price);
    }
  }

  return 0;
}

// Generate recurring dates (weekly)
function generateRecurringDates(startDatetime, repeatCount) {
  const dates = [];
  const baseDate = new Date(startDatetime);

  for (let i = 0; i < repeatCount; i++) {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + (i * 7)); // Add weeks
    dates.push(newDate);
  }

  return dates;
}

module.exports = {
  extractTime,
  calculateEndDatetime,
  findPriceForTime,
  generateRecurringDates
};
