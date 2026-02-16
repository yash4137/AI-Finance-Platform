import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { findByIdUserService, updateUserService } from "../services/user.service";
import { HTTPSTATUS } from "../config/http.config";
import { updateUserSchema } from "../validators/user.validator";
import ReportSettingModel from "../models/report-setting.model";

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const user = await findByIdUserService(userId);

    const reportSetting = await ReportSettingModel.findOne(
      { userId },
      { _id: 1, frequency: 1, isEnabled: 1 }
    ).lean();

    return res.status(HTTPSTATUS.OK).json({
      message: "User fetched successfully",
      user,
      reportSetting,
    });
  }
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = updateUserSchema.parse(req.body);
    const userId = req.user?._id;
    const profilePic = req.file;

    const user = await updateUserService(userId, body, profilePic);

    return res.status(HTTPSTATUS.OK).json({
      message: "User profile updated successfully",
      data: user,
    });
  }
);