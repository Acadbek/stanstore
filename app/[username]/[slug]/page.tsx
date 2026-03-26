import { notFound, redirect } from 'next/navigation';
import { getProductBySlug, getProfileByUsername } from '@/lib/db/queries';
import { Metadata } from 'next';
import ProductDetailClient from './product-detail-client';

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
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

  const [profile, product] = await Promise.all([
    getProfileByUsername(username),
    getProductBySlug(slug),
  ]);

  if (!profile || !product) {
    notFound();
  }

  return <ProductDetailClient profile={profile} product={product} />;
}
