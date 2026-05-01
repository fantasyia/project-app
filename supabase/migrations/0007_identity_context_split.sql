CREATE TABLE IF NOT EXISTS "subscriber_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(150),
	"handle" varchar(50),
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "subscriber_profiles" ADD CONSTRAINT "subscriber_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "public_display_name" varchar(150);
--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "public_handle" varchar(50);
--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "public_bio" text;
--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "public_avatar_url" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_creator_profiles_public_handle" ON "creator_profiles" USING btree ("public_handle");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriber_profiles_user_id" ON "subscriber_profiles" USING btree ("user_id");
--> statement-breakpoint

INSERT INTO "subscriber_profiles" ("user_id", "display_name", "handle", "bio", "avatar_url")
SELECT "id", "display_name", "handle", "bio", "avatar_url"
FROM "users"
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint

UPDATE "creator_profiles" AS cp
SET
	"public_display_name" = COALESCE(cp."public_display_name", u."display_name"),
	"public_handle" = COALESCE(cp."public_handle", u."handle"),
	"public_bio" = COALESCE(cp."public_bio", u."bio"),
	"public_avatar_url" = COALESCE(cp."public_avatar_url", u."avatar_url")
FROM "users" AS u
WHERE cp."user_id" = u."id";
