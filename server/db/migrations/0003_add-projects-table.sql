CREATE TYPE "public"."project_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"repo_url" varchar(500),
	"production_url" varchar(500),
	"tech_stack" jsonb,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"monthly_budget" numeric(10, 2),
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "idx_alerts_type_created" ON "alerts" USING btree ("alert_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_alerts_active_created" ON "alerts" USING btree ("is_active","created_at");