ALTER TABLE "profiles" ADD COLUMN "product_columns" smallint DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "card_template" varchar(20) DEFAULT 'standard' NOT NULL;