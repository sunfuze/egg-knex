'use strict';

module.exports = {
  write: true,
  prefix: '^',
   test: [
     'test',
     'benchmark',
   ],
  devdep: [
    'egg',
    'egg-bin',
    'egg-mock',
    'autod',
    'eslint',
    'eslint-config-egg',
    'pedding',
    'supertest',
    'should',
    'utility',
  ],
  exclude: [
    './test/fixtures',
  ],
}
