import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarConnection } from '@/lib/google-calendar';
import { getProductBySlug, getProfileByUsername } from '@/lib/db/queries';
import {
  createBookingAppointment,
  getBookingSettings,
  getDefaultBookingSettings,
  listBookingAvailability,
} from '@/lib/booking';

type Context = {
  params: Promise<{ username: string; slug: string }>;
};

const bookingRequestSchema = z.object({
  customerName: z.string().trim().min(2).max(200),
  customerEmail: z.string().trim().email(),
  customerNotes: z.string().trim().max(2000).optional(),
  startTime: z.string().datetime(),
});

async function resolveBookingProduct(username: string, slug: string) {
  const [profile, product] = await Promise.all([
    getProfileByUsername(username),
    getProductBySlug(slug),
  ]);

  if (
    !profile ||
    !product ||
    product.userId !== profile.userId ||
    product.type !== 'booking' ||
    !product.isPublished
  ) {
    return null;
  }

  return { profile, product };
}

export async function GET(request: NextRequest, context: Context) {
  const { username, slug } = await context.params;
  const resolved = await resolveBookingProduct(username, slug);

  if (!resolved) {
    return NextResponse.json({ error: 'Booking product not found' }, { status: 404 });
  }

  const googleConnection = await getGoogleCalendarConnection(
    resolved.product.userId
  );

  if (!googleConnection) {
    return NextResponse.json(
      {
        connected: false,
        message: 'Creator has not connected Google Calendar yet.',
      },
      { status: 409 }
    );
  }

  const settings =
    (await getBookingSettings(resolved.product.id)) ||
    getDefaultBookingSettings(resolved.product.id, resolved.product.userId);

  const date =
    request.nextUrl.searchParams.get('date') ||
    new Intl.DateTimeFormat('en-CA', {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  const days = Number(request.nextUrl.searchParams.get('days') || '7');

  try {
    const availability = await listBookingAvailability({
      product: resolved.product,
      settings,
      startDate: date,
      days,
    });

    return NextResponse.json({
      connected: true,
      timezone: settings.timezone,
      durationMinutes: settings.durationMinutes,
      intervalMinutes: settings.intervalMinutes,
      bufferMinutes: settings.bufferMinutes,
      minNoticeMinutes: settings.minNoticeMinutes,
      maxDaysAhead: settings.maxDaysAhead,
      availability,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'Failed to load availability';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { username, slug } = await context.params;
  const resolved = await resolveBookingProduct(username, slug);

  if (!resolved) {
    return NextResponse.json({ error: 'Booking product not found' }, { status: 404 });
  }

  const googleConnection = await getGoogleCalendarConnection(
    resolved.product.userId
  );

  if (!googleConnection) {
    return NextResponse.json(
      { error: 'Creator has not connected Google Calendar yet.' },
      { status: 409 }
    );
  }

  const payload = bookingRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: 'Invalid booking payload', detail: payload.error.flatten() },
      { status: 400 }
    );
  }

  const settings =
    (await getBookingSettings(resolved.product.id)) ||
    getDefaultBookingSettings(resolved.product.id, resolved.product.userId);

  try {
    const booking = await createBookingAppointment({
      product: resolved.product,
      settings,
      customerName: payload.data.customerName,
      customerEmail: payload.data.customerEmail,
      customerNotes: payload.data.customerNotes,
      startTimeIso: payload.data.startTime,
      username,
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Booking failed';
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}
