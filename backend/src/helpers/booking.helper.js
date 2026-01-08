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

module.exports = {
  extractTime,
  calculateEndDatetime,
  findPriceForTime
};
