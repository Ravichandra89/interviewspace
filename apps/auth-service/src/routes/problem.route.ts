import { Router } from "express";
import createProblem from "../controller/problem.controller";
import validateToken from "../middleware/validateToken";

const problemRouter = Router();

problemRouter.post("/session/:sessionId/create", validateToken, createProblem);

export default problemRouter;
