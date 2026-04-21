import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, profiles, products } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

type LegacyProductRow = {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  product_url: string | null;
  image_url: string | null;
  type: string;
  front_style: string | null;
  front_style_prompt: string | null;
  card_template: string | null;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type LegacyProfileRow = {
  id: number;
  user_id: number;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
  border_radius: string | null;
  button_border_radius: string | null;
  product_columns: number | null;
  card_template: string | null;
  social_links: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

function isMissingColumnError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('front_style') ||
    message.includes('front style') ||
    message.includes('front_style_prompt') ||
    message.includes('front style prompt') ||
    message.includes('card_template') ||
    message.includes('card template')
  );
}

function isMissingProfileColumnError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('product_columns') ||
    message.includes('product columns') ||
    message.includes('card_template') ||
    message.includes('card template') ||
    message.includes('button_border_radius') ||
    message.includes('button border radius') ||
    message.includes('social_links') ||
    message.includes('social links')
  );
}

async function ensureProductColumns() {
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style varchar(20) NOT NULL DEFAULT 'inherit'
  `);
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style_prompt text
  `);
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS card_template varchar(20)
  `);
}

async function ensureProfileColumns() {
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS theme varchar(30) NOT NULL DEFAULT 'default'
  `);
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS border_radius varchar(10) NOT NULL DEFAULT 'md'
  `);
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS button_border_radius varchar(10) NOT NULL DEFAULT 'md'
  `);
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS product_columns smallint NOT NULL DEFAULT 3
  `);
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS card_template varchar(20) NOT NULL DEFAULT 'standard'
  `);
  await db.execute(sql`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS social_links jsonb
  `);
}

function normalizeDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

function mapLegacyProduct(row: LegacyProductRow) {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    productUrl: row.product_url,
    imageUrl: row.image_url,
    type: row.type,
    frontStyle: row.front_style || 'inherit',
    frontStylePrompt: row.front_style_prompt || null,
    cardTemplate: row.card_template || null,
    isPublished: row.is_published,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}

function mapLegacyProfile(row: LegacyProfileRow) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    theme: row.theme || 'default',
    borderRadius: row.border_radius || 'md',
    buttonBorderRadius: row.button_border_radius || 'md',
    productColumns: row.product_columns || 3,
    cardTemplate: row.card_template || 'standard',
    socialLinks:
      row.social_links && typeof row.social_links === 'object'
        ? row.social_links
        : null,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getProfileByUserId(userId: number) {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    if (!isMissingProfileColumnError(error)) {
      throw error;
    }

    await ensureProfileColumns();
    const rows = await db.execute<LegacyProfileRow>(sql`
      SELECT
        id,
        user_id,
        username,
        display_name,
        headline,
        bio,
        avatar_url,
        theme,
        border_radius,
        button_border_radius,
        product_columns,
        card_template,
        social_links,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    return rows.length > 0 ? mapLegacyProfile(rows[0]) : null;
  }
}

export async function getProfileByUsername(username: string) {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    if (!isMissingProfileColumnError(error)) {
      throw error;
    }

    await ensureProfileColumns();
    const rows = await db.execute<LegacyProfileRow>(sql`
      SELECT
        id,
        user_id,
        username,
        display_name,
        headline,
        bio,
        avatar_url,
        theme,
        border_radius,
        button_border_radius,
        product_columns,
        card_template,
        social_links,
        created_at,
        updated_at
      FROM profiles
      WHERE username = ${username}
      LIMIT 1
    `);

    return rows.length > 0 ? mapLegacyProfile(rows[0]) : null;
  }
}

export async function getPublicStoreData(username: string) {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  let userProducts;
  try {
    userProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.userId, profile.userId), eq(products.isPublished, true)))
      .orderBy(desc(products.createdAt));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    await ensureProductColumns();
    const rows = await db.execute<LegacyProductRow>(sql`
      SELECT
        id,
        user_id,
        slug,
        title,
        description,
        price,
        product_url,
        image_url,
        type,
        front_style,
        front_style_prompt,
        card_template,
        is_published,
        created_at,
        updated_at
      FROM products
      WHERE user_id = ${profile.userId} AND is_published = true
      ORDER BY created_at DESC
    `);
    userProducts = rows.map(mapLegacyProduct);
  }

  return { profile, products: userProducts };
}

export async function getProductsByUserId(userId: number) {
  try {
    return await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    await ensureProductColumns();
    const rows = await db.execute<LegacyProductRow>(sql`
      SELECT
        id,
        user_id,
        slug,
        title,
        description,
        price,
        product_url,
        image_url,
        type,
        front_style,
        front_style_prompt,
        card_template,
        is_published,
        created_at,
        updated_at
      FROM products
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    return rows.map(mapLegacyProduct);
  }
}

export async function getProductById(productId: number) {
  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    await ensureProductColumns();
    const rows = await db.execute<LegacyProductRow>(sql`
      SELECT
        id,
        user_id,
        slug,
        title,
        description,
        price,
        product_url,
        image_url,
        type,
        front_style,
        front_style_prompt,
        card_template,
        is_published,
        created_at,
        updated_at
      FROM products
      WHERE id = ${productId}
      LIMIT 1
    `);

    return rows.length > 0 ? mapLegacyProduct(rows[0]) : null;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const rows = await db.execute<LegacyProductRow>(sql`
      SELECT
        id,
        user_id,
        slug,
        title,
        description,
        price,
        product_url,
        image_url,
        type,
        is_published,
        created_at,
        updated_at
      FROM products
      WHERE slug = ${slug}
      LIMIT 1
    `);

    return rows.length > 0 ? mapLegacyProduct(rows[0]) : null;
  }
}
