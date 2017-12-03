2.0.3 / 2017-12-03
==================
  * feat: promisifid transaction support nested transaction
  * fix: rollback catch Promise.TimeoutError is undefined

2.0.2 / 2017-09-17
==================

  * adjust: using custom logger, log file path: logs/egg-knex.log
  * fix: shouldn't co.wrap normal function callback by knex.transaction
  * fix: shouldn't throw error when invoke rollback mannually

2.0.1 / 2017-08-23
==================
  * adjust: using app.coreLogger replace console
  * feat: debug mode will log query plan

2.0.0 / 2017-08-04
==================

  * feat: enhancement config  (#1)
