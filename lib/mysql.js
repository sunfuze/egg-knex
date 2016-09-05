'use strict';

const assert = require('assert');
const knex = require('knex');
const co = require('co');

let count = 0;

module.exports = function(app) {
  app.addSingleton('mysql', createMysql);
};

function createMysql(config, app) {
  const index = count++;
  const done = app.readyCallback(`createMysql-${index}`);
  app.coreLogger.info('[egg-knex] mysql connecting %s@%s:%s/%s',
    config.user, config.host, config.port, config.database);
  assert(config.host && config.port && config.user && config.database,
    `[egg-knex] 'host: ${config.host}', 'port: ${config.port}', 'user: ${config.user}', 'database: ${config.database}' are required on config`);

  const client = knex({
    client: 'mysql',
    connection: config,
  });

  co(function* () {
    const rows = yield client.raw('select now() as currentTime');
    app.coreLogger.info(`[egg-knex] instance[${index}] status OK, mysql currentTime: ${rows[0][0].currentTime}`);
    done();
  }).catch(err => {
    app.coreLogger.error(err);
    done(err);
  });

  return client;
}
