const COURT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
};

const COURT_DEFAULTS = {
  STATUS: COURT_STATUS.ACTIVE,
  SLOT_DURATION: 60 // minutes
};

module.exports = {
  COURT_STATUS,
  COURT_DEFAULTS
};
