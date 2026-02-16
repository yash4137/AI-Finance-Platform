import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import ReportSettingModel, {
  ReportFrequencyEnum,
} from "../models/report-setting.model";
import { calulateNextReportDate } from "../utils/helper";
import { signJwtToken } from "../utils/jwt";
import { loginSchemaType, registerSchemaType } from "../validators/auth.validator";

export const registerService = async (body: registerSchemaType) => {
  const { email } = body;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const existingUser = await UserModel.findOne({ email }).session(session);
      if (existingUser) throw new UnauthorizedException("User already exists");

      const newUser = new UserModel({
        ...body,
      });

      await newUser.save({ session });

      const reportSetting = new ReportSettingModel({
        userId: newUser._id,
        frequency: ReportFrequencyEnum.MONTHLY,
        isEnabled: true,
        nextReportDate: calulateNextReportDate(),
        lastSentDate: null,
      });
      await reportSetting.save({ session });

      return { user: newUser.omitPassword() };
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

export const loginService = async (body: loginSchemaType) => {
  const { email, password } = body;
  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Email/password not found");

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid)
    throw new UnauthorizedException("Invalid email/password");

  const { token, expiresAt } = signJwtToken({ userId: user.id });

  const reportSetting = await ReportSettingModel.findOne(
    {
      userId: user.id,
    },
    { _id: 1, frequency: 1, isEnabled: 1 }
  ).lean();

  return {
    user: user.omitPassword(),
    accessToken: token,
    expiresAt,
    reportSetting,
  };
};

export const googleAuthService = async (profile: any) => {
  const { id, emails, displayName, photos } = profile;
  const email = emails[0].value;
  const googleId = id;
  const name = displayName;
  const profilePicture = photos?.[0]?.value || null;

  const session = await mongoose.startSession();

  try {
    let user = await UserModel.findOne({ googleId }).session(session);

    if (!user) {
      user = await UserModel.findOne({ email }).session(session);

      if (user) {
        // User exists with email but not googleId, update with googleId
        user.googleId = googleId;
        if (!user.profilePicture && profilePicture) {
          user.profilePicture = profilePicture;
        }
        await user.save({ session });
      } else {
        // Create new user
        await session.withTransaction(async () => {
          user = new UserModel({
            name,
            email,
            googleId,
            profilePicture,
          });
          await user!.save({ session });

          const reportSetting = new ReportSettingModel({
            userId: user!._id,
            frequency: ReportFrequencyEnum.MONTHLY,
            isEnabled: true,
            nextReportDate: calulateNextReportDate(),
            lastSentDate: null,
          });
          await reportSetting.save({ session });
        });
      }
    }

    const { token, expiresAt } = signJwtToken({ userId: user!.id });

    const reportSetting = await ReportSettingModel.findOne(
      { userId: user!.id },
      { _id: 1, frequency: 1, isEnabled: 1 }
    ).lean();

    return {
      user: user!.omitPassword(),
      accessToken: token,
      expiresAt,
      reportSetting,
    };
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};