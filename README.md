# MediServ — SaaS for Medical Equipment Maintenance

### MediServ is a mini SaaS platform for companies that maintain medical equipment. It focuses on devices, service intervals, service requests, and service history, with clear roles: admin, technician, and client.

## ✨ Key Features (MVP, completed)

Authentication & Roles — BetterAuth + Drizzle (Postgres/Neon).

RBAC route guards (admin/technician/client).

Database (Drizzle + Postgres) Tables: user, clients, client_members (user→client), devices, service_records, client_profile (PK=client_id), technician_profile (PK=user_id).

## Admin

- email:admin2@test.com
- pass:test1234
  Admin panel (Shell, shadcn UI).
  Clients CRUD (dialog + validation).
  Users: link/unlink a user to a client (so the client user can see “their” devices).
  Device detail with full service history.

## Technician

- email:test2@test.com
- pass:test1234

Technician panel with tabs: Scheduled / In progress / Delayed / Finished.
Workflow: Start → Delayed → Finish.

Start: in_progress (+ startedAt).
Delay: delayed (+ reason, optional reschedule date).
Finish: creates a service_record, updates device.last/next, request → done (+ finishedAt), redirects to the Finished tab.
Technician device detail: status bar + “Back” to the same tab.

## Client

- email:client@test.com
- pass:test1234

Sees only their own devices (via client_members mapping).
Message “Your account is not linked…” when no client membership exists.

## Global

- /devices: universal devices list

- Admin/Technician: all devices + client filter, search, “Upcoming 30d”
- Client: only their devices
- /profile: profile editing

- Everyone: name (email read-only), role badge
- Client: organization name, address, contact email
- Technician: phone, region
- Navbar: “Home” always routes to the correct dashboard for the user’s role.
