import { db } from '@/lib/db/drizzle';
import { pageviews, profiles, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, count, gte, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile) {
      return Response.json({
        totalPageviews: 0,
        uniqueVisitors: 0,
        avgTimeOnPage: 0,
        referrers: [],
        utmParams: [],
        locations: [],
        deviceTypes: [],
        browsers: [],
        dailyViews: [],
      });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const since = getDaysAgo(days);

    const condition = and(
      eq(pageviews.profileId, profile.id),
      gte(pageviews.visitedAt, since)
    );

    const [totalResult] = await db
      .select({ value: count() })
      .from(pageviews)
      .where(condition);

    const [visitorsResult] = await db
      .select({ value: count(sql`DISTINCT ${pageviews.sessionId}`) })
      .from(pageviews)
      .where(condition);

    const [avgDurationResult] = await db
      .select({
        value: sql<number>`COALESCE(AVG(${pageviews.duration}), 0)`,
      })
      .from(pageviews)
      .where(and(condition, sql`${pageviews.duration} IS NOT NULL`));

    const referrers = await db
      .select({
        name: pageviews.referrer,
        count: count(),
      })
      .from(pageviews)
      .where(
        and(
          condition,
          sql`${pageviews.referrer} IS NOT NULL AND ${pageviews.referrer} != ''`
        )
      )
      .groupBy(pageviews.referrer)
      .orderBy(sql`${count()} DESC`)
      .limit(10);

    const utmSources = await db
      .select({
        source: pageviews.utmSource,
        medium: pageviews.utmMedium,
        campaign: pageviews.utmCampaign,
        term: pageviews.utmTerm,
        content: pageviews.utmContent,
        count: count(),
      })
      .from(pageviews)
      .where(
        and(
          condition,
          sql`${pageviews.utmSource} IS NOT NULL AND ${pageviews.utmSource} != ''`
        )
      )
      .groupBy(
        pageviews.utmSource,
        pageviews.utmMedium,
        pageviews.utmCampaign,
        pageviews.utmTerm,
        pageviews.utmContent
      )
      .orderBy(sql`${count()} DESC`)
      .limit(10);

    const locations = await db
      .select({
        country: pageviews.country,
        city: pageviews.city,
        count: count(),
      })
      .from(pageviews)
      .where(
        and(
          condition,
          sql`${pageviews.country} IS NOT NULL AND ${pageviews.country} != ''`
        )
      )
      .groupBy(pageviews.country, pageviews.city)
      .orderBy(sql`${count()} DESC`)
      .limit(10);

    const deviceTypes = await db
      .select({
        type: pageviews.deviceType,
        count: count(),
      })
      .from(pageviews)
      .where(
        and(
          condition,
          sql`${pageviews.deviceType} IS NOT NULL AND ${pageviews.deviceType} != ''`
        )
      )
      .groupBy(pageviews.deviceType)
      .orderBy(sql`${count()} DESC`);

    const browsers = await db
      .select({
        name: pageviews.browser,
        count: count(),
      })
      .from(pageviews)
      .where(
        and(
          condition,
          sql`${pageviews.browser} IS NOT NULL AND ${pageviews.browser} != ''`
        )
      )
      .groupBy(pageviews.browser)
      .orderBy(sql`${count()} DESC`)
      .limit(10);

    const dailyViewsRaw = await db
      .select({
        date: sql<string>`DATE(${pageviews.visitedAt})`,
        views: count(),
      })
      .from(pageviews)
      .where(
        and(
          eq(pageviews.profileId, profile.id),
          gte(pageviews.visitedAt, since)
        )
      )
      .groupBy(sql`DATE(${pageviews.visitedAt})`)
      .orderBy(sql`DATE(${pageviews.visitedAt}) ASC`);

    return Response.json({
      totalPageviews: Number(totalResult.value) || 0,
      uniqueVisitors: Number(visitorsResult.value) || 0,
      avgTimeOnPage: Math.round(Number(avgDurationResult.value) || 0),
      referrers: (referrers as any[]).map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
      utmParams: (utmSources as any[]).map((u) => ({
        source: u.source,
        medium: u.medium,
        campaign: u.campaign,
        term: u.term,
        content: u.content,
        count: Number(u.count),
      })),
      locations: (locations as any[]).map((l) => ({
        country: l.country,
        city: l.city,
        count: Number(l.count),
      })),
      deviceTypes: (deviceTypes as any[]).map((d) => ({
        type: d.type,
        count: Number(d.count),
      })),
      browsers: (browsers as any[]).map((b) => ({
        name: b.name,
        count: Number(b.count),
      })),
      dailyViews: (dailyViewsRaw as any[]).map((d) => ({
        date: d.date,
        views: Number(d.views),
      })),
    });
  } catch (error) {
    console.error(
      'Analytics get error:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    return Response.json(
      { error: 'Failed to fetch analytics', detail: String(error) },
      { status: 500 }
    );
  }
}
