import { Request, Response } from "express";
import prisma from "@interviewspace/db";
import apiResponse from "../utils/apiResponse";

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const createProblem = async (req: Request, res: Response): Promise<void> => {
  const { id: inteviewerId, role } = req.user;
  const { sessionId } = req.params;
  const { title, description, testCases } = req.body;

  // Check the role first
  if (role !== "interviewer") {
    apiResponse(res, false, 403, "Only Interviewers can create problems");
  }

  try {
    // Verify if the session exists with interviewerId
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        interviewerId: true,
        problemId: true,
      },
    });

    if (!session) {
      apiResponse(res, false, 404, "Session not found");
    }

    if (session.interviewerId !== inteviewerId) {
      apiResponse(
        res,
        false,
        403,
        "You are not authorized to create problems for this session"
      );
    }

    // Create the problem + nested TestCases
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        testCases: {
          create: testCases.map((testCase: any, ind: number) => ({
            input: testCase.input,
            output: testCase.output,
            order: ind + 1,
          })),
        },
      },
    });

    // link the problem with the session - Storing problemId in session's problemId field
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        problemId: problem.id,
      },
    });

    apiResponse(res, true, 201, "Problem created successfully", {
      problem,
    });
  } catch (error) {
    console.error("Error creating problem: ", error);
    apiResponse(res, false, 500, "Internal Server Error");
  }
};

export default createProblem;
