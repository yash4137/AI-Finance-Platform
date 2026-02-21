"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportAuthenticateGoogle = exports.passportAuthenticateJwt = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_config_1 = require("./env.config");
const passport_1 = __importDefault(require("passport"));
const user_service_1 = require("../services/user.service");
const options = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env_config_1.Env.JWT_SECRET,
    audience: ["user"],
    algorithms: ["HS256"],
};
passport_1.default.use(new passport_jwt_1.Strategy(options, async (payload, done) => {
    try {
        if (!payload.userId) {
            return done(null, false, { message: "Invalid token payload" });
        }
        const user = await (0, user_service_1.findByIdUserService)(payload.userId);
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, false);
    }
}));
// Google OAuth Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_config_1.Env.GOOGLE_CLIENT_ID,
    clientSecret: env_config_1.Env.GOOGLE_CLIENT_SECRET,
    callbackURL: env_config_1.Env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        return done(null, profile);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
passport_1.default.serializeUser((user, done) => done(null, user));
passport_1.default.deserializeUser((user, done) => done(null, user));
exports.passportAuthenticateJwt = passport_1.default.authenticate("jwt", { session: false });
exports.passportAuthenticateGoogle = passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
    session: false
});
