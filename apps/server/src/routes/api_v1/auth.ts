import type { Request, Response, NextFunction } from "express";
import { getDb, apiKeysTable } from "@workspace/db";
import { eq } from "@workspace/db";

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid API key. Expected 'Bearer <key>'" });
    return;
  }

  const key = authHeader.split(" ")[1];
  try {
    const db = getDb();
    const result = await db.select().from(apiKeysTable).where(eq(apiKeysTable.key, key));
    
    if (result.length === 0) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }
    
    // valid key
    next();
  } catch (err) {
    req.log.error({ err }, "API Key validation failed");
    res.status(500).json({ error: "Internal server error during authentication" });
  }
}
