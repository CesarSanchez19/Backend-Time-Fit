import { Router } from "express";
import { registerColaborator, loginColaborator } from "../controllers/colaborator.controller.js";

const router = Router();

router.post("/register", registerColaborator);
router.post("/login", loginColaborator);

export default router;
