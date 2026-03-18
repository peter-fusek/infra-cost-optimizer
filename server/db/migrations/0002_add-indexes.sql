CREATE INDEX "idx_collection_runs_platform_started" ON "collection_runs" USING btree ("platform_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_cost_records_platform" ON "cost_records" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "idx_cost_records_period" ON "cost_records" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_cost_records_platform_period" ON "cost_records" USING btree ("platform_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_services_platform" ON "services" USING btree ("platform_id");