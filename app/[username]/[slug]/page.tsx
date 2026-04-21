import { notFound } from 'next/navigation';
import { getProductBySlug, getProfileByUsername } from '@/lib/db/queries';
import { Metadata } from 'next';
import ProductDetailClient from './product-detail-client';
import { StoreUnavailable } from '@/components/store/store-unavailable';
import { isDatabaseConnectivityError } from '@/lib/db/drizzle';

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product = null;

  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) {
      throw error;
    }
  }

  if (!product) return {};

  return {
    title: product.title,
    description: product.description || undefined,
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { username, slug } = await params;

  let profile = null;
  let product = null;

  try {
    [profile, product] = await Promise.all([
      getProfileByUsername(username),
      getProductBySlug(slug),
    ]);
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return (
        <StoreUnavailable
          title="Product temporarily unavailable"
          description="The product page could not reach the database. Try again after the DB connection is restored."
        />
      );
    }

    throw error;
  }

  if (!profile || !product) {
    notFound();
  }

  return <ProductDetailClient profile={profile} product={product} />;
}
