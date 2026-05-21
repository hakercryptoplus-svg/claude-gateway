import { Router } from "express";
  import crypto from "crypto";
  import { db } from "@workspace/db";
  import { apiKeysTable } from "@workspace/db";
  import { eq, sql } from "drizzle-orm";
  import { CreateApiKeyBody, DeleteApiKeyParams } from "@workspace/api-zod";

  const router = Router();

  function generateApiKey(): string {
    return `sk-cgw-${crypto.randomBytes(32).toString("hex")}`;
  }

  function hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  router.get("/apikeys", async (req, res) => {
    try {
      const keys = await db.select().from(apiKeysTable).orderBy(apiKeysTable.createdAt);
      res.json(keys.map((k) => ({
        id: k.id, name: k.name, keyPrefix: k.keyPrefix,
        createdAt: k.createdAt.toISOString(), requestCount: k.requestCount,
        isActive: k.isActive, lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      })));
    } catch (err) {
      req.log.error({ err }, "Failed to list API keys");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/apikeys", async (req, res) => {
    const parsed = CreateApiKeyBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
    const { name } = parsed.data;
    try {
      const fullKey = generateApiKey();
      const keyHash = hashKey(fullKey);
      const keyPrefix = fullKey.substring(0, 12) + "...";
      const [created] = await db.insert(apiKeysTable)
        .values({ name, keyHash, keyPrefix, isActive: true }).returning();
      res.status(201).json({
        id: created.id, name: created.name, keyPrefix: created.keyPrefix,
        createdAt: created.createdAt.toISOString(), requestCount: created.requestCount,
        isActive: created.isActive, lastUsedAt: null, fullKey,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to create API key");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/apikeys/:id", async (req, res) => {
    const parsed = DeleteApiKeyParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
    try {
      const deleted = await db.delete(apiKeysTable)
        .where(eq(apiKeysTable.id, parsed.data.id)).returning();
      if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
      res.json({ success: true });
    } catch (err) {
      req.log.error({ err }, "Failed to delete API key");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/apikeys/stats", async (req, res) => {
    try {
      const [stats] = await db.select({
        totalKeys: sql<number>`cast(count(*) as int)`,
        activeKeys: sql<number>`cast(sum(case when ${apiKeysTable.isActive} then 1 else 0 end) as int)`,
        totalRequests: sql<number>`cast(sum(${apiKeysTable.requestCount}) as int)`,
      }).from(apiKeysTable);
      res.json({ totalKeys: stats?.totalKeys ?? 0, activeKeys: stats?.activeKeys ?? 0, totalRequests: stats?.totalRequests ?? 0 });
    } catch (err) {
      req.log.error({ err }, "Failed to get stats");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  export default router;
  