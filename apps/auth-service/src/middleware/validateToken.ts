import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import apiResponse from "../utils/apiResponse";
import { JwtPayload } from "jsonwebtoken";

// Extend Request to add user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const validateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      apiResponse(res, false, 409, "Authorization token missing or malformed");
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (
      typeof decoded === "string" ||
      !decoded ||
      !("id" in decoded && "email" in decoded && "role" in decoded)
    ) {
      apiResponse(res, false, 401, "Invalid or expired token");
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Token Validation Error:", error);
    apiResponse(res, false, 500, "[Middleware] Validation Error");
  }
};

export default validateToken;
