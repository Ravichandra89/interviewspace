import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "@interviewspace/db";

export interface InvitePayload extends JwtPayload {
  sessionId: string;
  role: string;
  userId?: string;
}

export interface UserContext {
  userId: string;
  role: string;
  sessionId: string;
}

const validateInviteToken = async (token: string): Promise<InvitePayload> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  try {
    // 1) Verify signature & expiration
    const decoded = jwt.verify(token, secret) as InvitePayload;

    // 2) Basic payload validation
    if (!decoded.sessionId || decoded.role !== "CANDIDATE") {
      throw new Error("Invalid token payload");
    }

    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      select: { inviteToken: true },
    });
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.inviteToken !== token) {
      throw new Error("Token does not match stored invite token");
    }

    return decoded;
  } catch (error: any) {
    throw new Error(`Token validation failed: ${error.message || error}`);
  }
};

export default validateInviteToken;
