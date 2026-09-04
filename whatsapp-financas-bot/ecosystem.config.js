module.exports = {
  apps: [
    {
      name: 'financas-bot',
      script: 'src/index.js',
      cwd: __dirname,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 30,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
