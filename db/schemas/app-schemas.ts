import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema"; // BetterAuth user

/** ORGANIZACIJA / BOLNICA */
export const clients = pgTable("clients", {
  id: text("id").primaryKey(), // cuid/uuid kao string
  name: varchar("name", { length: 150 }).notNull(),
  address: varchar("address", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/** PROFIL ORGANIZACIJE (ako želiš dodatna polja za bolnicu) */
export const clientProfile = pgTable("client_profile", {
  clientId: text("client_id")
    .primaryKey()
    .references(() => clients.id, { onDelete: "cascade" }),
  organizationName: varchar("organization_name", { length: 200 }),
  address: varchar("address", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/** PROFIL TEHNIČARA (atributi za user-a koji je tehničar) */
export const technicianProfile = pgTable("technician_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: varchar("phone", { length: 50 }),
  region: varchar("region", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/** PIVOT: članovi klijenta (više korisnika u jednoj bolnici) */
export const clientMembers = pgTable(
  "client_members",
  {
    clientId: text("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    roleInClient: varchar("role_in_client", { length: 50 }).default("member"),
  },
  (t) => ({
    pk: primaryKey({
      name: "client_members_pk",
      columns: [t.clientId, t.userId],
    }),
  })
);

/** UREĐAJI */
export const devices = pgTable("devices", {
  id: text("id").primaryKey(), // cuid
  clientId: text("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  installDate: date("install_date"),
  lastServiceDate: date("last_service_date"),
  nextServiceDate: date("next_service_date"),
  serviceIntervalMonths: integer("service_interval_months")
    .default(6)
    .notNull(),
  majorServiceYears: integer("major_service_years").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/** SERVISNA ISTORIJA */
export const serviceRecords = pgTable("service_records", {
  id: text("id").primaryKey(), // cuid
  deviceId: text("device_id")
    .references(() => devices.id, { onDelete: "cascade" })
    .notNull(),
  technicianId: text("technician_id")
    .references(() => user.id, { onDelete: "set null" }) // ili cascade; set null je često smisleno
    .notNull(),
  serviceDate: date("service_date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "redovni" | "vanredni" | "major"
  notes: text("notes"),
  nextServiceDate: date("next_service_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey(),
  deviceId: text("device_id")
    .references(() => devices.id, { onDelete: "cascade" })
    .notNull(),
  requestedBy: text("requested_by")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "redovni" | "vanredni" | "major"
  description: text("description"),
  preferredDate: date("preferred_date"),
  status: varchar("status", { length: 20 }).default("open").notNull(), // open | scheduled | done | cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  assignedTo: text("assigned_to").references(() => user.id, {
    onDelete: "set null",
  }),
  scheduledAt: timestamp("scheduled_at"),

  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  delayReason: text("delay_reason"),
}); */
export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey(),
  deviceId: text("device_id")
    .references(() => devices.id, { onDelete: "cascade" })
    .notNull(),
  requestedBy: text("requested_by")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 20 })
    .notNull()
    .$type<"redovni" | "vanredni" | "major">()
    .default("redovni"),
  description: text("description"),
  preferredDate: date("preferred_date"),
  status: varchar("status", { length: 32 })
    .notNull()
    .$type<"scheduled" | "in_progress" | "delayed" | "done" | "cancelled">()
    .default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedTo: text("assigned_to").references(() => user.id), // technician
  scheduledAt: timestamp("scheduled_at"), // datum kada je planirano
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  delayReason: text("delay_reason"),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// optional: email queue (if you want to send via cron in batches)
export const emailQueue = pgTable("email_queue", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one }) => ({
    device: one(devices, {
      fields: [serviceRequests.deviceId],
      references: [devices.id],
    }),
    requester: one(user, {
      fields: [serviceRequests.requestedBy],
      references: [user.id],
    }),
  })
);

/** RELATIONS (opciono) */
export const clientProfileRelations = relations(clientProfile, ({ one }) => ({
  client: one(clients, {
    fields: [clientProfile.clientId],
    references: [clients.id],
  }),
}));

export const technicianProfileRelations = relations(
  technicianProfile,
  ({ one }) => ({
    base: one(user, {
      fields: [technicianProfile.userId],
      references: [user.id],
    }),
  })
);

export const devicesRelations = relations(devices, ({ one }) => ({
  client: one(clients, {
    fields: [devices.clientId],
    references: [clients.id],
  }),
}));
