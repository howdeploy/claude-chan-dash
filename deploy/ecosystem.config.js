const path = require('path');

module.exports = {
  apps: [{
    name: 'claude-chan-dash',
    script: 'node_modules/.bin/next',
    args: 'start --hostname 127.0.0.1 --port 3000',
    cwd: __dirname.replace('/deploy', ''),
    env: {
      NODE_ENV: 'production',
      WORKSPACE_PATH: process.env.HOME || '/root',
    },
  }],
};
