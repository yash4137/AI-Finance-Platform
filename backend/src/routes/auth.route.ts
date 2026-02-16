import { Router } from "express";
import { googleAuthCallbackController, loginController, registerController } from "../controllers/auth.controller";
import passport from "passport";

const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);

// Google OAuth routes
authRoutes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/sign-in" }),
  googleAuthCallbackController
);

export default authRoutes;