/**
 *
 * @params res - Express response object
 * @params success - Boolean for success/failer
 * @params statusCode - HTTPS status code
 * @params message - Success of error msg
 * @params data - Optional Data Payload
 */

import { Response } from "express";

const apiResponse = (
  res: Response,
  success: boolean,
  statusCode: number,
  message: string,
  data?: any
) => {
  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
  });
};

export default apiResponse;
