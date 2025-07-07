import { Router } from "express";
import validateToken from "../middleware/validateToken";
import {
  CreateSession,
  getSessionById,
  listInterviewerSessions,
} from "../controller/session.controller";

const router = Router();

router.post("/", validateToken, CreateSession);
router.get("/", validateToken, listInterviewerSessions);
router.get("/:id", validateToken, getSessionById);

export default router;