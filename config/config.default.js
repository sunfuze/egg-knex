'use strict';
const path = require('path');
module.exports = app => {
  const exports = {};

  exports.knex = {
    default: {
      dialect: 'mysql',
      connection: {
        database: null,
      },
      pool: { min: 0, max: 5 },
      acquireConnectionTimeout: 30000,
    },
    app: true,
    agent: false,
    // single database instance
    // client: {
    //   dialect: 'mysql',
    //   connection: {
    //     host: 'host',
    //     port: 'port',
    //     user: 'user',
    //     password: 'password',
    //     database: 'database',
    //   }
    // },
    // multiple datebase instances
    // clients: {
    //   db1: {
    //     dialect: 'pg',
    //     connection: {
    //       host: 'host',
    //       port: 'port',
    //       user: 'user',
    //       password: 'password',
    //       database: 'database',
    //     },
    //   },
    //   db2: {
    //     dialect: 'oracle',
    //     connection: {
    //       host: 'host',
    //       port: 'port',
    //       user: 'user',
    //       password: 'password',
    //       database: 'database',
    //     },
    //   },
    // },
  };

  exports.customLogger = {
    knex: {
      file: path.join(app.root, 'logs/egg-knex.log'),
    },
  };

  return exports;
};
