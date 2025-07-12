import { Kafka } from "kafkajs";

// Kafka configuration
export const kafka = new Kafka({
  clientId: "code-exec-service",
  brokers: ["localhost:9092"],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "execution-service-group",
});

// ConnectKafka
const connectKafka = async () => {
  await producer.connect();
  console.log("Kafka Producer connected");

  // Connecting Consumer
  await consumer.connect();
  console.log("Kafka Consumer connected");
};

export default connectKafka;
