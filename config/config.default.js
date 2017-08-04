'use strict';

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
  //   host: 'host',
  //   port: 'port',
  //   user: 'user',
  //   password: 'password',
  //   database: 'database',
  // },
  // 多数据库
  // clients: {
  //   db1: {
  //     host: 'host',
  //     port: 'port',
  //     user: 'user',
  //     password: 'password',
  //     database: 'database',
  //   },
  //   db2: {
  //     host: 'host',
  //     port: 'port',
  //     user: 'user',
  //     password: 'password',
  //     database: 'database',
  //   },
  // },
};
