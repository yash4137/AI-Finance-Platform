"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const env_config_1 = require("../config/env.config");
const passport_1 = __importDefault(require("passport"));
const authRoutes = (0, express_1.Router)();

const resolveGoogleCallbackUrl = (req) => {
    const configuredCallback = env_config_1.Env.GOOGLE_CALLBACK_URL;
    const basePath = env_config_1.Env.BASE_PATH || "/api";
    const host = req.get("x-forwarded-host") || req.get("host");
    const forwardedProto = req.get("x-forwarded-proto");
    const protocol = (forwardedProto || req.protocol || "http").split(",")[0].trim();

    // Auto-fix common production misconfig: localhost callback in hosted environments.
    if (configuredCallback && !configuredCallback.includes("localhost")) {
        return configuredCallback;
    }

    if (host) {
        return `${protocol}://${host}${basePath}/auth/google/callback`;
    }

    return configuredCallback;
};

authRoutes.post("/register", auth_controller_1.registerController);
authRoutes.post("/login", auth_controller_1.loginController);
// Google OAuth routes
authRoutes.get("/google", (req, res, next) => {
    const callbackURL = resolveGoogleCallbackUrl(req);
    return passport_1.default.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
        callbackURL,
    })(req, res, next);
});

authRoutes.get("/google/callback", (req, res, next) => {
    const callbackURL = resolveGoogleCallbackUrl(req);
    return passport_1.default.authenticate("google", {
        session: false,
        callbackURL,
        failureRedirect: `${env_config_1.Env.FRONTEND_ORIGIN}/?error=authentication_failed`
    })(req, res, next);
}, auth_controller_1.googleAuthCallbackController);
exports.default = authRoutes;
