ALTER TABLE "products" ADD COLUMN "slug" varchar(200);--> statement-breakpoint
UPDATE "products" SET "slug" = LOWER(REPLACE(REPLACE(title, ' ', '-'), '--', '-')) || '-' || id WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");
