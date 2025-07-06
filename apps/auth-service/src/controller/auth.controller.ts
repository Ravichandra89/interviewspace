import { Request, Response } from "express";
import { signToken, verifyToken } from "../utils/jwt";
import apiResponse from "../utils/apiResponse";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import prisma from "@interviewspace/db";

export const Signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      apiResponse(res, false, 400, "All fields are required");
    }

    // If role is INTERVIEWER, companyName must be present
    if (role === "INTERVIEWER" && !companyName) {
      apiResponse(res, false, 400, "Company name is required for Interviewers");
    }

    // Check if user already exists
    const isExist = await prisma.user.findUnique({ where: { email } });
    if (isExist) {
      apiResponse(res, false, 409, "Email already exists");
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        role,
        companyName: role === "INTERVIEWER" ? companyName : null,
      },
    });

    // Generate JWT Token
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    apiResponse(res, true, 200, "User registered successfully!", {
      newUser: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyName: newUser.companyName,
      },
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    apiResponse(res, false, 500, "Server error during signup");
  }
};

export const SignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      apiResponse(res, false, 404, "Email & Password is Required!");
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      apiResponse(res, false, 404, "User Not Exist!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      apiResponse(res, false, 400, "Entered Incorrect Password!");
    }

    // Generate Token if Password is Correct
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    apiResponse(res, true, 200, "User logged In Successfully!", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {}
};

/**
 * TODO: User enters their email → backend generates a JWT token → this token is.     sent     to the user's email.
       Then, the user clicks a "reset password" link that includes this token →
       They are shown a "Reset Password" form → on submit, you verify the token and allow password update.
 */

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      apiResponse(res, false, 409, "Email Missing!");
    }

    // check user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      apiResponse(res, false, 404, "No user found with this email");
    }

    // Genrate the token
    const token = signToken({
      email,
    });

    // Building the Url
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Nodemailer to sent the mail
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Sending Email
    await transport.sendMail({
      from: `InterviewSpace <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "InterviewSpace Password Reset",
      html: `
          <p>Hello</p>
          <p>Click the link below to reset your password (valid 10m):</p>
          <a href="${url}">${url}</a>
          <p>If you didn’t request this, please ignore.</p>
          `,
    });

    apiResponse(res, true, 200, "Reset link sent successfully!");
  } catch (error) {
    console.error("Error Forgatting Password", error);
    apiResponse(res, false, 500, "Forgate Password Error");
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      apiResponse(res, false, 400, "Token and newPassword are required");
    }

    // verify the token - Sending the payload
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      apiResponse(res, false, 401, "Invalid or expired Token");
    }

    // Update the password
    const { email } = payload;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      apiResponse(res, false, 404, "User not found");
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashPassword,
      },
    });

    apiResponse(res, true, 200, "Password reset successfully!");
  } catch (error) {
    console.error("Error while Reseting Password", error);
    apiResponse(res, false, 500, "Error resetting password");
  }
};
