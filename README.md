# egg-knex

Knex for egg framework

## Install

```bash
$ npm i egg-knex --save
```

## Configuration

Change `${app_root}/config/plugin.js` to enable knex plugin:

```js
exports.mysql = {
  enable: true,
  package: 'egg-knex',
};
```

Configure database information in `${app_root}/config/config.default.js`:

### Simple database instance

```js
exports.mysql = {
  // database configuration
  client: {
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
  // load into app, default is open
  app: true,
  // load into agent, default is close
  agent: false,
};
```

Usage:

```js
app.mysql// you can access to simple database instance by using app.mysql.
```


### Multiple database instance

```js
exports.mysql = {
  clients: {
    // clientId, access the client instance by app.mysql.get('clientId')
    mypay1: {
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
const client1 = app.mysql.get('client1');
client1.raw(sql);

const client2 = app.mysql.get('client2');
client2.raw(sql);
```

## CRUD user guide

### Create

```js
// insert
const result = yield app.mysql.insert('title', 'Hello World').from('posts')
const insertSuccess = result === 1;
```

### Read

```js
// get
const post = yield app.mysql.select('*').where('id', 12).from('posts')
// query
```

### More Coming Soon...

