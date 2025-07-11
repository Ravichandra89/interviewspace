// WebSocket Server Setup
import WebSocket, { WebSocketServer } from "ws";
import validateInviteToken from "../auth/TokenValidation";
import HandleCode from "../handlers/codeHandler";
import broadcastPresence from "../handlers/presenceHandler";

export default (server: WebSocketServer) => {
  const sessions = new Map<string, Set<WebSocket>>();

  server.on("connection", async (ws: WebSocket, req) => {
    let payload;
    try {
      // Extract token from Url
      const token = new URLSearchParams(req.url?.split("?")[1]).get("token")!;

      payload = await validateInviteToken(token);
    } catch (error) {
      console.error("WS auth failed", error);
      return ws.close();
    }

    const { sessionId, role, userId } = payload;
    const peers = sessions.get(sessionId) || new Set<WebSocket>();
    peers.add(ws);
    sessions.set(sessionId, peers);

    (ws as any).ctx = { sessionId, role, userId, ws };
    broadcastPresence(peers);
    console.log(`User ${userId} joined session ${sessionId}`);

    ws.on("message", (msg) => HandleCode((ws as any).ctx, msg, peers));
    ws.on("close", () => {
      peers.delete(ws);
      if (peers.size === 0) sessions.delete(sessionId);
      else broadcastPresence(peers);
      console.log(`User ${userId} left session ${sessionId}`);
    });
  });
};
