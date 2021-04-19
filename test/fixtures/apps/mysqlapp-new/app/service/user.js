'use strict';

exports.list = async function (ctx) {
  return await ctx.app.knex('npm_auth').select();
};
