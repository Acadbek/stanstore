import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  exchangeGoogleCalendarCode,
  fetchGoogleCalendarUserEmail,
  getGoogleCalendarConfig,
  getGoogleCalendarReturnToCookieName,
  getGoogleCalendarStateCookieName,
  upsertGoogleCalendarConnection,
} from '@/lib/google-calendar';

function buildReturnUrl(
  request: NextRequest,
  returnTo: string,
  status: string,
  detail?: string
) {
  const url = new URL(returnTo, request.nextUrl.origin);
  url.searchParams.set('googleCalendar', status);
  if (detail) {
    url.searchParams.set('googleCalendarDetail', detail.slice(0, 300));
  }
  return url;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  const returnTo =
    request.cookies.get(getGoogleCalendarReturnToCookieName())?.value ||
    '/dashboard/products';
  const clearCookies = (response: NextResponse) => {
    response.cookies.delete(getGoogleCalendarStateCookieName());
    response.cookies.delete(getGoogleCalendarReturnToCookieName());
    return response;
  };

  if (!user) {
    return clearCookies(NextResponse.redirect(new URL('/sign-in', request.url)));
  }

  const config = getGoogleCalendarConfig();
  if (!config.isConfigured) {
    return clearCookies(
      NextResponse.redirect(
        buildReturnUrl(request, returnTo, 'missing_config')
      )
    );
  }

  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return clearCookies(
      NextResponse.redirect(
        buildReturnUrl(request, returnTo, 'access_denied')
      )
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState =
    request.cookies.get(getGoogleCalendarStateCookieName())?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return clearCookies(
      NextResponse.redirect(
        buildReturnUrl(request, returnTo, 'invalid_state')
      )
    );
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    const email = await fetchGoogleCalendarUserEmail(tokens.access_token);
    const expiresAt =
      typeof tokens.expires_in === 'number'
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    await upsertGoogleCalendarConnection({
      userId: user.id,
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      expiresAt,
    });

    return clearCookies(
      NextResponse.redirect(buildReturnUrl(request, returnTo, 'connected'))
    );
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'Unknown token exchange error';
    console.error('[google-calendar] token exchange failed', detail);
    return clearCookies(
      NextResponse.redirect(
        buildReturnUrl(
          request,
          returnTo,
          'token_exchange_failed',
          detail
        )
      )
    );
  }
}
