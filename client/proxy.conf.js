/**
 * @type {import('webpack-dev-server').ProxyConfigArray}
 */
const PROXY_CONFIG = [
  {
    // Keep Angular page routes such as /productos and /sucursales local to
    // the client. API requests use the /api prefix exclusively.
    context: ['/api'],
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
];

module.exports = PROXY_CONFIG;
