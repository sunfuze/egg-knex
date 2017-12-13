'use strict';
exports.showTables = dialect => {
  let sql = 'SHOW TABLES'; // 'mysql', 'mysql2', 'maria', 'mariasql', 'mariadb'
  switch (dialect) {
    case 'pg':
    case 'postgresql':
      sql = 'SELECT tablename FROM pg_catalog.pg_tables WHERE tableowner != \'postgres\';';
      break;
    case 'sqlite':
      sql = 'SELECT name FROM sqlite_master WHERE type=\'table\';';
      break;
    case 'mssql':
      sql = 'SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE=\'BASE TABLE\';';
      break;
    case 'oracle':
      sql = 'SELECT table_name FROM user_tables;';
      break;
    default:
  }
  return sql;
};

exports.rawResult = (dialect, target) => {
  let ret;
  switch (dialect) {
    case 'pg':
    case 'postgresql':
      ret = target && target.rows;
      break;
    default:
      ret = Array.isArray(target) && target[0];
  }
  return ret;
};
