/**
 * Token Verification and Sign method
 */

import jwt from "jsonwebtoken"

export const signToken = (payload : object, expiresIn= "7d") => {
    return jwt.sign(payload, process.env.JWT_SECRET || "my_Secret");
}

export const verifyToken = (token : string) => {
    return jwt.verify(token, process.env.JWT_SECRET || "my_jwt_secre");
}

