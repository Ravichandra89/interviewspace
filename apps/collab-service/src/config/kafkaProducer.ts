import { previousDay } from "date-fns";
import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
  clientId: "collab-service",
  brokers: [process.env.KAFKA_BROKER!],
});

const producer = kafka.producer();
export const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "collab-service-group",
});

export const startProducer = async () => {
  await producer.connect();
  console.log(`Kafka Producer connected`);
};

// Submit Code to Execution Service Event

export const sendCodeSubmission = async (
  sessionId: string,
  userId: string,
  language: string,
  code: string
) => {
  try {
    await producer.send({
      topic: "code-submissions",
      messages: [
        {
          key: sessionId,
          value: JSON.stringify({ sessionId, userId, language, code }),
        },
      ],
    });

    console.log("Sent code submission to Kafka");
  } catch (error) {
    console.error("[Collab Service] Kafka Send error", error);
  }
};
