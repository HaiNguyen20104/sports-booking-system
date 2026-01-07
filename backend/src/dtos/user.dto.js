class CurrentUserDTO {
  constructor({ id, email, role, full_name }) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.full_name = full_name;
  }
}

module.exports = {
  CurrentUserDTO
};
