'use strict';

exports.list = async function (ctx) {
  return await Promise.all([
    ctx.app.knex.get('db1')('npm_auth').select(),
    ctx.app.knex.get('db2')('npm_auth').select(),
    ctx.app.knex.get('db3')('npm_auth').select()
  ]);
};
