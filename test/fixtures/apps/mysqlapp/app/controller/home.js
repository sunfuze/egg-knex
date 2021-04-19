'use strict';

module.exports = async function () {
  const users = await this.service.user.list(this);

  this.body = {
    status: 'success',
    users: users,
  };
};
