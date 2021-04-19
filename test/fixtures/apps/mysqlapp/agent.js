'use strict';

const co = require('co');
const fs = require('fs');
const path = require('path');

module.exports = function(agent) {
  const done = agent.readyCallback('agent-knex');
  const p = path.join(__dirname, 'run/agent_result.json');
  fs.existsSync(p) && fs.unlinkSync(p);

  co(async function () {
    const result = await agent.knex.raw('select now() as currentTime');
    fs.writeFileSync(p, JSON.stringify(result[0]));
  }).then(done, done);
};
