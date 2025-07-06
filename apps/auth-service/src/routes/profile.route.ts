import { Router } from "express";
import { getProfile, upsertProfile } from "../controller/profile.controller";
import validateToken from "../middleware/validateToken";

const profileRoute = Router();

profileRoute.get("/", validateToken, getProfile);
profileRoute.post("/", validateToken, upsertProfile);

export default profileRoute;
