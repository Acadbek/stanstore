'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { Profile, Product } from '@/lib/db/schema';
import StorePage from '@/app/[username]/store-page';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    fetcher
  );
  const { data: productsData, error: productsError } = useSWR<Product[]>(
    '/api/products',
    fetcher
  );

  if (profileError || productsError) {
    return (
      <section className="flex-1 p-8">
        <p className="text-sm text-red-500">
          Unable to load your profile. Please try again.
        </p>
      </section>
    );
  }

  if (!profileData || !productsData) {
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

  const publishedProducts = productsData.filter(
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
