import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
    clientId: "auth-service",
    brokers: [process.env.KAFKA_BROKERS]
});

const kafkaProducer : Producer = kafka.producer();

// IIFE Function
(async () => {
    try {
        // Connect the kafkaProducer
        await kafkaProducer.connect();
        console.log("🟢 Kafka producer connected");
    } catch (error) {
        console.error("🔴 Kafka producer failed to connect", error);
    }
})();

export default kafkaProducer;