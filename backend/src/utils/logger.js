const LEVELS = ['error', 'warn', 'info', 'debug'];
const currentLevel = process.env.LOG_LEVEL || 'info';
const currentLevelIndex = LEVELS.indexOf(currentLevel);

function timestamp() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  const levelIndex = LEVELS.indexOf(level);
  if (levelIndex === -1 || levelIndex > currentLevelIndex) return;

  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, message, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
}

module.exports = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};
