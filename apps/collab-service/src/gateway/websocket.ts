// WebSocket Server Setup
import WebSocket, { WebSocketServer } from "ws";
import validateInviteToken from "../auth/tokenValidation";
import HandleCode from "../handlers/codeHandler";
import broadcastPresence from "../handlers/presenceHandler";

// Import the Video Handlers
import {
  handleVideoOffer,
  handleVideoAnswer,
  handleICECandidate,
} from "../handlers/videoHandler";

// export default (server: WebSocketServer) => {
//   const sessions = new Map<string, Set<WebSocket>>();

//   server.on("connection", async (ws: WebSocket, req) => {
//     let payload;
//     try {
//       // Extract token from Url
//       const token = new URLSearchParams(req.url?.split("?")[1]).get("token")!;

//       payload = await validateInviteToken(token);
//     } catch (error) {
//       console.error("WS auth failed", error);
//       return ws.close();
//     }

//     const { sessionId, role, userId } = payload;
//     const peers = sessions.get(sessionId) || new Set<WebSocket>();
//     peers.add(ws);
//     sessions.set(sessionId, peers);

//     (ws as any).ctx = { sessionId, role, userId, ws };
//     broadcastPresence(peers);
//     console.log(`User ${userId} joined session ${sessionId}`);

//     ws.on("message", (msg) => HandleCode((ws as any).ctx, msg, peers));
//     ws.on("close", () => {
//       peers.delete(ws);
//       if (peers.size === 0) sessions.delete(sessionId);
//       else broadcastPresence(peers);
//       console.log(`User ${userId} left session ${sessionId}`);
//     });
//   });
// };

export default (wss: WebSocketServer) => {
  const sessions = new Map<string, Set<WebSocket>>();

  // WebSocket connection handler
  wss.on("connection", async (ws: WebSocket, req) => {
    let ctx;
    try {
      const token = new URLSearchParams(req.url?.split("?")[1]).get("token")!;
      ctx = await validateInviteToken(token);
    } catch (error) {
      console.error("Ws auth failed", error);
      return ws.close();
    }

    // Extract session details from context
    const { sessionId, role, userId } = ctx;
    const peers = sessions.get(sessionId) || new Set<WebSocket>();

    // Adding the new WebSocket to the session peers
    peers.add(ws);
    sessions.set(sessionId, peers);
    (ws as any).ctx = { ...ctx, ws };

    // Broadcast presence to all peers in the session
    broadcastPresence(peers);
    console.log(`User ${userId} joined session ${sessionId}`);

    // Incoming message hadnler
    ws.on("message", (raw) => {
      let msg;
      try {
        // parse the incoming message correctly
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // Switch based on message type
      switch (msg.type) {
        case "code.edit":
          HandleCode((ws as any).ctx, msg.data, peers);
          break;

        case "video.offer":
          handleVideoOffer((ws as any).ctx, msg.data, peers);
          break;

        case "video.answer":
          handleVideoAnswer((ws as any).ctx, msg.data, peers);
          break;

        case "ice.candidate":
          handleICECandidate((ws as any).ctx, msg.data, peers);
          break;

        default:
          console.warn(`Unknown message type: ${msg.type}`);
          break;
      }
    });

    // WebSocket close Handler
    ws.on("close", () => {
      // Delete peers from the session
      peers.delete(ws);
      if (peers.size) broadcastPresence(peers);
      else sessions.delete(sessionId);
      console.log(`User ${userId} left session ${sessionId}`);
    });
  });
};
