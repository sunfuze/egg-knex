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
    // 单数据库
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
    // 多数据库
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
