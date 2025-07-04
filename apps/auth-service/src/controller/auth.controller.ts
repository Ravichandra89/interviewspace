import { Request, Response } from "express";
import { signToken, verifyToken } from "../utils/jwt";
import apiResponse from "../utils/apiResponse";
import { prisma } from "@interviewspace/db";
import bcrypt from "bcrypt";

const Signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // check Email Already Exist or not
    const isExist = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (isExist) {
      return apiResponse(res, false, 409, "Email Already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.create({
      data: {
        name,
        email,
        password: hashPassword,
        role,
      },
    });

    // Generate JWT TOken
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return apiResponse(res, true, 200, "User Registered Successfully!", {
      newUser: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token
    });
  } catch (error) {
    console.error("SignUp Error", error);
    return apiResponse(res, false, 500, "Server error during signup");
  }
};

const SignIn = async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
        return apiResponse(res, false, 404, "Email & Password is Required!");
    }

    const user = await prisma.findUnique({
        where: {
            email,
        }
    });

    if (!user) {
        return apiResponse(res, false, 404, "User Not Exist!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return apiResponse(res, false, 400, "Entered Incorrect Password!");
    }

    // Generate Token if Password is Correct
    const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    return apiResponse(res, true, 200, "User logged In Successfully!", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role : user.role
        },
        token
    })
  } catch (error) {}
};

/**
 * TODO: User enters their email → backend generates a JWT token → this token is.     sent     to the user's email.
       Then, the user clicks a "reset password" link that includes this token →
       They are shown a "Reset Password" form → on submit, you verify the token and allow password update.
 */

const forgotPassword = (req: Request, res: Response) => {
    try {
        const {email} = req.body;
        if (!email) {
            return apiResponse(res, false, 409, "Email Missing!");
        }

        // check user
        
    } catch (error) {
        console.error("Error Forgatting Password", error);
        return apiResponse(res, false, 500, "Forgate Password Error");
    }
}
