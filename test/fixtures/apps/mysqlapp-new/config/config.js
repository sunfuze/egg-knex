'use strict';

exports.knex = {
  client: {
    dialect: 'mysql',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'admin',
      database: 'test',
    },
  },
  agent: true,
};
