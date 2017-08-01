'use strict';

exports.knex = {
  clients: [
    {
      clientId: 'db1',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '23234',
        database: 'test',
      },
    },
    {
      clientId: 'db2',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '345345',
        database: 'test',
      },
    },
    {
      clientId: 'db3',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'admin',
        database: 'test',
      },
    },
  ],
  default: {
    dialect: 'mysql',
  },
  agent: true,
};
