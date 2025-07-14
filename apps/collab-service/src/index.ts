import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import gateway from "./gateway/websocket";
import { startProducer, sendCodeSubmission } from "./config/kafkaProducer";
import cors from "cors";

import startConsumer from "./config/kafkaConsumer";

dotenv.config();

// Initializing the kafka Producer
startProducer();

// Express app
const app = express();

app.use(express.json());
app.use(cors());

app.post("/submit-code", async (req: Request, res: Response) => {
  const { sessionId, userId, language, code } = req.body;

  if (!sessionId || !userId || !language || !code) {
    return res.status(400).json({
      error: "Missing Fields",
    });
  }

  await sendCodeSubmission(sessionId, userId, language, code);
  return res.json({
    status: "queued",
  });
});

const http = app.listen(process.env.PORT || 5000, () =>
  console.log(`CollabService :: Listening on port: ${process.env.PORT || 5000}`)
);

// WebSocket Server
const wss = new WebSocketServer({
  server: http,
});
gateway(wss);

// Starting the kafka consumer
startConsumer(wss);

console.log("CollabService Initialized");
