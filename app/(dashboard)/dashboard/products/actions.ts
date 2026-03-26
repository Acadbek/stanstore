'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(50000).optional(),
  price: z.string().optional(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['digital', 'booking', 'link']).optional(),
});

export const createProduct = validatedActionWithUser(
  createProductSchema,
  async (data, _, user) => {
    const { title, description, price, productUrl, imageUrl, type } = data;

    let slug = generateSlug(title);

    const existing = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const priceInCents = price && !isNaN(Number(price)) && Number(price) > 0
      ? Math.round(Number(price) * 100)
      : null;

    await db.insert(products).values({
      userId: user.id,
      slug,
      title,
      description: description || null,
      price: priceInCents,
      productUrl: productUrl || null,
      imageUrl: imageUrl || null,
      type: type || 'digital',
      isPublished: true,
    });

    return { success: 'Product created successfully.' };
  }
);

const updateProductSchema = z.object({
  id: z.coerce.number(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(50000).optional(),
  price: z.string().optional(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['digital', 'booking', 'link']).optional(),
  isPublished: z.enum(['true', 'false']).optional(),
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    const { id, title, description, price, productUrl, imageUrl, type, isPublished } = data;

    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, user.id)))
      .limit(1);

    if (!existing) {
      return { error: 'Product not found.' };
    }

    const priceInCents = price && !isNaN(Number(price)) && Number(price) > 0
      ? Math.round(Number(price) * 100)
      : null;

    await db
      .update(products)
      .set({
        title,
        description: description || null,
        price: priceInCents,
        productUrl: productUrl || null,
        imageUrl: imageUrl || null,
        type: type || existing.type,
        isPublished: isPublished === 'true',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return { success: 'Product updated successfully.' };
  }
);

const deleteProductSchema = z.object({
  id: z.coerce.number(),
});

export const deleteProduct = validatedActionWithUser(
  deleteProductSchema,
  async (data, _, user) => {
    const { id } = data;

    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, user.id)))
      .limit(1);

    if (!existing) {
      return { error: 'Product not found.' };
    }

    await db.delete(products).where(eq(products.id, id));

    return { success: 'Product deleted successfully.' };
  }
);

const toggleProductSchema = z.object({
  id: z.coerce.number(),
  isPublished: z.enum(['true', 'false']),
});

export const toggleProductPublish = validatedActionWithUser(
  toggleProductSchema,
  async (data, _, user) => {
    const { id, isPublished } = data;

    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, user.id)))
      .limit(1);

    if (!existing) {
      return { error: 'Product not found.' };
    }

    await db
      .update(products)
      .set({
        isPublished: isPublished === 'true',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return { success: isPublished === 'true' ? 'Product published.' : 'Product unpublished.' };
  }
);
