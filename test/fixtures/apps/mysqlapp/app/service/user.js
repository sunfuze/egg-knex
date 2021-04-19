'use strict';

exports.list = async function (ctx) {
  return await ctx.app.knex.select('*').from('npm_auth');
};
