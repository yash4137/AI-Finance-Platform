"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserController = exports.getCurrentUserController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const user_service_1 = require("../services/user.service");
const http_config_1 = require("../config/http.config");
const user_validator_1 = require("../validators/user.validator");
const report_setting_model_1 = __importDefault(require("../models/report-setting.model"));
exports.getCurrentUserController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const user = await (0, user_service_1.findByIdUserService)(userId);
    const reportSetting = await report_setting_model_1.default.findOne({ userId }, { _id: 1, frequency: 1, isEnabled: 1 }).lean();
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User fetched successfully",
        user,
        reportSetting,
    });
});
exports.updateUserController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = user_validator_1.updateUserSchema.parse(req.body);
    const userId = req.user?._id;
    const profilePic = req.file;
    const user = await (0, user_service_1.updateUserService)(userId, body, profilePic);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User profile updated successfully",
        data: user,
    });
});
