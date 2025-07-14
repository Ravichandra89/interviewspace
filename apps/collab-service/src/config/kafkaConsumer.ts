import { consumer } from "./kafkaProducer";
import WebSocket, { WebSocketServer } from "ws";
import prisma from "@interviewspace/db";

// StartConsumer
const startConsumer = async (wss: WebSocketServer) => {
  // subscribe to the topic
  await consumer.subscribe({
    topic: "execution-results",
    fromBeginning: false,
  });

  // Run the consumer
  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value!.toString();
      let payload: any;

      try {
        payload = JSON.parse(raw);
      } catch (error) {
        console.error("Error parsing message:", raw, error);
        return;
      }

      // Extract the data from the payload
      const { sessionId, userId, problemId, results } = payload;

      if (!sessionId || !userId || !problemId || !results) {
        console.error("Invalid payload:", payload);
        return;
      }

      // Fetch the problem and add points based on the results
      try {
        const problem = await prisma.problem.findUnique({
          where: {
            id: problemId,
          },
          include: {
            testCases: true,
          },
        });

        if (!problem) {
          console.error("Problem not found:", problemId);
          return;
        }

        const totalCase = problem.testCases.length;
        const passedCount = results.filter(
          (result: any) => result.status === "success"
        ).length;
        const perCase = problem.points / totalCase;
        const earnedPoints = Math.round(passedCount * perCase);

        // 2) Optionally persist in a history table or update a SessionProblem join record
        // await prisma.sessionProblem.update({ ... })
        await prisma.executionHistory.create({
          data: {
            sessionId,
            userId,
            problemId,
            points: earnedPoints,
            status: "completed",
          },
        });

        // Prepare the message to send to WebSocket clients
        const message = JSON.stringify({
          type: "score.update",
          sessionId,
          userId,
          problemId,
          earnedPoints,
          totalPoints: problem.points,
          passedCount,
          totalCase,
        });

        // Broadcast the message to all connected webSocket clients (Interviewer and candidate)
        wss.clients.forEach((client) => {
          const ctx = (client as any).ctx;
          if (
            client.readyState === WebSocket.OPEN &&
            ctx?.sessionId === sessionId
          ) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error("Error fetching problem or updating points:", error);
      }
    },
  });

  console.log("Kafka consumer started for execution results");
};

export default startConsumer;
