import { Router } from "express";
import rateLimit from "express-rate-limit";
import keysRouter from "./keys.js";
import riskRouter from "./risk.js";
import tractsRouter from "./tracts.js";
import hotspotsRouter from "./hotspots.js";
import schoolsRouter from "./schools.js";
import violationsRouter from "./violations.js";

const router = Router();

// Apply rate limiting to all public API routes: 100 requests per hour per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per `window` (here, per hour)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests from this IP, please try again after an hour" },
});

router.use(apiLimiter);

router.use("/keys", keysRouter);
router.use("/risk", riskRouter);
router.use("/tract", tractsRouter);
router.use("/hotspots", hotspotsRouter);
router.use("/schools", schoolsRouter);
router.use("/data/violations", violationsRouter);

export default router;
