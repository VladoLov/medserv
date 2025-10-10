ALTER TABLE "service_requests" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;