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

  before(function* () {
    app = mm.app({
      baseDir: 'apps/mysqlapp',
      plugin: 'knex',
    });
    yield app.ready();

    should.exist(app.knex);
  });

  beforeEach(function* () {
    // 先初始化测试数据，避免为空
    try {
      yield app.knex
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

  afterEach(function* () {
    // 清空测试数据
    yield app.knex.del().from('npm_auth').where('user_id', 'like', `egg-${uid}%`);
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

  it('should query limit 2', function* () {
    const users = yield app.knex
      .select('*')
      .from('npm_auth')
      .orderBy('id', 'desc')
      .limit(2);
    users.should.be.an.Array;
    users.should.length(2);
  });

  it('should update successfully', function* () {
    const user = yield app.knex
      .select('*')
      .from('npm_auth')
      .orderBy('id', 'desc')
      .limit(1);

    const result = yield app.knex
      .update({
        user_id: `79744-${uid}-update`,
      })
      .where('id', user[0].id)
      .from('npm_auth');

    result.should.equal(1);
  });

  it('should delete successfully', function* () {
    const user = yield app.knex('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(10);
    const affectedRows = yield app.knex('npm_auth').where('id', user.id).del();
    affectedRows.should.eql(1);
  });

  it('should query one success', function* () {
    const user = yield app.knex('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(10);
    should.exist(user);
    user.user_id.should.be.a.String;


    const row = yield app.knex('npm_auth').first().where('user_id', user.user_id);
    row.id.should.equal(user.id);
  });

  it('should query one not exists return null', function* () {
    let [
      [ user ],
    ] = yield app.knex.raw('select * from npm_auth where id = -1');
    should.not.exist(user);

    user = yield app.knex('npm_auth').first().where('id', -1);
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
      (err.message.includes('ER_ACCESS_DENIED_ERROR')).should.be.true();
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

  it('should queryOne work on transaction', function* () {
    const result = yield app.knex.transaction(function* (trx) {
      const row = yield trx('npm_auth')
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

  it('should transaction manual commit woking', function* () {
    const trx = yield app.knex.transaction();
    const row = yield trx('npm_auth')
      .first()
      .orderBy('id', 'desc')
      .limit(5);
    row.user_id.should.be.a.String;
    row.password.should.equal('3');
    yield trx('npm_auth').update({
      password: '4',
    }).where('id', row.id);
    yield trx.commit();
    const user = yield app.knex('npm_auth').first().where('id', row.id);
    user.password.should.equal('4');
  });

  it('should nested transaction commit should ok', function* () {
    const trx1 = yield app.knex.transaction();
    try {
      const row = yield trx1('npm_auth')
        .first()
        .orderBy('id', 'desc')
        .limit(5);
      row.user_id.should.be.a.String;
      row.password.should.equal('3');
      yield trx1('npm_auth').update({
        password: '4',
      }).where('id', row.id);

      const trx2 = yield trx1.transaction();
      let user;

      user = yield trx2('npm_auth').first().where('id', row.id);
      user.password.should.equal('4');

      yield trx2('npm_auth').update({
        password: 'trx2',
      }).where('id', row.id);
      yield trx2.commit();

      user = yield trx1('npm_auth').first().where('id', row.id);
      user.password.should.equal('trx2');
      yield trx1.commit();

      user = yield app.knex('npm_auth').first().where('id', row.id);
      user.password.should.equal('trx2');
    } catch (e) {
      yield trx1.rollback();
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
});
