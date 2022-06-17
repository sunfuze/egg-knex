'use strict';

const execSync = require('child_process').execSync;

execSync('mysql -h 127.0.0.1 -uroot -plongbridge -e "create database IF NOT EXISTS test;"');
execSync('mysql -h 127.0.0.1 -uroot -plongbridge test < test/npm_auth.sql');
console.log('create table success');
