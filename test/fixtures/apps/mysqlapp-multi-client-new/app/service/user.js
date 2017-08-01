'use strict';

exports.list = function* (ctx) {
  return yield Promise.all([
    ctx.app.knex.get('db1')('npm_auth').select(),
    ctx.app.knex.get('db2')('npm_auth').select(),
    ctx.app.knex.get('db3')('npm_auth').select()
  ]);
};
