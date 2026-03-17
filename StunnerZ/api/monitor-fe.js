const axios = require('axios');
const { spawnSync } = require('child_process');

const restartPm2 = () => {
  const child = spawnSync('/usr/bin/pm2', ['reload', 'stunnerz.com']);

  console.log('stdout ', child.stdout.toString());
};

setTimeout(() => {
  axios.get('https://stunnerz.com')
    .catch(() => {
      // error, need to reset pm2 script
      restartPm2();
    });
});
