import { writeFileSync } from 'fs';

export function debugLog(message: string) {
  try {
    writeFileSync('debug.log', `[${new Date().toISOString()}] ${message}\n`, { flag: 'a' });
  } catch (error: unknown) {
    console.error('Debug log error:', (error as Error).message);
  }
}