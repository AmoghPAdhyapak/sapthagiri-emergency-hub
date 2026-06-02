import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import geminiRouter from "./gemini";
import otpRouter from "./otp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use("/gemini", geminiRouter);
router.use(otpRouter);

export default router;
