'use strict';

const execSync = require('child_process').execSync;

execSync('mysql -uroot -p123456 -e "create database IF NOT EXISTS test;"');
execSync('mysql -uroot -p123456 test < test/npm_auth.sql');
console.log('create table success');
