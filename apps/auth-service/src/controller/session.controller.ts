import { Request, Response } from "express";
import prisma from "@interviewspace/db";
import kafkaProducer from "../kafka/producer";
import apiResponse from "../utils/apiResponse";
import { v4 as uuidV4 } from "uuid";

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
    if (role != "INTERVIEWER") {
      apiResponse(res, false, 404, "Only interviewer can create sessions");
    }

    // Take the problemId, title
    const { title, problemId, startsAt } = req.body;

    const inviteToken = uuidV4();

    // Create the Interview Session
    const session = await prisma.session.create({
      data: {
        interviewerId,
        title: title ?? null,
        problemId: problemId ?? null,
        startsAt: startsAt ? new Date(startsAt) : null,
        inviteToken,
      },
    });

    // TODO: Publish Kafka Event

    apiResponse(res, true, 201, "Session Created", { session });
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

    if (sessions.empty()) {
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
