CREATE TABLE "pageviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"page_name" varchar(50) NOT NULL,
	"referrer" text,
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"utm_term" varchar(200),
	"utm_content" varchar(200),
	"country" varchar(100),
	"city" varchar(100),
	"device_type" varchar(20),
	"browser" varchar(50),
	"os" varchar(50),
	"duration" integer,
	"visited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pageviews" ADD CONSTRAINT "pageviews_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;