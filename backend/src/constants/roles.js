const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer'
};

// Array tất cả roles (dùng cho validation)
const ALL_ROLES = Object.values(ROLES);

// Roles có quyền quản lý sân
const COURT_MANAGER_ROLES = [ROLES.MANAGER, ROLES.ADMIN];

module.exports = {
  ROLES,
  ALL_ROLES,
  COURT_MANAGER_ROLES
};
