/* Minimal console logger (replaces the old `loglevel` dependency). */
type LogFn = (...args: unknown[]) => void;

export const logger: { trace: LogFn; debug: LogFn; info: LogFn; warn: LogFn; error: LogFn } = {
  trace: (...args) => console.debug(...args),
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
