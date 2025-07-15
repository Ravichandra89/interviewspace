import { Request, Response } from "express";
import prisma from "@interviewspace/db";
import apiResponse from "../utils/apiResponse";

// get profile controller
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, role } = req.body;

    const user =
      role === "CANDIDATE"
        ? await prisma.user.findUnique({
            where: { id },
            include: {
              sessions: {
                where: {
                  participants: {
                    some: { id },
                  },
                },
                select: {
                  id: true,
                  title: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
          })
        : await prisma.user.findUnique({
            where: { id },
            include: {
              interviewerFor: {
                select: {
                  id: true,
                  title: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
          });

    if (!user) {
      apiResponse(res, false, 404, "User not found");
      return;
    }

    apiResponse(res, true, 200, "User Profile fetched!", { profile: user });
  } catch (error) {
    console.error("Error while fetching user profile", error);
    apiResponse(res, false, 500, "Error fetching user Profile");
  }
};

// Create + Update user profile
export const upsertProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, role } = req.user!;
    const { companyName, bio } = req.body;

    if (companyName && role !== "INTERVIEWER") {
      apiResponse(res, false, 403, "Only interviewers can set companyName");
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { companyName, bio },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        bio: true,
      },
    });

    apiResponse(res, true, 200, "Profile updated", { profile: updated });
  } catch (error) {
    console.error("Error while updating profile", error);
    apiResponse(res, false, 500, "Error updating profile");
  }
};
