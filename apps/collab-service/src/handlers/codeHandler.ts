import WebSocket from "ws";

// Handles the code Events
const HandleCode = async (
  ctx: { userId: string; sessionId: string; ws: WebSocket },
  message: WebSocket.Data,
  peers: Set<WebSocket>
) => {
  try {
    // payload for broadcasting data
    const payload = JSON.stringify({
      event: `code.edit`,
      data: {
        userId: ctx.userId,
        code: message.toString(),
      },
    });

    // Sending to all WebSocket Open Connections
    peers.forEach((peer) => {
      if (peer !== ctx.ws && peer.readyState === WebSocket.OPEN) {
        peer.send(payload);
      }
    });
  } catch (error) {
    console.error(`Broadcast code error`, error);
    try {
      ctx.ws.send(
        JSON.stringify({ event: "error", message: "Broadcast failed" })
      );
    } catch {}
  }
};

export default HandleCode;
