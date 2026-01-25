"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_storage_cloudinary_1 = __importDefault(require("multer-storage-cloudinary"));
const env_config_1 = require("./env.config");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.default.v2.config({
    cloud_name: env_config_1.Env.CLOUDINARY_CLOUD_NAME,
    api_key: env_config_1.Env.CLOUDINARY_API_KEY,
    api_secret: env_config_1.Env.CLOUDINARY_API_SECRET,
});
const STORAGE_PARAMS = {
    folder: "images",
    allowed_formats: ["jpg", "png", "jpeg"],
    resource_type: "image",
    quality: "auto:good",
};
// NOTE: `multer-storage-cloudinary@2.x` exports a factory function, not a class.
const storage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    // NOTE: Using a static object avoids implicit-any callback params.
    params: STORAGE_PARAMS,
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (_, file, cb) => {
        const isValid = /^image\/(jpe?g|png)$/.test(file.mimetype);
        if (!isValid) {
            return cb(null, false);
        }
        cb(null, true);
    },
});
