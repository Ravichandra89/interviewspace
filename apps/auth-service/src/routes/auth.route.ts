import { Router } from "express";
import {
  SignIn,
  Signup,
  forgotPassword,
  resetPassword,
} from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/signup", Signup);
authRouter.post("/signin", SignIn);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
