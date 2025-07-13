import connectKafka, { consumer, producer } from "../config/kafka";
import { runCodeInDocker } from "../executor/DockerExecutor";
import { v4 as uuidv4 } from "uuid";
import prisma from "@interviewspace/db";

// HandleCodeSubmission
const handleCodeSubmission = async () => {
  await connectKafka();

  // Subscribe to the code-submissions topic
  await consumer.subscribe({
    topic: "code-submissions",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = JSON.parse(message.value!.toString());
      const { sessionId, userId, language, code } = payload;
      const correlationId = uuidv4();

      console.log("Received submission: ", correlationId, payload);
      try {
        const result = await runCodeInDocker(language, code, correlationId);

        // Save the ExecutionResult to ExecutionHistory - TODO: Updated
        await prisma.executionHistory.create({
          data: {
            sessionId,
            userId,
            language,
            code,
            output: result.stdout,
            error: result.stderr || null,
            status: result.exitCode === 0 ? "success" : "error",
          },
        });

        // Send the ExecutionResult to the results topic
        await producer.send({
          topic: "execution-results",
          messages: [
            {
              key: sessionId,
              value: JSON.stringify({
                correlationId,
                userId,
                sessionId,
                ...result,
              }),
            },
          ],
        });

        console.log("Execution result sent: ", correlationId);
      } catch (error) {
        console.error("Error processing submission:", error);
        await producer.send({
          topic: "execution-results",
          messages: [
            {
              key: correlationId,
              value: JSON.stringify({
                correlationId,
                userId,
                sessionId,
                error,
              }),
            },
          ],
        });
      }
    },
  });
};

export default handleCodeSubmission;
