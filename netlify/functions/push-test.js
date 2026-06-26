import { runPushScheduler } from './push-scheduler.js';

export default async function handler(request) {
  return runPushScheduler(request);
}
