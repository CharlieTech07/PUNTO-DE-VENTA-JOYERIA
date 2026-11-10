const os = require('node:os');
const pathToRunner = __filename.replace(/\\/g, '/');
const preloadMarker = 'OLIMPO_TSX_USERINFO_FALLBACK';

const originalUserInfo = os.userInfo.bind(os);

os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch (error) {
    if (error?.code !== 'ERR_SYSTEM_ERROR' || error?.syscall !== 'uv_os_get_passwd') {
      throw error;
    }

    // tsx only needs a username to name its temporary directory. On some
    // Windows environments, Node cannot read the account metadata, so use a
    // process-scoped fallback for that path and leave other errors untouched.
    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || process.env.USER || `pid-${process.pid}`,
      homedir: process.env.USERPROFILE || process.env.HOME || os.tmpdir(),
      shell: null,
    };
  }
};

// tsx may start another Node process. Pass this same fallback to child
// processes so they can create the temporary pipe directory too.
if (process.env[preloadMarker] !== '1') {
  process.env[preloadMarker] = '1';
  const preloadOption = `--require="${pathToRunner}"`;
  const nodeOptions = process.env.NODE_OPTIONS || '';

  if (!nodeOptions.includes(pathToRunner)) {
    process.env.NODE_OPTIONS = `${nodeOptions} ${preloadOption}`.trim();
  }
}

if (require.main === module) {
  import('tsx/cli').catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
