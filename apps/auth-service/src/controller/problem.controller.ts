import { Request, Response } from "express";
import prisma from "@interviewspace/db";
import apiResponse from "../utils/apiResponse";

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    sessionId?: string;
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

export const listProblems = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id: userId, role, sessionId } = req.user;
  try {
    let problems;
    if (role === "interviewer") {
      // Fetching session with problems
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          problems: {
            include: {
              testCases: true,
            },
          },
        },
      });
      problems = session.map((s) => s.problem!);
    } else {
      if (!sessionId) {
        apiResponse(
          res,
          false,
          400,
          "Session ID is required for non-interviewer roles"
        );
      }

      // Fetching problem for the session
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          problem: {
            include: {
              testCases: true,
            },
          },
        },
      });

      if (!session || !session.problem) {
        apiResponse(res, false, 404, "Problem not found for this session");
      }

      problems = [session.problem];
    }

    // Return the problems
    apiResponse(res, true, 200, "Problems fetched successfully", {
      problems,
    });
  } catch (error) {
    console.error("Error listing problems: ", error);
    apiResponse(res, false, 500, "Internal Server Error");
  }
};

export const getProblem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // Find the problem by ID
    const problem = await prisma.problem.findUnique({
      where: {
        id,
      },
    });

    if (!problem) {
      apiResponse(res, false, 404, "Problem not found");
    }

    apiResponse(res, true, 200, "Problem fetched successfully", {
      problem,
    });
  } catch (error) {
    console.error("Error fetching problem: ", error);
    apiResponse(res, false, 500, "Internal Server Error");
  }
};

export const updateProblem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { title, description, testCases } = req.body;

  try {
    const updatedProblem = await prisma.problem.update({
      where: {
        id,
      },
      data: {
        title,
        description,
      },
    });

    // Update test cases if provided
    if (Array.isArray(testCases)) {
      // Delete existing test cases
      await prisma.testCase.deleteMany({
        where: {
          problemId: id,
        },
      });

      // create new test cases
      await prisma.testCase.createMany({
        data: testCases.map((testCase: any, ind: number) => ({
          problemId: id,
          input: testCase.input,
          output: testCase.output,
          order: ind + 1,
        })),
      });
    }

    const problemWithTestCases = await prisma.problem.findUnique({
      where: {
        id,
      },
      include: {
        testCases: true,
      },
    });

    apiResponse(res, true, 200, "Problem updated Successfully", {
      problem: problemWithTestCases,
    });
  } catch (error) {
    console.error("Error updating problem: ", error);
    apiResponse(res, false, 500, "Internal Server Error");
  }
};

export const deleteProblem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // Remove the problem with testCases
    await prisma.testCase.deleteMany({
      where: {
        problemId: id,
      },
    });
    await prisma.problem.delete({
      where: {
        id,
      },
    });

    apiResponse(res, true, 200, "Problem deleted successfully");
  } catch (error) {
    console.error("Error deleting problem: ", error);
    apiResponse(res, false, 500, "Internal Server Error");
  }
};

export default createProblem;
