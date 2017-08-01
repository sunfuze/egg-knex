'use strict';

module.exports = function(app) {
  app.mysql1 = app.knex.createInstance(app.config.mysql1);
};
