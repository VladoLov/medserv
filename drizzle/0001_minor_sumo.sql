-- 1) Drop postojeće FK-ove da bismo mogli mijenjati tipove kolona
ALTER TABLE "client_members" DROP CONSTRAINT IF EXISTS "client_members_client_id_clients_id_fk";
ALTER TABLE "client_members" DROP CONSTRAINT IF EXISTS "client_members_user_id_user_id_fk";
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_user_id_user_id_fk";
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_client_id_clients_id_fk";
ALTER TABLE "service_records" DROP CONSTRAINT IF EXISTS "service_records_device_id_devices_id_fk";
ALTER TABLE "service_records" DROP CONSTRAINT IF EXISTS "service_records_technician_id_user_id_fk";
ALTER TABLE "technician_profile" DROP CONSTRAINT IF EXISTS "technician_profile_user_id_user_id_fk";

-- 2) Svi ID-jevi i FK-jevi na TEXT (dosljedno sa cuid/uuid stringovima)
ALTER TABLE "client_members" ALTER COLUMN "client_id" SET DATA TYPE text;
ALTER TABLE "client_members" ALTER COLUMN "user_id"   SET DATA TYPE text;
ALTER TABLE "clients"        ALTER COLUMN "id"        SET DATA TYPE text;
ALTER TABLE "devices"        ALTER COLUMN "id"        SET DATA TYPE text;
ALTER TABLE "devices"        ALTER COLUMN "client_id" SET DATA TYPE text;
ALTER TABLE "service_records" ALTER COLUMN "id"         SET DATA TYPE text;
ALTER TABLE "service_records" ALTER COLUMN "device_id"  SET DATA TYPE text;
ALTER TABLE "service_records" ALTER COLUMN "technician_id" SET DATA TYPE text;
ALTER TABLE "technician_profile" ALTER COLUMN "user_id" SET DATA TYPE text;

-- 3) client_profile: uvodi se novi PK/FK na clients (client_id),
--    pa pravimo novu kolonu; (PK ćeš imati već u Drizzle shemi)
ALTER TABLE "client_profile" ADD COLUMN "client_id" text;

-- 4) (opcionalno, ali korisno) dodati contact_email kolonu na clients ako je koristiš u šemi
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "contact_email" varchar(150);

-- 5) Vrati FK-ove s pravilnim onDelete pravilima
ALTER TABLE "client_members" ADD CONSTRAINT "client_members_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;

ALTER TABLE "client_members" ADD CONSTRAINT "client_members_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;

ALTER TABLE "devices" ADD CONSTRAINT "devices_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;

ALTER TABLE "service_records" ADD CONSTRAINT "service_records_device_id_devices_id_fk"
  FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;

-- Ako želiš SET NULL na technician delete, kolona mora biti NULLABLE
-- (promijeni u šemi: technicianId: text("technician_id").references(...).nullable())
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_technician_id_user_id_fk"
  FOREIGN KEY ("technician_id") REFERENCES "public"."user"("id") ON DELETE SET NULL;

ALTER TABLE "technician_profile" ADD CONSTRAINT "technician_profile_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;

-- 6) client_profile: migracija sa user_id -> client_id (ako imaš mapu u client_members)
UPDATE "client_profile" cp
SET "client_id" = cm."client_id"
FROM "client_members" cm
WHERE cm."user_id" = cp."user_id" AND cp."client_id" IS NULL;

-- 7) Enforce NOT NULL i PK na client_id
ALTER TABLE "client_profile" ALTER COLUMN "client_id" SET NOT NULL;

-- skini stari PK, postavi novi (ime constrainta može varirati)
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_pkey";
ALTER TABLE "client_profile" ADD PRIMARY KEY ("client_id");

-- 8) Drop stari FK i kolonu user_id
ALTER TABLE "client_profile" DROP COLUMN IF EXISTS "user_id";
