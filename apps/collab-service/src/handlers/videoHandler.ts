import WebSocket from "ws";
import { UserContext } from "../auth/tokenValidation";

/**
 *
 * Video Handler for Managing video streams in collaborative sessions.
 *  - Offer : from Candidate to Interviewer
 *  - Answer : from Interviewer to Candidate
 *  - IceCandidate : from Candidate to Interviewer
 *
 */

export const handleVideoOffer = (
  ctx: UserContext & { ws: WebSocket },
  offer: any,
  peers: Set<WebSocket>
) => {
  if (ctx.role !== "candidate") return;

  // Broadcast the video offer to all peers except the sender
  for (const peer of peers) {
    const peerCtx = (peer as any).ctx as UserContext;

    if (peerCtx.role === "interviewer" && peer.readyState === WebSocket.OPEN) {
      peer.send(
        JSON.stringify({
          type: "video.offer",
          payload: offer,
        })
      );
    }
  }
};

export const handleVideoAnswer = (
  ctx: UserContext & { ws: WebSocket },
  answer: any,
  peers: Set<WebSocket>
) => {
  if (ctx.role !== "interviewer") return;

  // Broadcast the video answer to all peers except the sender
  for (const peer of peers) {
    const peerCtx = (peer as any).ctx as UserContext;

    if (peerCtx.role === "candidate" && peer.readyState === WebSocket.OPEN) {
      peer.send(
        JSON.stringify({
          type: "video.answer",
          payload: answer,
        })
      );
    }
  }
};

export const handleICECandidate = (
  ctx: UserContext & { ws: WebSocket },
  candidate: any,
  peers: Set<WebSocket>
) => {
  const targetRole = ctx.role === "candidate" ? "interviewer" : "candidate";

  // Broadcast the ICE candidate to the target role peers
  for (const peer of peers) {
    const peerCtx = (peer as any).ctx as UserContext;
    if (peerCtx.role === targetRole && peer.readyState === WebSocket.OPEN) {
      peer.send(
        JSON.stringify({
          type: "ice.candidate",
          payload: candidate,
        })
      );
    }
  }
};
