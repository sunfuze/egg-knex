'use strict';

exports.knex = {
  agent: true,
};

exports.mysql1 = {
  dialect: 'mysql',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'admin',
    database: 'test',
  },
};
