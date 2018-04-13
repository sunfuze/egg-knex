'use strict';

const execSync = require('child_process').execSync;

execSync('mysql -h 127.0.0.1 -uroot -e "create database IF NOT EXISTS test;"');
execSync('mysql -h 127.0.0.1 -uroot test < test/npm_auth.sql');
console.log('init mysql success');

execSync('psql  -h 127.0.0.1 -U postgres -c "drop database IF EXISTS test;"');
execSync('psql  -h 127.0.0.1 -U postgres -c "create database test;"');
execSync('psql  -h 127.0.0.1 -U postgres -d test -a -f test/npm_auth_pg.sql');
console.log('init postgresql success');
