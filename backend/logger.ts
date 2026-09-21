export const DEBUG = false;

export const log = (...args: unknown[]): void => {
  if (DEBUG) console.log(...args);
};

export const warn = (...args: unknown[]): void => {
  if (DEBUG) console.warn(...args);
};
