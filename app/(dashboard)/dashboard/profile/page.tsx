'use client';

import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { Profile, Product } from '@/lib/db/schema';
import useSWR from 'swr';
import Link from 'next/link';
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
  const { data: profileData } = useSWR<ProfileData>('/api/profile', fetcher);
  const { data: productsData } = useSWR<Product[]>('/api/products', fetcher);

  const profile = profileData?.profile;

  if (!profile) {
    return (
      <section className="flex-1">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
          Profile
        </h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground mb-4">No profile found. Create your profile to get started.</p>
          <Link href="/dashboard/profile/config">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Create Profile
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const storeData: StoreData = {
    profile,
    products: productsData?.filter((p) => p.isPublished) || [],
  };

  return (
    <section className="flex-1">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/profile/config">
          <Button className="absolute top-10 right-10 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>
      <StorePage data={storeData} />
    </section>
  );
}
