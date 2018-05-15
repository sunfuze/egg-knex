'use strict';

const knex = require('./lib/knex');

module.exports = agent => {
  if (agent.config.knex.agent) knex(agent);
};
