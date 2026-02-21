"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const passport_1 = __importDefault(require("passport"));
const authRoutes = (0, express_1.Router)();
authRoutes.post("/register", auth_controller_1.registerController);
authRoutes.post("/login", auth_controller_1.loginController);
// Google OAuth routes
authRoutes.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"], session: false }));
authRoutes.get("/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: "/sign-in" }), auth_controller_1.googleAuthCallbackController);
exports.default = authRoutes;
