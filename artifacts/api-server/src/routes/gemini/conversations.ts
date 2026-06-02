import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversations as conversationsTable,
  messages as messagesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const SYSTEM_INSTRUCTION =
  "You are a helpful, reassuring assistant for an emergency room triage dashboard. " +
  "Provide concise, clear guidance to support emergency room staff and patients. " +
  "You are NOT a doctor and cannot give diagnoses or prescriptions. " +
  "If symptoms sound severe or life-threatening, always advise the user to notify medical staff immediately. " +
  "Keep responses brief and actionable — staff are busy.";

router.get("/", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(conversationsTable.createdAt);
    res.json(conversations);
  } catch (err) {
    req.log.error(err, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    req.log.error(err, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);
    res.json({ ...conversation, messages });
  } catch (err) {
    req.log.error(err, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
    await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);
    res.json(messages);
  } catch (err) {
    req.log.error(err, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/:id/messages", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const { content } = req.body || {};
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content,
    });

    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages = [
      { role: "user" as const, parts: [{ text: SYSTEM_INSTRUCTION }] },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      })),
    ];

    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "AI chat stream failed");
    res.write(
      `data: ${JSON.stringify({ error: "AI assistant is currently unavailable. Please speak to onsite medical staff." })}\n\n`,
    );
    res.end();
  }
});

export default router;
