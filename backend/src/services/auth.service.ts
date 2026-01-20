import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { UnauthorizedException } from "../utils/app-error";
import { registerSchemaType } from "../validators/auth.validator";
import ReportSettingModel, { ReportFrequencyEnum } from "../models/report-setting.model";
import { calculateNextReportDate } from "../utils/helper";

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