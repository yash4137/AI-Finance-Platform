"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReportJob = void 0;
const date_fns_1 = require("date-fns");
const report_setting_model_1 = __importDefault(require("../../models/report-setting.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const report_service_1 = require("../../services/report.service");
const report_model_1 = __importStar(require("../../models/report.model"));
const helper_1 = require("../../utils/helper");
const report_mailer_1 = require("../../mailers/report.mailer");
const transaction_model_1 = __importDefault(require("../../models/transaction.model"));
const processReportJob = async () => {
    const now = new Date();
    let processedCount = 0;
    let failedCount = 0;
    //Today july 1, then run report for -> june 1 - 30 
    //Get Last Month because this will run on the first of the month
    const from = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
    const to = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
    // const from = "2025-04-01T23:00:00.000Z";
    // const to = "2025-04-T23:00:00.000Z";
    /////////  add for remember to remove this log after debugging //////////
    try {
        // ===== DEBUG LOGGING START =====
        console.log("=".repeat(60));
        console.log("🔍 DEBUG: Report Job Started");
        console.log("⏰ Current time (now):", now.toISOString());
        console.log("📅 Report date range:");
        console.log("   From:", from.toISOString());
        console.log("   To:", to.toISOString());
        // Check all report settings in database
        const allSettings = await report_setting_model_1.default.find({}).populate("userId");
        console.log("\n📊 Total report settings in DB:", allSettings.length);
        if (allSettings.length === 0) {
            console.log("❌ NO REPORT SETTINGS FOUND IN DATABASE!");
            console.log("💡 Solution: Create report settings via API:");
            console.log("   PUT /api/report/update-setting");
            console.log("   Body: { \"isEnabled\": true }");
        }
        else {
            allSettings.forEach((setting, index) => {
                console.log(`\n📋 Setting #${index + 1}:`);
                console.log("   User ID:", setting.userId?._id || "NULL");
                console.log("   User Email:", setting.userId?.email || "NULL");
                console.log("   isEnabled:", setting.isEnabled);
                console.log("   nextReportDate:", setting.nextReportDate?.toISOString() || "NULL");
                console.log("   lastSentDate:", setting.lastSentDate?.toISOString() || "NULL");
                // Check if this setting matches the query
                const matches = setting.isEnabled &&
                    setting.nextReportDate &&
                    setting.nextReportDate <= now;
                console.log("   ✅ Matches query:", matches);
                if (!matches) {
                    if (!setting.isEnabled) {
                        console.log("   ⚠️  Reason: isEnabled is FALSE");
                    }
                    if (!setting.nextReportDate) {
                        console.log("   ⚠️  Reason: nextReportDate is NULL");
                    }
                    if (setting.nextReportDate && setting.nextReportDate > now) {
                        console.log("   ⚠️  Reason: nextReportDate is in FUTURE");
                    }
                }
            });
        }
        // Check for matching settings
        const matchingSettings = await report_setting_model_1.default.find({
            isEnabled: true,
            nextReportDate: { $lte: now },
        });
        console.log("\n🎯 Settings matching query:", matchingSettings.length);
        // Check transactions in date range
        const transactionCount = await transaction_model_1.default.countDocuments({
            date: { $gte: from, $lte: to },
        });
        console.log("📦 Transactions in date range:", transactionCount);
        if (transactionCount === 0) {
            console.log("⚠️  NO TRANSACTIONS in", from.toISOString(), "to", to.toISOString());
            console.log("💡 Solution: Create transactions for January 2026 via API");
        }
        console.log("=".repeat(60));
        // ===== DEBUG LOGGING END =====
        /// / // / /
        const reportSettingCursor = report_setting_model_1.default.find({
            isEnabled: true,
            nextReportDate: { $lte: now },
        })
            .populate("userId")
            .cursor();
        console.log("Running report ");
        for await (const setting of reportSettingCursor) {
            const user = setting.userId;
            if (!user) {
                console.log(`User not found for setting: ${setting._id}`);
                continue;
            }
            const session = await mongoose_1.default.startSession();
            try {
                const report = await (0, report_service_1.generateReportService)(user.id, from, to);
                console.log(report, "resport data");
                let emailSent = false;
                if (report) {
                    try {
                        console.log(`📧 Sending email to ${user.email}...`);
                        await (0, report_mailer_1.sendReportEmail)({
                            email: user.email,
                            username: user.name,
                            report: {
                                period: report.period,
                                totalIncome: report.summary.income,
                                totalExpenses: report.summary.expenses,
                                availableBalance: report.summary.balance,
                                savingsRate: report.summary.savingsRate,
                                topSpendingCategories: report.summary.topCategories,
                                insights: report.insights,
                            },
                            frequency: setting.frequency,
                        });
                        emailSent = true;
                        console.log(`✅ Email sent successfully to ${user.email}`);
                    }
                    catch (error) {
                        console.log(`❌ Email failed for ${user.id}:`, error);
                    }
                }
                else {
                    console.log(`⚠️  No report data for user ${user.email} - skipping email`);
                }
                await session.withTransaction(async () => {
                    const bulkReports = [];
                    const bulkSettings = [];
                    if (report && emailSent) {
                        bulkReports.push({
                            insertOne: {
                                document: {
                                    userId: user.id,
                                    sentDate: now,
                                    period: report.period,
                                    status: report_model_1.ReportStatusEnum.SENT,
                                    createdAt: now,
                                    updatedAt: now,
                                },
                            },
                        });
                        bulkSettings.push({
                            updateOne: {
                                filter: { _id: setting._id },
                                update: {
                                    $set: {
                                        lastSentDate: now,
                                        nextReportDate: (0, helper_1.calulateNextReportDate)(now),
                                        updatedAt: now,
                                    },
                                },
                            },
                        });
                    }
                    else {
                        bulkReports.push({
                            insertOne: {
                                document: {
                                    userId: user.id,
                                    sentDate: now,
                                    period: report?.period ||
                                        `${(0, date_fns_1.format)(from, "MMMM d")}–${(0, date_fns_1.format)(to, "d, yyyy")}`,
                                    status: report
                                        ? report_model_1.ReportStatusEnum.FAILED
                                        : report_model_1.ReportStatusEnum.NO_ACTIVITY,
                                    createdAt: now,
                                    updatedAt: now,
                                },
                            },
                        });
                        bulkSettings.push({
                            updateOne: {
                                filter: { _id: setting._id },
                                update: {
                                    $set: {
                                        lastSentDate: null,
                                        nextReportDate: (0, helper_1.calulateNextReportDate)(now),
                                        updatedAt: now,
                                    },
                                },
                            },
                        });
                    }
                    await Promise.all([
                        report_model_1.default.bulkWrite(bulkReports, { ordered: false }),
                        report_setting_model_1.default.bulkWrite(bulkSettings, { ordered: false }),
                    ]);
                }, {
                    maxCommitTimeMS: 10000,
                });
                processedCount++;
            }
            catch (error) {
                console.log(`Failed to process report`, error);
                failedCount++;
            }
            finally {
                await session.endSession();
            }
        }
        console.log(`✅Processed: ${processedCount} report`);
        console.log(`❌ Failed: ${failedCount} report`);
        return {
            success: true,
            processedCount,
            failedCount,
        };
    }
    catch (error) {
        console.error("Error processing reports", error);
        return {
            success: false,
            error: "Report process failed",
        };
    }
};
exports.processReportJob = processReportJob;
