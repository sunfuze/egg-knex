'use strict';

exports.list = function* (ctx) {
  return yield ctx.app.mysql.select('*').from('npm_auth');
};
