import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import geminiRouter from "./gemini";
import otpRouter from "./otp";
import authRouter from "./auth";
import encountersRouter from "./encounters";
import patientsFolderRouter from "./patientsfolder";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use("/gemini", geminiRouter);
router.use(otpRouter);
router.use("/auth", authRouter);
router.use("/triage", encountersRouter);
router.use("/patients-folder", patientsFolderRouter);

export default router;
