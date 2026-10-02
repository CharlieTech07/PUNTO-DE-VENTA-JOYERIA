/**
 * @type {import('webpack-dev-server').ProxyConfigArray}
 */
const PROXY_CONFIG = [
  {
    context: ['/api', '/inventario', '/productos', '/sucursales'],
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
];

module.exports = PROXY_CONFIG;