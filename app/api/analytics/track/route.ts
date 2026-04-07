import { db } from '@/lib/db/drizzle';
import { pageviews } from '@/lib/db/schema';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profileId,
      sessionId,
      pageName,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      country,
      city,
      deviceType,
      browser,
      os,
    } = body;

    if (!profileId || !sessionId || !pageName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await db.insert(pageviews).values({
      profileId,
      sessionId,
      pageName,
      referrer: referrer || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmTerm: utmTerm || null,
      utmContent: utmContent || null,
      country: country || null,
      city: city || null,
      deviceType: deviceType || null,
      browser: browser || null,
      os: os || null,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return Response.json({ error: 'Failed to track' }, { status: 500 });
  }
}
