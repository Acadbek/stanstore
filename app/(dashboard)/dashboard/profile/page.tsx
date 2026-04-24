'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { Profile, Product } from '@/lib/db/schema';
import StorePage from '@/app/[username]/store-page';

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
};

type ProfileData = {
  user: { name?: string | null; email?: string | null };
  profile: Profile | null;
};

type StoreData = {
  profile: Profile;
  products: Product[];
};

export default function ProfilePage() {
  const { data: profileData, error: profileError } = useSWR<ProfileData>(
    '/api/profile',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const { data: productsData } = useSWR<Product[]>(
    '/api/products',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  if (profileError) {
    return (
      <section className="flex-1 p-8">
        <p className="text-sm text-red-500">
          Unable to load your profile. Please try again.
        </p>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your profile...
        </div>
      </section>
    );
  }

  const profile = profileData.profile;

  if (!profile) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center text-center py-24 px-4">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <p className="text-muted-foreground mb-6">
          No profile found. Create your profile to get started.
        </p>
        <Link href="/dashboard/profile/config">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Create Profile
          </Button>
        </Link>
      </section>
    );
  }

  const publishedProducts = ((productsData || []) as Product[]).filter(
    (product) => product.isPublished
  );

  const storeData: StoreData = {
    profile,
    products: publishedProducts,
  };

  return (
    <section className="flex-1 min-h-screen">
      <Link href="/dashboard/profile/config">
        <Button
          variant="secondary"
          className="flex items-center gap-2 fixed right-10 top-5"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </Link>
      <StorePage data={storeData} />
    </section>
  );
}
