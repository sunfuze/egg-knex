'use strict';
const Promise = require('bluebird');
const assert = require('assert');
const knex = require('knex');
const helpers = require('knex/lib/helpers');
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
};

let count = 0;
function init (app) {
  app.knexLogger = app.getLogger('knex') || app.logger;
  enhanceKnexHelpers(app, helpers);

  app.addSingleton('knex', (config, app) => {
    config.client = config.client || config.dialect || 'mysql';

    const connection = config.connection;
    assert(isSupport(config.client),
      `[egg-knex] ${config.client} is not in (${SUPPORTS})`);

      app.knexLogger.info(
        "[egg-knex] %s connecting %j",
        config.client,
        connection
      );

    if (app.config.env === 'local') {
      config.debug = config.debug || true;
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
      let key = args[0];
      let callback = args[1];
      if (args.length === 1 && typeof args[0] === 'function') {
        callback = args[0];
      } else if (args.length === 2) {
        key = args[0];
        callback = args[1];
      }
      const client = app.knex.get(key);
      if (!client) {
        callback = callback || function () { };
        return callback();
      }
      return client.destroy(callback);
    };
  } else {
    app.knex.end = app.knex.destroy;
  }
}

function createInstance (app, config, callback) {
  const client = createKnexClient(config);
  client.dialect = config.client;

  if (app.instrument) {
    injectInstrument(app, client);
  }

  if (config.debug && canExplain(config.dialect)) {
    explainAfterQuery(app, client);
  }

  co(function* isReady () {
    const result = yield client.raw(helper.showTables(client.dialect));
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
  promisifyTransaction(client);
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
      obj.bindings = this.prepBindings(obj.bindings);
      const ins = app.instrument(client.dialect, this._formatQuery(obj.sql, obj.bindings));
      return this[`_raw_${method}`]
        .apply(this, [ connection, obj ])
        .then(result => {
          ins.end();
          return result;
        });
    };
  });
}

function promisifyTransaction (client) {
  const proto = Reflect.getPrototypeOf(client.client);

  if (proto._promisify_transaction) {
    return;
  }

  proto._promisify_transaction = true;

  proto._raw_transaction = proto.transaction;

  proto.transaction = function (...args) {
    if (typeof args[0] === 'function') {
      if (isGenerator(args[0])) args[0] = co.wrap(args[0]);
      return proto._raw_transaction.apply(this, args);
    }
    let config;
    let outTx;
    if (args.length > 0) outTx = args.pop();
    if (args.length > 0) config = args.pop();

    return new Promise(resolve => {
      const transaction = proto._raw_transaction.apply(this, [
        function _container (trx) {
          resolve(trx);
        },
        config,
        outTx,
      ]);

      transaction.rollback = function (conn, error) {
        return this.query(conn, 'ROLLBACK', error ? 2 : 1, error)
          .timeout(5000)
          .catch(Promise.TimeoutError, () => {
            this._resolver();
          });
      };

      transaction.rollbackTo = function (conn, error) {
        return this.query(conn, `ROLLBACK TO SAVEPOINT ${this.txid}`, error ? 2 : 1, error)
          .timeout(5000)
          .catch(Promise.TimeoutError, () => {
            this._resolver();
          });
      };
    });
  };
}

function enhanceKnexHelpers (app, helpers) {
  helpers.warn = app.knexLogger.warn.bind(app.knexLogger, '[egg-knex]');
  helpers.error = app.knexLogger.error.bind(app.knexLogger, '[egg-knex]');
  helpers.debugLog = function (msg) {
    if (isExplainQuery(msg)) return;
    app.knexLogger.info('[egg-knex]', msg);
  };
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

function isGenerator (fn) {
  return Object.prototype.toString.call(fn) === '[object GeneratorFunction]';
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
