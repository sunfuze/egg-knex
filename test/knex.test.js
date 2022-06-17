'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');
const path = require('path');
const should = require('should');
const request = require('supertest');
const mm = require('egg-mock');
const utility = require('utility');

describe('test/knex.test.js', () => {
  let app;
  const uid = utility.randomString();

  before(async function () {
    app = mm.app({
      baseDir: 'apps/mysqlapp',
      plugin: 'knex',
    });
    await app.ready();

    should.exist(app.knex);
  });

  beforeEach(async function () {
    // 先初始化测试数据，避免为空
    try {
      await app.knex
        .insert([ {
          user_id: `egg-${uid}-1`,
          password: '1',
        },
        {
          user_id: `egg-${uid}-2`,
          password: '2',
        },
        {
          user_id: `egg-${uid}-3`,
          password: '3',
        },
        ])
        .into('npm_auth');
    } catch (err) {
      console.log(err);
    }
  });

  afterEach(async function () {
    // 清空测试数据
    await app.knex.del().from('npm_auth').where('user_id', 'like', `egg-${uid}%`);
  });

  after(done => {
    app.knex.destroy().then(done);
  });

  afterEach(mm.restore);

  it('should query mysql user table success', done => {
    request(app.callback())
      .get('/')
      .expect(200, done);
  });

  it('should query limit 2', async function () {
    const users = await app.knex
      .select('*')
      .from('npm_auth')
      .orderBy('id', 'desc')
      .limit(2);
    users.should.be.an.Array;
    users.should.length(2);
  });

  it('should update successfully', async function () {
    const user = await app.knex
      .select('*')
      .from('npm_auth')
      .orderBy('id', 'desc')
      .limit(1);

    const result = await app.knex
      .update({
        user_id: `79744-${uid}-update`,
      })
      .where('id', user[0].id)
      .from('npm_auth');

    result.should.equal(1);
  });

  it('should delete successfully', async function () {
    const user = await app.knex('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(10);
    const affectedRows = await app.knex('npm_auth').where('id', user.id).del();
    affectedRows.should.eql(1);
  });

  it('should query one success', async function () {
    const user = await app.knex('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(10);
    should.exist(user);
    user.user_id.should.be.a.String;


    const row = await app.knex('npm_auth').first().where('user_id', user.user_id);
    row.id.should.equal(user.id);
  });

  it('should query one not exists return null', async function () {
    let [
      [ user ],
    ] = await app.knex.raw('select * from npm_auth where id = -1');
    should.not.exist(user);

    user = await app.knex('npm_auth').first().where('id', -1);
    should.not.exist(user);
  });

  // it('should escape value', () => {
  //   const val = app.mysql.escape('\'"?><=!@#');
  //   val.should.equal('\'\\\'\\"?><=!@#\'');
  // });

  it('should agent error when password wrong on multi clients', done => {
    mm(process.env, 'EGG_LOG', 'NONE');
    const app = mm.app({
      baseDir: 'apps/mysqlapp-multi-client-wrong',
      plugin: 'knex',
    });

    app.ready(err => {
      (err.code).should.equal('ER_ACCESS_DENIED_ERROR');
      done();
    });
  });

  it('should agent.mysql work', done => {
    const app = mm.cluster({
      baseDir: 'apps/mysqlapp',
      plugin: 'knex',
    });
    app.ready(() => {
      app.close();
      const result = fs.readFileSync(path.join(__dirname, './fixtures/apps/mysqlapp/run/agent_result.json'), 'utf8');
      result.should.match(/\[\{"currentTime":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}\]/);
      done();
    });
  });

  it('should disable app work', done => {
    const app = mm.app({
      baseDir: 'apps/mysqlapp-disable',
      plugin: 'knex',
    });
    app.ready(() => {
      should.not.exist(app.mysql);
      done();
    });
  });

  it('should queryOne work on transaction', async function () {
    const result = await app.knex.transaction(async function (trx) {
      const row = await trx('npm_auth')
        .first()
        .orderBy('id', 'desc')
        .limit(10);
      return {
        row,
      };
    });

    should.exist(result.row);
    result.row.user_id.should.be.a.String;
    result.row.password.should.equal('3');
  });

  it('should transaction manual commit woking', async function () {
    const trx = await app.knex.transaction();
    const row = await trx('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(5);
    row.user_id.should.be.a.String;
    row.password.should.equal('3');
    await trx('npm_auth').update({
      password: '4',
    }).where('id', row.id);
    await trx.commit();
    const user = await app.knex('npm_auth').first().where('id', row.id);
    user.password.should.equal('4');
  });

  it('should transaction rollback working', async function () {
    const trx = await app.knex.transaction();
    const row = await trx('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(5);
    row.user_id.should.be.a.String;
    row.password.should.equal('3');
    await trx('npm_auth').update({
      password: '4',
    }).where('id', row.id);
    await trx.rollback();
    const user = await app.knex('npm_auth').first().where('id', row.id);
    user.password.should.equal('3');
  });

  it('should nested transaction commit should ok', async function () {
    const trx1 = await app.knex.transaction();
    try {
      const row = await trx1('npm_auth')
        .first()
        .orderBy('id', 'desc')
        .limit(5);
      row.user_id.should.be.a.String;
      row.password.should.equal('3');
      await trx1('npm_auth').update({
        password: '4',
      }).where('id', row.id);

      const trx2 = await trx1.transaction();
      let user;

      user = await trx2('npm_auth').first().where('id', row.id);
      user.password.should.equal('4');

      await trx2('npm_auth').update({
        password: 'trx2',
      }).where('id', row.id);
      await trx2.commit();

      user = await trx1('npm_auth').first().where('id', row.id);
      user.password.should.equal('trx2');
      await trx1.commit();

      user = await app.knex('npm_auth').first().where('id', row.id);
      user.password.should.equal('trx2');
    } catch (e) {
      await trx1.rollback();
      throw e;
    }
  });

  describe('newConfig', () => {
    let app;
    before(done => {
      app = mm.cluster({
        baseDir: 'apps/mysqlapp-new',
        plugin: 'knex',
      });
      app.ready(done);
    });

    after(() => {
      app.close();
    });

    it('should new config agent.knex work', done => {
      app.ready(() => {
        const result = fs.readFileSync(path.join(__dirname, './fixtures/apps/mysqlapp-new/run/agent_result.json'), 'utf8');
        result.should.match(/\[\{"currentTime":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}\]/);
        done();
      });
    });

    it('should query mysql user table success', done => {
      request(app.callback())
        .get('/')
        .expect(200, done);
    });
  });

  describe('createInstance', () => {
    let app;
    before(done => {
      app = mm.cluster({
        baseDir: 'apps/mysqlapp-dynamic',
        plugin: 'mysql',
      });
      app.ready(done);
    });

    after(() => {
      app.close();
    });

    it('should new config agent.mysql work', done => {
      app.ready(() => {
        const result = fs.readFileSync(path.join(__dirname, './fixtures/apps/mysqlapp-dynamic/run/agent_result.json'), 'utf8');
        result.should.match(/\[\{"currentTime":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}\]/);
        done();
      });
    });

    it('should query mysql user table success', done => {
      request(app.callback())
        .get('/')
        .expect(200, done);
    });
  });

  describe('connectString', () => {
    let app;
    before(done => {
      app = mm.cluster({
        baseDir: 'apps/mysqlapp-connectstring',
        plugin: 'knex',
      });
      app.ready(done);
    });

    after(() => {
      app.close();
    });

    it('should agent.knex with connectString work', done => {
      app.ready(() => {
        const result = fs.readFileSync(
          path.join(
            __dirname,
            './fixtures/apps/mysqlapp-connectstring/run/agent_result.json'
          ),
          'utf8'
        );
        result.should.match(
          /\[\{"currentTime":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}\]/
        );
        done();
      });
    });

    it('should query mysql user table success', done => {
      request(app.callback())
        .get('/')
        .expect(200, done);
    });
  });
});
