import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const primaryUrl = process.env.POSTGRES_URL;
const fallbackUrl = process.env.POSTGRES_URL_NON_POOLING;

if (!primaryUrl) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

function createClient(url: string) {
  return postgres(url, {
    connect_timeout: 5,
    idle_timeout: 20,
    max: 1,
  });
}

let preferFallbackUntil = 0;

export function isDatabaseConnectivityError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    message.includes('connect_timeout') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('connection refused') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('enotfound') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout')
  );
}

export const client = createClient(primaryUrl);
export const db = drizzle(client, { schema });

const fallbackClient =
  fallbackUrl && fallbackUrl !== primaryUrl ? createClient(fallbackUrl) : null;

const fallbackDb = fallbackClient ? drizzle(fallbackClient, { schema }) : null;

export async function withDatabaseFallback<T>(
  operation: (database: PostgresJsDatabase<typeof schema>) => Promise<T>
) {
  const shouldUseFallbackFirst = fallbackDb && Date.now() < preferFallbackUntil;

  if (shouldUseFallbackFirst) {
    return operation(fallbackDb);
  }

  try {
    return await operation(db);
  } catch (error) {
    if (!fallbackDb || !isDatabaseConnectivityError(error)) {
      throw error;
    }

    preferFallbackUntil = Date.now() + 60_000;
    return operation(fallbackDb);
  }
}
