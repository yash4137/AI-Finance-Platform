"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });

require("dotenv/config");
require("./config/passport.config");

const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));

const env_config_1 = require("./config/env.config");
const http_config_1 = require("./config/http.config");

const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const asyncHandler_middleware_1 = require("./middlewares/asyncHandler.middleware");

const database_config_1 = __importDefault(require("./config/database.config"));

const auth_route_1 = __importDefault(require("./routes/auth.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const transaction_route_1 = __importDefault(require("./routes/transaction.route"));
const report_route_1 = __importDefault(require("./routes/report.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));

const passport_config_1 = require("./config/passport.config");
const crons_1 = require("./crons");

const app = (0, express_1.default)();

const PORT = env_config_1.Env.PORT || process.env.PORT || 5000;
const BASE_PATH = env_config_1.Env.BASE_PATH || "/api";
const FRONTEND_ORIGIN = env_config_1.Env.FRONTEND_ORIGIN || "*";

app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));

app.use(passport_1.default.initialize());

app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN,
    credentials: true,
}));

app.get("/", (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "API is running",
    });
}));

app.use(`${BASE_PATH}/auth`, auth_route_1.default);
app.use(`${BASE_PATH}/user`, passport_config_1.passportAuthenticateJwt, user_route_1.default);
app.use(`${BASE_PATH}/transaction`, passport_config_1.passportAuthenticateJwt, transaction_route_1.default);
app.use(`${BASE_PATH}/report`, passport_config_1.passportAuthenticateJwt, report_route_1.default);
app.use(`${BASE_PATH}/analytics`, passport_config_1.passportAuthenticateJwt, analytics_route_1.default);

app.use(errorHandler_middleware_1.errorHandler);

const startServer = async () => {
    try {
        await (0, database_config_1.default)();
        console.log("Database connected");

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} in ${env_config_1.Env.NODE_ENV} mode`);
        });

        // Run crons only in development
        if (env_config_1.Env.NODE_ENV === "development") {
            await (0, crons_1.initializeCrons)();
            console.log("⏰ Crons initialized");
        }

    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1); 
    }
};

startServer();