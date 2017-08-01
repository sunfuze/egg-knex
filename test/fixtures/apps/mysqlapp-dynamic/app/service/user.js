'use strict';

exports.list = function* (ctx) {
  return yield ctx.app.mysql1('npm_auth').select();
};
