import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { googleAuthService, loginService, registerService } from "../services/auth.service";
import { Env } from "../config/env.config";


export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const result = await registerService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User registered successfully",
      data: result,
    });
  });

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = loginSchema.parse({ ...req.body });

    const { user, accessToken, expiresAt, reportSetting } = await loginService(body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User logged in successfully",
      user,
      accessToken,
      expiresAt,
      reportSetting,
    });
  }
);

export const googleAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = req.user;

    if (!profile) {
      return res.redirect(`${Env.FRONTEND_ORIGIN}/sign-in?error=authentication_failed`);
    }

    const { user, accessToken, expiresAt, reportSetting } = await googleAuthService(profile);

    // Redirect to frontend with token
    const redirectUrl = `${Env.FRONTEND_ORIGIN}/auth/callback?token=${accessToken}&expiresAt=${expiresAt}`;
    return res.redirect(redirectUrl);
  }
); 