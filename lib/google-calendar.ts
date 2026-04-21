import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

const GOOGLE_CALENDAR_CONNECTIONS_TABLE = 'google_calendar_connections';
const GOOGLE_CALENDAR_STATE_COOKIE = 'google_calendar_oauth_state';
const GOOGLE_CALENDAR_RETURN_TO_COOKIE = 'google_calendar_oauth_return_to';

export const GOOGLE_CALENDAR_REQUIRED_ENV_KEYS = [
  'BASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
] as const;

export type GoogleCalendarConnection = {
  userId: number;
  email: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  scope: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type GoogleCalendarTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeTimestamp(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function getGoogleCalendarRedirectUri() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) return null;
  return `${normalizeBaseUrl(baseUrl)}/api/google-calendar/callback`;
}

export function getMissingGoogleCalendarEnv() {
  return GOOGLE_CALENDAR_REQUIRED_ENV_KEYS.filter(
    (key) => !process.env[key]?.trim()
  );
}

export function getGoogleCalendarConfig() {
  const missingEnv = getMissingGoogleCalendarEnv();
  const redirectUri = getGoogleCalendarRedirectUri();

  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri,
    missingEnv,
    isConfigured: missingEnv.length === 0 && Boolean(redirectUri),
  };
}

export function buildGoogleCalendarAuthUrl(state: string) {
  const config = getGoogleCalendarConfig();
  if (!config.isConfigured || !config.redirectUri) {
    throw new Error('Google Calendar OAuth is not configured.');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_CALENDAR_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleCalendarCode(code: string) {
  const config = getGoogleCalendarConfig();
  if (!config.isConfigured || !config.redirectUri) {
    throw new Error('Google Calendar OAuth is not configured.');
  }

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google token exchange failed: ${message}`);
  }

  return (await response.json()) as GoogleCalendarTokenResponse;
}

export async function fetchGoogleCalendarUserEmail(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { email?: string };
  return data.email || null;
}

export async function ensureGoogleCalendarConnectionsTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS ${GOOGLE_CALENDAR_CONNECTIONS_TABLE} (
      id serial PRIMARY KEY,
      user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email varchar(255),
      access_token text NOT NULL,
      refresh_token text,
      token_type varchar(50),
      scope text,
      expires_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `));
}

export async function getGoogleCalendarConnection(userId: number) {
  await ensureGoogleCalendarConnectionsTable();

  const rows = await db.execute<{
    user_id: number;
    email: string | null;
    access_token: string;
    refresh_token: string | null;
    token_type: string | null;
    scope: string | null;
    expires_at: string | Date | null;
    created_at: string | Date;
    updated_at: string | Date;
  }>(sql`
    SELECT
      user_id,
      email,
      access_token,
      refresh_token,
      token_type,
      scope,
      expires_at,
      created_at,
      updated_at
    FROM ${sql.raw(GOOGLE_CALENDAR_CONNECTIONS_TABLE)}
    WHERE user_id = ${userId}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    userId: row.user_id,
    email: row.email,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenType: row.token_type,
    scope: row.scope,
    expiresAt: normalizeTimestamp(row.expires_at),
    createdAt: normalizeTimestamp(row.created_at)!,
    updatedAt: normalizeTimestamp(row.updated_at)!,
  } satisfies GoogleCalendarConnection;
}

export async function upsertGoogleCalendarConnection(input: {
  userId: number;
  email?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  expiresAt?: Date | null;
}) {
  await ensureGoogleCalendarConnectionsTable();

  await db.execute(sql`
    INSERT INTO ${sql.raw(GOOGLE_CALENDAR_CONNECTIONS_TABLE)} (
      user_id,
      email,
      access_token,
      refresh_token,
      token_type,
      scope,
      expires_at,
      updated_at
    )
    VALUES (
      ${input.userId},
      ${input.email ?? null},
      ${input.accessToken},
      ${input.refreshToken ?? null},
      ${input.tokenType ?? null},
      ${input.scope ?? null},
      ${input.expiresAt ?? null},
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, ${sql.raw(
        `${GOOGLE_CALENDAR_CONNECTIONS_TABLE}.refresh_token`
      )}),
      token_type = EXCLUDED.token_type,
      scope = EXCLUDED.scope,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
  `);
}

export async function deleteGoogleCalendarConnection(userId: number) {
  await ensureGoogleCalendarConnectionsTable();

  await db.execute(sql`
    DELETE FROM ${sql.raw(GOOGLE_CALENDAR_CONNECTIONS_TABLE)}
    WHERE user_id = ${userId}
  `);
}

export function getGoogleCalendarStateCookieName() {
  return GOOGLE_CALENDAR_STATE_COOKIE;
}

export function getGoogleCalendarReturnToCookieName() {
  return GOOGLE_CALENDAR_RETURN_TO_COOKIE;
}
