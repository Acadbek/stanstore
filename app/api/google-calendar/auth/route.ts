import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  buildGoogleCalendarAuthUrl,
  getGoogleCalendarConfig,
  getGoogleCalendarReturnToCookieName,
  getGoogleCalendarStateCookieName,
} from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const config = getGoogleCalendarConfig();
  const returnTo =
    request.nextUrl.searchParams.get('returnTo') || '/dashboard/products';

  if (!config.isConfigured) {
    return NextResponse.redirect(
      new URL(
        `${returnTo}?googleCalendar=missing_config`,
        request.nextUrl.origin
      )
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildGoogleCalendarAuthUrl(state));

  response.cookies.set(getGoogleCalendarStateCookieName(), state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  response.cookies.set(getGoogleCalendarReturnToCookieName(), returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
