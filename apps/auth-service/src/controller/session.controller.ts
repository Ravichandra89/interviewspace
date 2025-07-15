import { Request, Response } from "express";
import prisma from "@interviewspace/db";
import kafkaProducer from "../kafka/producer";
import apiResponse from "../utils/apiResponse";
import jwt from "jsonwebtoken";
import { v4 as uuidV4 } from "uuid";
import scheduledInviteEmail from "../schedule";

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// CreateSession -
export const CreateSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: interviewerId, role } = req.user;

    if (role !== "INTERVIEWER") {
      apiResponse(res, false, 404, "Only interviewer can create sessions");
      return;
    }

    const { title, problemId, startsAt, participantsIds } = req.body;

    if (!startsAt || !participantsIds.length) {
      apiResponse(
        res,
        false,
        400,
        "StartsAt and Participants Id's are required"
      );
      return;
    }

    // Pre-generate the invite token
    const generatedInviteToken = jwt.sign(
      { role: "CANDIDATE" }, // sessionId will be known after create, so only use role
      process.env.JWT_SECRET!,
      { expiresIn: "3h" }
    );

    // Create the session
    const session = await prisma.session.create({
      data: {
        title: title || null,
        startsAt: new Date(startsAt),
        inviteToken: generatedInviteToken, // 💡 Required field now added
        problem: problemId ? { connect: { id: problemId } } : undefined,
        interviewer: { connect: { id: interviewerId } },
        participants: {
          connect: participantsIds.map((id: string) => ({ id })),
        },
      },
      include: {
        participants: true,
      },
    });

    scheduledInviteEmail(
      session.startsAt,
      session.inviteToken,
      session.participants
    );

    apiResponse(res, true, 200, "Created Session", {
      session,
      inviteToken: session.inviteToken,
    });
  } catch (error) {
    console.error("Create Session Error", error);
    apiResponse(res, false, 500, "Create Session Error");
  }
};

export const getSessionById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({
      where: {
        id,
      },
    });

    if (!session) {
      apiResponse(res, false, 404, "Session Not Found");
    }

    apiResponse(res, true, 200, "Session Reterived", {
      session,
    });
  } catch (error) {
    console.error("GetSession By Id Error", error);
    apiResponse(res, false, 500, "GetSessionById Error");
  }
};

export const listInterviewerSessions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id: interviewerId, role } = req.body;
    if (role !== "INTERVIEWER") {
      apiResponse(res, false, 403, "Access Denied");
    }

    const sessions = await prisma.session.findMany({
      where: {
        interviewerId,
      },
    });

    if (sessions.length === 0) {
      apiResponse(res, false, 409, "Interview Sessions are not there");
    }

    apiResponse(res, true, 200, "Sessions Listed: ", {
      sessions,
    });
  } catch (error) {
    console.error("ListInterview Sessions error: ", error);
    apiResponse(res, false, 500, "Failed to list sessions");
  }
};
