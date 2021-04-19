'use strict';

module.exports = async function () {
  const dataArr = await this.service.user.list(this);
  this.body = {
    hasRows: dataArr[0].length > 0 && dataArr[1].length > 0 && dataArr[2].length > 0,
  };
};
