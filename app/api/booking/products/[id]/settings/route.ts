import { NextRequest, NextResponse } from 'next/server';
import { getUser, getProductById } from '@/lib/db/queries';
import {
  getBookingSettings,
  getDefaultBookingSettings,
} from '@/lib/booking';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || product.userId !== user.id) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const settings =
    (await getBookingSettings(product.id)) ||
    getDefaultBookingSettings(product.id, user.id);

  return NextResponse.json({
    timezone: settings.timezone,
    durationMinutes: settings.durationMinutes,
    intervalMinutes: settings.intervalMinutes,
    bufferMinutes: settings.bufferMinutes,
    minNoticeMinutes: settings.minNoticeMinutes,
    maxDaysAhead: settings.maxDaysAhead,
    weeklyAvailability: settings.weeklyAvailability,
  });
}
