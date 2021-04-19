'use strict';

/**
 * Module dependencies.
 */
const pedding = require('pedding');
const request = require('supertest');
const utility = require('utility');
const mm = require('egg-mock');
// mm.env('local');

describe('test/multiclient.test.js', () => {
  describe('new config', () => {
    let app;
    const uid = utility.randomString();
    before(done => {
      app = mm.app({
        baseDir: 'apps/mysqlapp-multi-client-new',
        plugin: 'knex',
      });
      app.ready(done);
    });

    before(async function () {
      await app.knex.get('db1')
        .insert([
          { user_id: `multi-${uid}-1`, password: '1' },
          { user_id: `multi-${uid}-2`, password: '2' },
          { user_id: `multi-${uid}-3`, password: '3' },
        ])
        .into('npm_auth');
    });

    it('should multi client work', done => {
      request(app.callback())
        .get('/')
        .expect({
          hasRows: true,
        })
        .expect(200, done);
    });

    describe('app.knex.end', function () {

      before(async function () {
        await app.knex.get('db1').where('user_id', 'like', `multi-${uid}-%`).del()
          .from('npm_auth');
      });

      it('should close all mysql client work', done => {
        done = pedding(Object.keys(app.config.knex.clients).length, done);
        for (const key in Object.keys(app.config.knex.clients)) {
          app.knex.end(key, done);
        }
        app.knex.end();
        app.knex.end('db1');
      });
    });
  });
});
