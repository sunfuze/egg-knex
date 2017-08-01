'use strict';

exports.list = function* (ctx) {
  return yield ctx.app.knex('npm_auth').select();
};
