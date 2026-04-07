import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';

type PostHogResponse = {
  results?: Array<{
    data?: Array<{ [key: string]: string | number }>;
  }>;
};

async function posthogQuery(query: {
  query_kind: string;
  event?: string;
  properties?: Record<string, any>;
  formula?: string;
  breakdown_query?: {
    breakdown: string;
    breakdown_type?: string;
    sort_key?: string;
    limit?: number;
  };
  date_range?: { date_from: string; date_to: string };
  intervals?: string;
  limit?: number;
}) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  const res = await fetch(`${host}/api/projects/@current/insights/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<PostHogResponse>;
}

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const dateFrom = getDaysAgo(days);
    const dateTo = new Date().toISOString().split('T')[0];

    const baseUrlPattern = `/%/${user.name || user.email}`;
    const storePageFilter = {
      key: '$current_url',
      value: process.env.BASE_URL || 'http://localhost:3000',
      operator: 'regex',
      type: 'event',
    };

    const dateRange = { date_from: dateFrom, date_to: dateTo };

    const [
      totalViews,
      uniqueVisitors,
      dailyViewsRes,
      referrersRes,
      countriesRes,
      devicesRes,
      browsersRes,
      utmSourceRes,
    ] = await Promise.allSettled([
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        date_range: dateRange,
        intervals: 'day',
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        breakdown_query: {
          breakdown: '$referrer',
          breakdown_type: 'event',
          sort_key: '-count()',
          limit: 10,
        },
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        breakdown_query: {
          breakdown: '$geoip_country_name',
          breakdown_type: 'event',
          sort_key: '-count()',
          limit: 10,
        },
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        breakdown_query: {
          breakdown: '$device_type',
          breakdown_type: 'event',
          sort_key: '-count()',
          limit: 10,
        },
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        breakdown_query: {
          breakdown: '$browser',
          breakdown_type: 'event',
          sort_key: '-count()',
          limit: 10,
        },
        date_range: dateRange,
      }),
      posthogQuery({
        query_kind: 'TrendsQuery',
        event: '$pageview',
        properties: { type: 'AND', values: [storePageFilter] },
        formula: 'count()',
        breakdown_query: {
          breakdown: 'utm_source',
          breakdown_type: 'event',
          sort_key: '-count()',
          limit: 10,
        },
        date_range: dateRange,
      }),
    ]);

    const parseTrend = (
      result: PromiseSettledResult<PostHogResponse>
    ): number => {
      if (result.status !== 'fulfilled') return 0;
      const val = result.value?.results?.[0]?.data?.[0]?.count;
      return Number(val) || 0;
    };

    const parseBreakdown = (
      result: PromiseSettledResult<PostHogResponse>
    ): { name: string; count: number }[] => {
      if (result.status !== 'fulfilled') return [];
      return (result.value?.results || []).map((r: any) => {
        const d = r?.data?.[0] || r;
        return {
          name: d.breakdown_value || d.label || 'Unknown',
          count: Number(d.count) || 0,
        };
      });
    };

    const parseDaily = (
      result: PromiseSettledResult<PostHogResponse>
    ): { date: string; views: number }[] => {
      if (result.status !== 'fulfilled') return [];
      return (result.value?.results?.[0]?.data || []).map((d: any) => ({
        date: d.date || d.label,
        views: Number(d.count) || 0,
      }));
    };

    const totalPageviews = parseTrend(totalViews);
    const uniqueVisitorsCount = parseTrend(uniqueVisitors);
    const dailyViews = parseDaily(dailyViewsRes);

    return Response.json({
      totalPageviews,
      uniqueVisitors: uniqueVisitorsCount,
      avgTimeOnPage: 0,
      referrers: parseBreakdown(referrersRes),
      utmParams: parseBreakdown(utmSourceRes).map((r) => ({
        ...r,
        source: r.name,
        medium: null,
        campaign: null,
        term: null,
        content: null,
      })),
      locations: parseBreakdown(countriesRes).map((l) => ({
        country: l.name,
        city: null,
        count: l.count,
      })),
      deviceTypes: parseBreakdown(devicesRes).map((d) => ({
        type: d.name,
        count: d.count,
      })),
      browsers: parseBreakdown(browsersRes).map((b) => ({
        name: b.name,
        count: b.count,
      })),
      dailyViews,
    });
  } catch (error) {
    console.error('Analytics get error:', error);
    return Response.json(
      { error: 'Failed to fetch analytics', detail: String(error) },
      { status: 500 }
    );
  }
}
