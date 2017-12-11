# egg-knex

[![NPM version][npm-image]][npm-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-knex.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-knex
[snyk-image]: https://snyk.io/test/npm/egg-knex/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-knex
[download-image]: https://img.shields.io/npm/dm/egg-knex.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-knex


Knex for egg framework.

[Knex](http://knexjs.org/) is a "batteries included" SQL query builder for Postgres, MSSQL, MySQL, MariaDB, SQLite3, and Oracle. `Knex` compare to `ali-rds`:
1. support multiple type database system
2. API is all `Promise`, easy to using `async/await`
3. Community-Driven
4. Support `stream`

## Installation

```bash
$ npm i --save egg-knex
```

## Configuration
### Install External Dependencies
- using `mysql` default support, there is no need to install any external things
- using `mysql2` install dependency `npm i --save mysql2`
- using `mariadb` install dependency `npm i --save mariasql`
- using `postgres` install dependency `npm i --save pg`
- using `mssql` install dependency `npm i --save mssql`
- using `oracledb` install dependency  `npm i --save oracledb`
- using `sqlite` install dependency `npm i --save sqlite3`

### Enable Plugin

Edit `${app_root}/config/plugin.js`:

```js
exports.knex = {
  enable: true,
  package: 'egg-knex',
};
```

### Add Configurations
Edit `${app_root}/config/config.${env}.js`:

```js
exports.knex = {
  // database configuration
  client: {
    // database dialect
    dialect: 'mysql',
    connection: {
      // host
      host: 'mysql.com',
      // port
      port: '3306',
      // username
      user: 'mobile_pub',
      // password
      password: 'password',
      // database
      database: 'mobile_pub',
    },
    // connection pool
    pool: { min: 0, max: 5 },
    // acquire connection timeout, millisecond
    acquireConnectionTimeout: 30000,
  },
  // load into app, default is open
  app: true,
  // load into agent, default is close
  agent: false,
};
```

## Usage
You can access to database instance by using:

```js
app.knex
```

### CURD

#### Create

```js
// insert
const result = yield app.knex.insert({title: 'Hello World'}).into('posts')
const insertSuccess = result === 1
```

> if you want mysql, sqlite, oracle return ids after insert multiple rows,
> you can choose [`batchInsert`](http://knexjs.org/#Utility-BatchInsert),
> it will insert raws one by one in a transaction.

#### Read

```js
// get one
const post = yield app.knex.first('*').where('id', 12).from('posts')
// query
const results = yield app.knex('posts')
  .select()
  .where({ status: 'draft' })
  .orderBy('created_at', 'desc')
  .orderBy('id', 'desc')
  .orderByRaw('description DESC NULLS LAST')
  .offset(0)
  .limit(10)

// join
const results = yield app.knex('posts')
  .innerJoin('groups', 'groups.id', 'posts.group_id')
  .select('posts.*', 'groups.name');
```

#### Update

```js
const row = {
  name: 'fengmk2',
  otherField: 'other field value',
  modifiedAt: app.knex.raw('CURRENT_TIMESTAMP'),
};
// Returns [1] in "mysql", "sqlite", "oracle"; [] in "postgresql" unless the 'returning' parameter is set.
const [affectedRows] = yield app.knex('posts')
  .update({row})
  .where(id, 1);
```


#### Delete

```js
const affectedRows = yield app.knex('table').where({ name: 'fengmk2' }).del();
```

### Transaction

`egg-knex` support manual/auto commit.

#### Manual commit

```js
const trx = yield app.knex.transaction();
try {
  yield trx.insert(row1).into('table');
  yield trx('table').update(row2);
  yield trx.commit()
} catch (e) {
  yield trx.rollback();
  throw e;
}
```

#### Auto commit

```js
const result = yield app.knex.transaction(function* transacting (trx) {
  yield trx(table).insert(row1);
  yield trx(table).update(row2).where(condition);
  return { success: true };
});
```

## Advanced Usage

### Multiple database instance: mysql + postgres + oracledb

Install dependencies:

```bash
$ npm i --save pg orcaledb
```

```js
exports.knex = {
  clients: {
    // clientId, access the client instance by app.knex.get('mysql')
    mysql: {
      dialect: 'mysql',
      connection: {
        // host
        host: 'mysql.com',
        // port
        port: '3306',
        // username
        user: 'mobile_pub',
        // password
        password: 'password',
        // database
        database: 'mobile_pub',
      },
      postgres: {
        dialect: 'postgres',
        connection: {
          ...
        }
      },
      oracle: {
        dialect: 'oracledb',
        connection: {
          ...
        }
      }
    },
    // ...
  },
  // default configuration for all databases
  default: {
  },
  // load into app, default is open
  app: true,
  // load into agent, default is close
  agent: false,
};
```

Usage:

```js
const mysql = app.knex.get('mysql');
mysql.raw(sql);

const pg = app.knex.get('postgres');
pg.raw(sql);

const oracle = app.knex.get('oracle');
oracle.raw(sql);
```

### Custom SQL splicing

```js
const [results] = yield app.knex.raw('update posts set hits = (hits + ?) where id = ?', [1, postId]);
```

### Raw

If you want to call literals or functions in mysql , you can use `raw`.

#### Inner Literal
- CURRENT_TIMESTAMP(): The database system current timestamp, you can obtain by `app.knex.fn.now()`.

```js
yield app.knex.insert(, {
  create_time: app.knex.fn.now()
}).into(table);

// INSERT INTO `$table`(`create_time`) VALUES(NOW())
```

#### Custom literal

The following demo showed how to call `CONCAT(s1, ...sn)` funtion in mysql to do string splicing.

```js
const first = 'James';
const last = 'Bond';
yield app.knex.insert({
  id: 123,
  fullname: app.knex.raw(`CONCAT("${first}", "${last}"`),
}).into(table);

// INSERT INTO `$table`(`id`, `fullname`) VALUES(123, CONCAT("James", "Bond"))
```

## License

[MIT](LICENSE)
