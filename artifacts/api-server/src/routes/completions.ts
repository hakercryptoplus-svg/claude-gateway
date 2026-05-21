import { Router } from "express";
  import crypto from "crypto";
  import { db } from "@workspace/db";
  import { apiKeysTable } from "@workspace/db";
  import { eq, sql } from "drizzle-orm";
  import { anthropic } from "@workspace/integrations-anthropic-ai";

  const router = Router();

  function hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  // OpenAI-compatible chat completions endpoint
  router.post("/v1/chat/completions", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: { message: "Missing Authorization header", type: "invalid_request_error", code: "missing_api_key" } });
      return;
    }
    const keyHash = hashKey(authHeader.replace("Bearer ", "").trim());
    const [apiKey] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.keyHash, keyHash)).limit(1);
    if (!apiKey?.isActive) {
      res.status(401).json({ error: { message: "Invalid or inactive API key", type: "authentication_error", code: "invalid_api_key" } });
      return;
    }
    const { messages, model, max_tokens } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: { message: "messages must be an array", type: "invalid_request_error" } });
      return;
    }
    const systemMessage = messages.find((m: { role: string }) => m.role === "system");
    const anthropicMessages = messages.filter((m: { role: string }) => m.role !== "system");
    try {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-7",
        max_tokens: max_tokens ?? 8192,
        ...(systemMessage ? { system: systemMessage.content } : {}),
        messages: anthropicMessages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant", content: m.content,
        })),
      });
      await db.update(apiKeysTable).set({
        requestCount: sql`${apiKeysTable.requestCount} + 1`,
        lastUsedAt: new Date(),
      }).where(eq(apiKeysTable.id, apiKey.id));
      const text = response.content.filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; text: string }).text).join("");
      res.json({
        id: `chatcmpl-${crypto.randomBytes(12).toString("hex")}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model ?? "claude-opus-4-7",
        choices: [{ index: 0, message: { role: "assistant", content: text }, logprobs: null, finish_reason: response.stop_reason === "end_turn" ? "stop" : response.stop_reason }],
        usage: { prompt_tokens: response.usage.input_tokens, completion_tokens: response.usage.output_tokens, total_tokens: response.usage.input_tokens + response.usage.output_tokens },
        system_fingerprint: `fp_cgw_${(response.id ?? "").slice(-8)}`,
      });
    } catch (err: unknown) {
      req.log.error({ err }, "Anthropic API call failed");
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: { message: `Claude API error: ${message}`, type: "api_error", code: "internal_error" } });
    }
  });

  export default router;
  