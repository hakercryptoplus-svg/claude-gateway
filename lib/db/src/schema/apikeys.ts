import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod/v4";

  export const apiKeysTable = pgTable("api_keys", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    requestCount: integer("request_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  });

  export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({
    id: true,
    requestCount: true,
    createdAt: true,
    lastUsedAt: true,
  });

  export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
  export type ApiKey = typeof apiKeysTable.$inferSelect;
  