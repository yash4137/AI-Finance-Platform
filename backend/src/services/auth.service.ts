import UserModel from "../models/user.model";
import { UnauthorizedException } from "../utils/app-error";
import { registerSchemaType } from "../validators/auth.validator";

export const registerService = async (body: registerSchemaType) => {
  const { email } = body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new UnauthorizedException("User already exists");

  const newUser = new UserModel({
    ...body,
  });
  await newUser.save();
  
};