"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByIdUserService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const findByIdUserService = async (userId) => {
    const user = await user_model_1.default.findById(userId);
    return user?.omitPassword();
};
exports.findByIdUserService = findByIdUserService;
