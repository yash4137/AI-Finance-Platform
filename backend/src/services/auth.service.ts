import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import { loginSchemaType, registerSchemaType } from "../validators/auth.validator";
import ReportSettingModel, { ReportFrequencyEnum } from "../models/report-setting.model";
import { calculateNextReportDate } from "../utils/helper";
import { signJwtToken } from "../utils/jwt";

export const registerService = async (body: registerSchemaType) => {
  const { email } = body;

  const session = await mongoose.startSession();

  try{
    const result = await session.withTransaction(async () => {
      const existingUser = await UserModel.findOne({ email }).session(session);
      if (existingUser) throw new UnauthorizedException("User already exists");
    
      const newUser = new UserModel({
        ...body,
      });
      await newUser.save({session}); 

      const reportSetting = new ReportSettingModel({
        userId: newUser._id,
        frequency: ReportFrequencyEnum.MONTHLY,
        isEnabled: true,
        lastSentDate: null,
        nextReportDate: calculateNextReportDate(),
      });
      await reportSetting.save({session});

      return { user: newUser.omitPassword() };
    });
    return result;
  }catch(error){
    throw error;
  }finally{
    await session.endSession();
  }

};

export const loginService = async (body: loginSchemaType) => {
  const { email, password } = body;
  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Email/password not found");

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) throw new UnauthorizedException("Invalid email/password");

  const { token, expiresAt } = signJwtToken({ userId: user.id() });

  const reportSetting = await ReportSettingModel.findOne({ userId: user.id },
    { _id:1, frequency: 1, isEnabled: 1}
  ).lean();

  return {
    user: user.omitPassword(),
    accessToken: token,
    expiresAt,
    reportSetting,
  }
};