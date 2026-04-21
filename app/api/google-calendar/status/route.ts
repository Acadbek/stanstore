import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getGoogleCalendarConnection,
  getGoogleCalendarConfig,
} from '@/lib/google-calendar';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await getGoogleCalendarConnection(user.id);
  const config = getGoogleCalendarConfig();

  return NextResponse.json({
    connected: Boolean(connection),
    email: connection?.email || null,
    expiresAt: connection?.expiresAt?.toISOString() || null,
    connectedAt: connection?.createdAt?.toISOString() || null,
    updatedAt: connection?.updatedAt?.toISOString() || null,
    redirectUri: config.redirectUri,
    missingEnv: config.missingEnv,
    isConfigured: config.isConfigured,
    authUrl: '/api/google-calendar/auth?returnTo=/dashboard/products',
  });
}
