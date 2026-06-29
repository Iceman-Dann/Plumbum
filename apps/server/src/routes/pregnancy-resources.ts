import { Router, Request, Response } from "express";
import { getPregnancyResourcesForState } from "../lib/pregnancyResources.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const state = req.query.state as string;
  if (!state) {
    return res.status(400).json({ error: "State parameter is required" });
  }

  const resources = getPregnancyResourcesForState(state);
  res.json(resources);
  return;
});

export default router;
