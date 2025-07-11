import { Router } from "express";
import validateToken from "../middleware/validateToken";
import {
  CreateSession,
  getSessionById,
  listInterviewerSessions,
} from "../controller/session.controller";

const sessionRouter = Router();

sessionRouter.post("/", validateToken, CreateSession);
sessionRouter.get("/", validateToken, listInterviewerSessions);
sessionRouter.get("/:id", validateToken, getSessionById);

export default sessionRouter;