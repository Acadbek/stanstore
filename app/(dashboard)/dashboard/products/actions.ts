'use server';

import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { products, profiles } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

type OwnedProductRecord = {
  id: number;
  slug: string;
  type: string;
  isPublished: boolean;
  frontStyle: string;
  frontStylePrompt: string | null;
};

function isMissingFrontStyleColumnsError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('front_style') ||
    message.includes('front style') ||
    message.includes('front_style_prompt') ||
    message.includes('front style prompt')
  );
}

async function ensureFrontStyleColumns() {
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style varchar(20) NOT NULL DEFAULT 'inherit'
  `);
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style_prompt text
  `);
}

async function slugExists(slug: string) {
  const rows = await db.execute<{ id: number }>(sql`
    SELECT id
    FROM products
    WHERE slug = ${slug}
    LIMIT 1
  `);

  return rows.length > 0;
}

async function getOwnedProductRecord(
  id: number,
  userId: number
): Promise<OwnedProductRecord | null> {
  try {
    const rows = await db.execute<{
      id: number;
      slug: string;
      type: string;
      is_published: boolean;
      front_style: string | null;
      front_style_prompt: string | null;
    }>(sql`
      SELECT id, slug, type, is_published, front_style, front_style_prompt
      FROM products
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      isPublished: row.is_published,
      frontStyle: row.front_style || 'inherit',
      frontStylePrompt: row.front_style_prompt || null,
    };
  } catch (error) {
    if (!isMissingFrontStyleColumnsError(error)) {
      throw error;
    }

    const rows = await db.execute<{
      id: number;
      slug: string;
      type: string;
      is_published: boolean;
    }>(sql`
      SELECT id, slug, type, is_published
      FROM products
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      isPublished: row.is_published,
      frontStyle: 'inherit',
      frontStylePrompt: null,
    };
  }
}

async function revalidateStorePaths(userId: number, productSlug?: string) {
  const profileRows = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const username = profileRows[0]?.username;
  if (!username) return;

  revalidatePath(`/${username}`);
  if (productSlug) {
    revalidatePath(`/${username}/${productSlug}`);
  }
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/products');
}

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(50000).optional(),
  price: z.string().optional(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['digital', 'booking', 'link']).optional(),
  frontStyle: z.enum(['inherit', 'pill', 'cta', 'editorial', 'custom']).optional(),
  frontStylePrompt: z.string().max(3000).optional(),
});

export const createProduct = validatedActionWithUser(
  createProductSchema,
  async (data, _, user) => {
    const {
      title,
      description,
      price,
      productUrl,
      imageUrl,
      type,
      frontStyle,
      frontStylePrompt,
    } = data;

    let slug = generateSlug(title);

    if (await slugExists(slug)) {
      slug = `${slug}-${Date.now()}`;
    }

    const priceInCents = price && !isNaN(Number(price)) && Number(price) > 0
      ? Math.round(Number(price) * 100)
      : null;

    const baseInsert = {
      userId: user.id,
      slug,
      title,
      description: description || null,
      price: priceInCents,
      productUrl: productUrl || null,
      imageUrl: imageUrl || null,
      type: type || 'digital',
      isPublished: true,
    };

    try {
      await db.insert(products).values({
        ...baseInsert,
        frontStyle: frontStyle || 'inherit',
        frontStylePrompt: frontStylePrompt || null,
      });
    } catch (error) {
      if (!isMissingFrontStyleColumnsError(error)) {
        throw error;
      }
      await ensureFrontStyleColumns();
      await db.insert(products).values({
        ...baseInsert,
        frontStyle: frontStyle || 'inherit',
        frontStylePrompt: frontStylePrompt || null,
      });
    }

    await revalidateStorePaths(user.id, slug);

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
  frontStyle: z.enum(['inherit', 'pill', 'cta', 'editorial', 'custom']).optional(),
  frontStylePrompt: z.string().max(3000).optional(),
  isPublished: z.enum(['true', 'false']).optional(),
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    const {
      id,
      title,
      description,
      price,
      productUrl,
      imageUrl,
      type,
      frontStyle,
      frontStylePrompt,
      isPublished,
    } = data;

    const existing = await getOwnedProductRecord(id, user.id);

    if (!existing) {
      return { error: 'Product not found.' };
    }

    const priceInCents = price && !isNaN(Number(price)) && Number(price) > 0
      ? Math.round(Number(price) * 100)
      : null;

    const baseUpdate = {
      title,
      description: description || null,
      price: priceInCents,
      productUrl: productUrl || null,
      imageUrl: imageUrl || null,
      type: type || existing.type,
      isPublished:
        isPublished === undefined
          ? existing.isPublished
          : isPublished === 'true',
      updatedAt: new Date(),
    };

    const finalFrontStyle = frontStyle || existing.frontStyle;
    const finalFrontStylePrompt =
      frontStylePrompt === undefined
        ? existing.frontStylePrompt
        : frontStylePrompt || null;

    try {
      await db
        .update(products)
        .set({
          ...baseUpdate,
          frontStyle: finalFrontStyle,
          frontStylePrompt: finalFrontStylePrompt,
        })
        .where(eq(products.id, id));
    } catch (error) {
      if (!isMissingFrontStyleColumnsError(error)) {
        throw error;
      }
      await ensureFrontStyleColumns();
      await db
        .update(products)
        .set({
          ...baseUpdate,
          frontStyle: finalFrontStyle,
          frontStylePrompt: finalFrontStylePrompt,
        })
        .where(eq(products.id, id));
    }

    await revalidateStorePaths(user.id, existing.slug);

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

    const existing = await getOwnedProductRecord(id, user.id);

    if (!existing) {
      return { error: 'Product not found.' };
    }

    await db.delete(products).where(eq(products.id, id));
    await revalidateStorePaths(user.id, existing.slug);

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

    const existing = await getOwnedProductRecord(id, user.id);

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

    await revalidateStorePaths(user.id, existing.slug);

    return { success: isPublished === 'true' ? 'Product published.' : 'Product unpublished.' };
  }
);
