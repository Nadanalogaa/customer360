import 'dotenv/config';
export * as schema from './schema.js';
export declare const pool: import("pg").Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>>;
