import { Router } from "express";
import createProblem, {
  listProblems,
  getProblem,
  updateProblem,
  deleteProblem,
} from "../controller/problem.controller";
import validateToken from "../middleware/validateToken";

const problemRouter = Router();

problemRouter.post("/session/:sessionId/create", validateToken, createProblem);

// Route to list all problems
problemRouter.get("/problems", validateToken, listProblems);

// Route to get a specific problem by ID
problemRouter.get("/problem/:id", validateToken, getProblem);

// Route to update a specific problem by ID
problemRouter.put("/problem/:id", validateToken, updateProblem);

// Route to delete a specific problem by Id
problemRouter.delete("/problem/:id", validateToken, deleteProblem);

export default problemRouter;
