import { notFound } from 'next/navigation';
import { getPublicStoreData } from '@/lib/db/queries';
import { Metadata } from 'next';
import StorePage from './store-page';
import { StoreUnavailable } from '@/components/store/store-unavailable';
import { isDatabaseConnectivityError } from '@/lib/db/drizzle';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  let storeData = null;

  try {
    storeData = await getPublicStoreData(username);
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) {
      throw error;
    }
  }

  if (!storeData) return {};

  const { profile } = storeData;
  const title = `${profile.displayName || profile.username} — Store`;
  const description = profile.headline || profile.bio || 'Visit my store';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
    },
  };
}

export default async function UsernamePage({ params }: Props) {
  const { username } = await params;
  let storeData = null;

  try {
    storeData = await getPublicStoreData(username);
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return <StoreUnavailable />;
    }

    throw error;
  }

  if (!storeData) {
    notFound();
  }

  return <StorePage data={storeData} />;
}
