import WebSocket from "ws";

const broadcastPresence = async (peers: Set<WebSocket>) => {
  peers.forEach((peer) => {
    if (peer.readyState === WebSocket.OPEN) peer.send(message);
  });

  const userIds = Array.from(peers).map((peer: any) => peer.cts.userId);
  const message = JSON.stringify({
    event: "presence.update",
    data: {
      userIds,
    },
  });

  //   Send this presence update to all Open WebSocket connections
  peers.forEach((peer) => {
    if (peer.readyState === WebSocket.OPEN) peer.send(message);
  });
};

export default broadcastPresence;
