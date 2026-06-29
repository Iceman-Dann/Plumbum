import { Router, type IRouter } from "express";
import healthRouter from "./health";
import riskRouter from "./risk";
import representativesRouter from "./representatives";
import schoolsRouter from "./schools";
import hotspotsRouter from "./hotspots";
import testResultsRouter from "./test-results";
import realEstateRouter from "./real-estate";
import subscribeRouter from "./subscribe";
import accountabilityRouter from "./accountability";
import pregnancyResourcesRouter from "./pregnancy-resources";
import neighborhoodRouter from "./neighborhood.js";
import apiV1Router from "./api_v1/index.js";
import ccrRouter from "./ccr.js";
import subsidyRouter from "./subsidy.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(riskRouter);
router.use(representativesRouter);
router.use(schoolsRouter);
router.use(hotspotsRouter);
router.use(testResultsRouter);
router.use(realEstateRouter);
router.use(subscribeRouter);
router.use(accountabilityRouter);
router.use(neighborhoodRouter);
router.use(ccrRouter);
router.use(subsidyRouter);
router.use("/pregnancy-resources", pregnancyResourcesRouter);
router.use("/v1", apiV1Router);

router.get("/config/places-key", (req, res) => {
  res.json({ key: process.env.GOOGLE_PLACES_API_KEY || "" });
});

export default router;
