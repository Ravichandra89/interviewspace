import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import prisma from "@interviewspace/db";
import profileRoute from "./routes/profile.route";
import sessionRouter from "./routes/session.route";

dotenv.config();

const app = express();
const port = process.env.PORT;

// Middleware Uses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// Define the Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRoute);
app.use("/api/v1/session", sessionRouter);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("🟢 Prisma connected to database");

    app.listen(port, () => {
      console.log(`🚀 Auth service listening on port ${port}`);
    });
  } catch (error) {
    console.error("🔴 Failed to connect to the database", error);
    process.exit(1);
  }
};

// Run the Function
startServer();
