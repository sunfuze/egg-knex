'use strict';

exports.list = function* (ctx) {
  return yield ctx.app.knex.select('*').from('npm_auth');
};
