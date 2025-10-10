ALTER TABLE "service_requests" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "delay_reason" text;