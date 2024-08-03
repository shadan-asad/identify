import express from "express";
import { identifyController } from "../controllers/identifyController";
import { validateIdentifyInput } from "../middlewares/validateIdentifyInput";

const router = express.Router();

router.post("/identify", validateIdentifyInput, identifyController);

export default router;
