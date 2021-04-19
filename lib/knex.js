'use strict';
const Promise = require('bluebird');
const assert = require('assert');
const knex = require('knex');
const co = require('co');
const helper = require('./helper');

const SUPPORTS = [ 'sqlite', 'mysql', 'mysql2', 'oracledb', 'mssql', 'maria', 'mariasql', 'mariadb', 'pg', 'postgresql' ];

const isSupport = dialect => SUPPORTS.indexOf(dialect) !== -1;

const canExplain = dialect => [ 'mysql', 'mysql2', 'maria', 'mariasql', 'mariadb' ].includes(dialect);

const clientDesc = config => [
  config.filename,
  config.host,
  config.port,
  config.database,
  config.user ].filter(c => !!c).join('#');
module.exports = app => {
  init(app);

  app.beforeClose(function () {
    app.knex && app.knex.end && app.knex.end();
    app.logger.info('[egg-knex] knex singleton has been destroyed');
  });
};

let count = 0;
function init (app) {
  app.knexLogger = app.getLogger('knex') || app.logger;

  app.addSingleton('knex', (config, app) => {
    config.client = config.client || config.dialect || 'mysql';

    const connection = config.connection;
    assert(isSupport(config.client),
      `[egg-knex] ${config.client} is not in (${SUPPORTS})`);

    app.knexLogger.info(
      '[egg-knex] %s connecting %j',
      config.client,
      connection
    );

    if (app.config.env === 'local') {
      if (config.debug !== false) {
        config.debug = true;
      }
    }

    const index = count++;
    const done = app.readyCallback(`createKnex-${index}`);

    const client = createInstance(app, config, (...args) => {
      done(...args);
      app.knexLogger.info(`[egg-knex] instance[${index}] status OK`);
    });

    return client;
  });

  if (app.config.knex.clients) {
    app.knex.end = function (...args) {
      const key = args[0];
      let callback = args[1];
      if (args.length === 1 && typeof args[0] === 'function') {
        callback = args[0];
      }

      if (!key) {
        const tasks = [];
        for (const client of app.knex.clients) {
          tasks.push(client.end());
        }
        const future = Promise.all(tasks);
        if (callback) {
          future.then(callback, callback);
          return;
        }
        return future;

      }

      const client = app.knex.get(key);
      if (!client) {
        callback = callback || function () { };
        callback();
        return;
      }
      return client.destroy(callback);
    };
  } else {
    app.knex.end = app.knex.destroy;
  }
}

function injectLogger (app, config) {
  if (config.log) {
    return;
  }
  const logger = app.getLogger('knex') || app.logger;

  config.log = {};
  config.log.warn = logger.warn.bind(logger, '[egg-knex]');
  config.log.error = logger.error.bind(logger, '[egg-knex]');
  config.log.debug = msg => {
    if (isExplainQuery(msg)) return;
    logger.debug('[egg-knex]', msg);
  };
  config.log.deprecate = logger.warn.bind(logger, '[egg-knex] DEPRECATE');
}

function createInstance (app, config, callback) {
  injectLogger(app, config);
  const client = createKnexClient(config);
  client.dialect = config.client;

  if (app.instrument) {
    injectInstrument(app, client);
  }

  if (config.debug && canExplain(config.dialect)) {
    explainAfterQuery(app, client);
  }

  co(async function isReady () {
    const result = await client.raw(helper.showTables(client.dialect));
    const rows = helper.rawResult(client.dialect, result);
    if (rows && rows.length) {
      return rows.length;
    }
  }).then(num => {
    app.knexLogger.info(`[egg-knex] ${config.client} ${clientDesc(config.connection)} status OK, got ${num} tables`);
    callback(undefined, client);
  }).catch(e => {
    app.knexLogger.error(e);
    callback(e);
  });

  return client;
}

function createKnexClient (config) {
  const client = knex(config);
  return client;
}

function injectInstrument (app, knex) {
  const client = knex.client;
  [ 'query', 'stream' ].forEach(method => {
    client[`_raw_${method}`] = client[method];
    client[method] = function (connection, obj) {
      if (typeof obj === 'string') {
        obj = { sql: obj };
      }
      const sql = this.positionBindings(obj.sql);
      const ins = app.instrument(client.dialect, sql);
      return this[`_raw_${method}`]
        .apply(this, [ connection, obj ])
        .then(result => {
          ins.end();
          return result;
        });
    };
  });
}

function explainAfterQuery (app, knex) {
  knex.on('query-response', (_response, { sql, bindings }) => {
    sql = knex.client._formatQuery(sql, bindings).trim();
    if (haveQueryPlan(sql)) {
      knex.raw(`explain ${sql}`)
        .then(result => {
          const explains = helper.rawResult(knex.dialect, result);
          app.knexLogger.info('[egg-knex] explains of %s\n=====> result: %j', sql, explains);
        })
        .catch(() => app.knexLogger.info('[egg-knex] Whoops! Explain doesn\'t work with:', sql));
    }
  });
}

function isExplainQuery (sql) {

  if (typeof sql === 'string') {
    const method = `${sql}`.split(' ').shift().toUpperCase();
    return method === 'EXPLAIN';
  }

  if (sql && sql.sql) return isExplainQuery(sql.sql);
  return false;
}

function haveQueryPlan (sql) {
  const method = `${sql}`.split(' ').shift().toUpperCase();
  return [ 'INSERT', 'SELECT', 'DELETE', 'UPDATE' ].includes(method);
}
