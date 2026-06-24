import { Router, type IRouter } from "express";
import healthRouter from "./health";
import riskRouter from "./risk";
import representativesRouter from "./representatives";
import schoolsRouter from "./schools";
import hotspotsRouter from "./hotspots";
import testResultsRouter from "./test-results";

const router: IRouter = Router();

router.use(healthRouter);
router.use(riskRouter);
router.use(representativesRouter);
router.use(schoolsRouter);
router.use(hotspotsRouter);
router.use(testResultsRouter);

export default router;
