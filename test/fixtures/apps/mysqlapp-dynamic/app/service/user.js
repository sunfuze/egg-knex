'use strict';

exports.list = async function (ctx) {
  return await ctx.app.mysql1('npm_auth').select();
};
