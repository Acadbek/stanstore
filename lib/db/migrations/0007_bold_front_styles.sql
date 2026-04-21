ALTER TABLE "products" ADD COLUMN "front_style" varchar(20) DEFAULT 'inherit' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "front_style_prompt" text;
