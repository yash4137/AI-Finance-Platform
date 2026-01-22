import { Router } from "express";
import { get } from "http";
import { getCurrentUserController } from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/current-user",getCurrentUserController);

export default userRoutes;