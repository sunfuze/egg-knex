'use strict';

const knex = require('./lib/knex');

module.exports = app => {
  if (app.config.knex.app) knex(app);
};
