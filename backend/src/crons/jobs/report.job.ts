import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import ReportSettingModel from "../../models/report-setting.model";
import { UserDocument } from "../../models/user.model";
import mongoose from "mongoose";
import { generateReportService } from "../../services/report.service";
import ReportModel, { ReportStatusEnum } from "../../models/report.model";
import { calulateNextReportDate } from "../../utils/helper";
import { sendReportEmail } from "../../mailers/report.mailer";
import TransactionModel from "../../models/transaction.model";

export const processReportJob = async () => {
  const now = new Date();

  let processedCount = 0;
  let failedCount = 0;

  //Today july 1, then run report for -> june 1 - 30 
  //Get Last Month because this will run on the first of the month
  const from = startOfMonth(subMonths(now, 1));
  const to = endOfMonth(subMonths(now, 1));

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
    const allSettings = await ReportSettingModel.find({}).populate("userId");
    console.log("\n📊 Total report settings in DB:", allSettings.length);

    if (allSettings.length === 0) {
      console.log("❌ NO REPORT SETTINGS FOUND IN DATABASE!");
      console.log("💡 Solution: Create report settings via API:");
      console.log("   PUT /api/report/update-setting");
      console.log("   Body: { \"isEnabled\": true }");
    } else {
      allSettings.forEach((setting, index) => {
        console.log(`\n📋 Setting #${index + 1}:`);
        console.log("   User ID:", setting.userId?._id || "NULL");
        console.log("   User Email:", (setting.userId as any)?.email || "NULL");
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
    const matchingSettings = await ReportSettingModel.find({
      isEnabled: true,
      nextReportDate: { $lte: now },
    });
    console.log("\n🎯 Settings matching query:", matchingSettings.length);

    // Check transactions in date range
    const transactionCount = await TransactionModel.countDocuments({
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


    const reportSettingCursor = ReportSettingModel.find({
      isEnabled: true,
      nextReportDate: { $lte: now },
    })
      .populate<{ userId: UserDocument }>("userId")
      .cursor();

    console.log("Running report ");

    for await (const setting of reportSettingCursor) {
      const user = setting.userId as UserDocument;
      if (!user) {
        console.log(`User not found for setting: ${setting._id}`);
        continue;
      }

      const session = await mongoose.startSession();

      try {
        const report = await generateReportService(user.id, from, to);

        console.log(report, "resport data");

        let emailSent = false;
        if (report) {
          try {
            console.log(`📧 Sending email to ${user.email}...`);
            await sendReportEmail({
              email: user.email!,
              username: user.name!,
              report: {
                period: report.period,
                totalIncome: report.summary.income,
                totalExpenses: report.summary.expenses,
                availableBalance: report.summary.balance,
                savingsRate: report.summary.savingsRate,
                topSpendingCategories: report.summary.topCategories,
                insights: report.insights,
              },
              frequency: setting.frequency!,
            });
            emailSent = true;
            console.log(`✅ Email sent successfully to ${user.email}`);
          } catch (error) {
            console.log(`❌ Email failed for ${user.id}:`, error);
          }
        } else {
          console.log(`⚠️  No report data for user ${user.email} - skipping email`);
        }

        await session.withTransaction(
          async () => {
            const bulkReports: any[] = [];
            const bulkSettings: any[] = [];

            if (report && emailSent) {
              bulkReports.push({
                insertOne: {
                  document: {
                    userId: user.id,
                    sentDate: now,
                    period: report.period,
                    status: ReportStatusEnum.SENT,
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
                      nextReportDate: calulateNextReportDate(now),
                      updatedAt: now,
                    },
                  },
                },
              });
            } else {
              bulkReports.push({
                insertOne: {
                  document: {
                    userId: user.id,
                    sentDate: now,
                    period:
                      report?.period ||
                      `${format(from, "MMMM d")}–${format(to, "d, yyyy")}`,
                    status: report
                      ? ReportStatusEnum.FAILED
                      : ReportStatusEnum.NO_ACTIVITY,
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
                      nextReportDate: calulateNextReportDate(now),
                      updatedAt: now,
                    },
                  },
                },
              });
            }

            await Promise.all([
              ReportModel.bulkWrite(bulkReports, { ordered: false }),
              ReportSettingModel.bulkWrite(bulkSettings, { ordered: false }),
            ]);
          },
          {
            maxCommitTimeMS: 10000,
          }
        );

        processedCount++;
      } catch (error) {
        console.log(`Failed to process report`, error);
        failedCount++;
      } finally {
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
  } catch (error) {
    console.error("Error processing reports", error);
    return {
      success: false,
      error: "Report process failed",
    };
  }
};