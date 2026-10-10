import type { Logger } from './pipeline.js';

/** One JSON line per event (Railway log search). Never pass message text or personal data here. */
export const jsonLogger: Logger = {
  info: (event, data = {}) => console.log(JSON.stringify({ level: 'info', event, ...data })),
  error: (event, data = {}) => console.error(JSON.stringify({ level: 'error', event, ...data })),
};
