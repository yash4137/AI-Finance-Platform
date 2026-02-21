"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallbackController = exports.loginController = exports.registerController = void 0;
const http_config_1 = require("../config/http.config");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const auth_service_1 = require("../services/auth.service");
const env_config_1 = require("../config/env.config");
exports.registerController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.registerSchema.parse(req.body);
    const result = await (0, auth_service_1.registerService)(body);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "User registered successfully",
        data: result,
    });
});
exports.loginController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.loginSchema.parse({ ...req.body });
    const { user, accessToken, expiresAt, reportSetting } = await (0, auth_service_1.loginService)(body);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User logged in successfully",
        user,
        accessToken,
        expiresAt,
        reportSetting,
    });
});
exports.googleAuthCallbackController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const profile = req.user;
    if (!profile) {
        return res.redirect(`${env_config_1.Env.FRONTEND_ORIGIN}/sign-in?error=authentication_failed`);
    }
    const { user, accessToken, expiresAt, reportSetting } = await (0, auth_service_1.googleAuthService)(profile);
    // Redirect to frontend with token
    const redirectUrl = `${env_config_1.Env.FRONTEND_ORIGIN}/auth/callback?token=${accessToken}&expiresAt=${expiresAt}`;
    return res.redirect(redirectUrl);
});
