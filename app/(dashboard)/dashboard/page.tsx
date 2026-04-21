'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Users,
  Clock,
  Globe,
  Monitor,
  MousePointerClick,
  Link2,
  MapPin,
  Package,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { Product } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const dayOptions = [
  { label: '7 kun', value: '7' },
  { label: '30 kun', value: '30' },
  { label: '90 kun', value: '90' },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-gray-500 mb-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ListCard<T extends { count: number }>({
  title,
  icon: Icon,
  items,
  renderLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: T[];
  renderLabel: (item: T) => string;
}) {
  const maxCount =
    items.length > 0 ? Math.max(...items.map((i) => i.count)) : 0;

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Ma'lumot yo'q</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate mr-2">
                {renderLabel(item)}
              </span>
              <span className="text-gray-500 shrink-0">{item.count}</span>
            </div>
            <ProgressBar value={item.count} max={maxCount} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  dailyViews,
}: {
  dailyViews: { date: string; views: number }[];
}) {
  const maxViews =
    dailyViews.length > 0 ? Math.max(...dailyViews.map((d) => d.views)) : 1;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          Kunlik ko'rishlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dailyViews.length === 0 ? (
          <p className="text-sm text-gray-400">Ma'lumot yo'q</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {dailyViews.map((d) => {
              const height = maxViews > 0 ? (d.views / maxViews) * 100 : 0;
              const dateLabel = new Date(d.date).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {dateLabel}: {d.views}
                  </div>
                  <div
                    className="w-full bg-orange-500 rounded-t transition-all duration-300 hover:bg-orange-600 min-h-[2px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 hidden sm:block truncate w-full text-center">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UtmCard({
  utmParams,
}: {
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
    count: number;
  }[];
}) {
  if (utmParams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-gray-500" />
            UTM Parametrlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Ma'lumot yo'q</p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...utmParams.map((u) => u.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-gray-500" />
          UTM Parametrlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {utmParams.map((u, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 truncate">
                <span className="font-medium">{u.source}</span>
                {u.medium && (
                  <span className="text-gray-400"> / {u.medium}</span>
                )}
                {u.campaign && (
                  <span className="text-gray-400"> / {u.campaign}</span>
                )}
              </div>
              <span className="text-gray-500 text-sm shrink-0 ml-2">
                {u.count}
              </span>
            </div>
            <ProgressBar value={u.count} max={maxCount} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DashboardStats() {
  const emptyData = {
    totalPageviews: 0,
    uniqueVisitors: 0,
    avgTimeOnPage: 0,
    referrers: [] as { name: string; count: number }[],
    utmParams: [] as {
      source: string;
      medium: string;
      campaign: string;
      term: string;
      content: string;
      count: number;
    }[],
    locations: [] as { country: string; city: string; count: number }[],
    deviceTypes: [] as { type: string; count: number }[],
    browsers: [] as { name: string; count: number }[],
    dailyViews: [] as { date: string; views: number }[],
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Dashboard
        </h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              className="px-3 py-1.5 text-sm rounded-md transition-colors text-gray-500 hover:text-gray-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            label="Jami ko'rishlar"
            value={emptyData.totalPageviews.toLocaleString()}
          />
          <StatCard
            icon={Users}
            label="Noyob tashriflar"
            value={emptyData.uniqueVisitors.toLocaleString()}
          />
          <StatCard
            icon={Clock}
            label="O'rtacha vaqt"
            value={formatDuration(emptyData.avgTimeOnPage)}
            subtext="sahifada"
          />
          <StatCard
            icon={Globe}
            label="Referrers"
            value={emptyData.referrers.length}
            subtext="manbalar"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard dailyViews={emptyData.dailyViews} />
          <UtmCard utmParams={emptyData.utmParams} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListCard
            title="Referrers"
            icon={Link2}
            items={emptyData.referrers}
            renderLabel={(r) => r.name || 'Direct'}
          />
          <ListCard
            title="Davlat va Shahar"
            icon={MapPin}
            items={emptyData.locations}
            renderLabel={(l) => `${l.country}${l.city ? `, ${l.city}` : ''}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListCard
            title="Qurilma turi"
            icon={Monitor}
            items={emptyData.deviceTypes}
            renderLabel={(d) => d.type}
          />
          <ListCard
            title="Brauzer"
            icon={Globe}
            items={emptyData.browsers}
            renderLabel={(b) => b.name}
          />
        </div>
      </div>
    </>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ishni boshlaylik!</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        Birinchi productni yaratish uchun profilingiz uchun theme tanlang
      </p>
      <Link href="/dashboard/themes">
        <Button className="bg-orange-500 hover:bg-orange-600 text-white text-base px-8 py-3 h-auto font-semibold">
          Create Product
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { data: products, isLoading } = useSWR<Product[]>('/api/products', fetcher);

  if (isLoading || !products) {
    return (
      <section className="flex-1 lg:p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="flex-1 lg:p-8">
        <EmptyDashboard />
      </section>
    );
  }

  return (
    <section className="flex-1 lg:p-8">
      <DashboardStats />
    </section>
  );
}
