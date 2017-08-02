'use strict';

exports.knex = {
  clients: {
    db1: {
      dialect: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        database: 'test',
      },
    },
    db2: {
      dialect: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        database: 'test',
      },
    },
    db3: {
      dialect: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        database: 'test',
      },
    },
  },
};
