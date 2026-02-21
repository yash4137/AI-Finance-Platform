"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanReceiptService = exports.bulkTransactionService = exports.bulkDeleteTransactionService = exports.deleteTransactionService = exports.updateTransactionService = exports.duplicateTransactionService = exports.getTransactionByIdService = exports.getAllTransactionService = exports.createTransactionService = void 0;
const axios_1 = __importDefault(require("axios"));
const tesseract_js_1 = require("tesseract.js");
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const app_error_1 = require("../utils/app-error");
const helper_1 = require("../utils/helper");
const google_ai_config_1 = require("../config/google-ai.config");
const genai_1 = require("@google/genai");
const prompt_1 = require("../utils/prompt");
const ocr_parser_1 = require("../utils/ocr-parser");
const createTransactionService = async (body, userId) => {
    let nextRecurringDate;
    const currentDate = new Date();
    if (body.isRecurring && body.recurringInterval) {
        const calulatedDate = (0, helper_1.calculateNextOccurrence)(body.date, body.recurringInterval);
        nextRecurringDate =
            calulatedDate < currentDate
                ? (0, helper_1.calculateNextOccurrence)(currentDate, body.recurringInterval)
                : calulatedDate;
    }
    const transaction = await transaction_model_1.default.create({
        ...body,
        userId,
        category: body.category,
        amount: Number(body.amount),
        isRecurring: body.isRecurring || false,
        recurringInterval: body.recurringInterval || null,
        nextRecurringDate,
        lastProcessed: null,
    });
    return transaction;
};
exports.createTransactionService = createTransactionService;
const getAllTransactionService = async (userId, filters, pagination) => {
    const { keyword, type, recurringStatus } = filters;
    const filterConditions = {
        userId,
    };
    if (keyword) {
        filterConditions.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { category: { $regex: keyword, $options: "i" } },
        ];
    }
    if (type) {
        filterConditions.type = type;
    }
    if (recurringStatus) {
        if (recurringStatus === "RECURRING") {
            filterConditions.isRecurring = true;
        }
        else if (recurringStatus === "NON_RECURRING") {
            filterConditions.isRecurring = false;
        }
    }
    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;
    const [transations, totalCount] = await Promise.all([
        transaction_model_1.default.find(filterConditions)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 }),
        transaction_model_1.default.countDocuments(filterConditions),
    ]);
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
        transations,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip,
        },
    };
};
exports.getAllTransactionService = getAllTransactionService;
const getTransactionByIdService = async (userId, transactionId) => {
    const transaction = await transaction_model_1.default.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction)
        throw new app_error_1.NotFoundException("Transaction not found");
    return transaction;
};
exports.getTransactionByIdService = getTransactionByIdService;
const duplicateTransactionService = async (userId, transactionId) => {
    const transaction = await transaction_model_1.default.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction)
        throw new app_error_1.NotFoundException("Transaction not found");
    const duplicated = await transaction_model_1.default.create({
        ...transaction.toObject(),
        _id: undefined,
        title: `Duplicate - ${transaction.title}`,
        description: transaction.description
            ? `${transaction.description} (Duplicate)`
            : "Duplicated transaction",
        isRecurring: false,
        recurringInterval: undefined,
        nextRecurringDate: undefined,
        createdAt: undefined,
        updatedAt: undefined,
    });
    return duplicated;
};
exports.duplicateTransactionService = duplicateTransactionService;
const updateTransactionService = async (userId, transactionId, body) => {
    const existingTransaction = await transaction_model_1.default.findOne({
        _id: transactionId,
        userId,
    });
    if (!existingTransaction)
        throw new app_error_1.NotFoundException("Transaction not found");
    const now = new Date();
    const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;
    const date = body.date !== undefined ? new Date(body.date) : existingTransaction.date;
    const recurringInterval = body.recurringInterval || existingTransaction.recurringInterval;
    let nextRecurringDate;
    if (isRecurring && recurringInterval) {
        const calulatedDate = (0, helper_1.calculateNextOccurrence)(date, recurringInterval);
        nextRecurringDate =
            calulatedDate < now
                ? (0, helper_1.calculateNextOccurrence)(now, recurringInterval)
                : calulatedDate;
    }
    existingTransaction.set({
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category }),
        ...(body.type && { type: body.type }),
        ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        date,
        isRecurring,
        recurringInterval,
        nextRecurringDate,
    });
    await existingTransaction.save();
    return;
};
exports.updateTransactionService = updateTransactionService;
const deleteTransactionService = async (userId, transactionId) => {
    const deleted = await transaction_model_1.default.findByIdAndDelete({
        _id: transactionId,
        userId,
    });
    if (!deleted)
        throw new app_error_1.NotFoundException("Transaction not found");
    return;
};
exports.deleteTransactionService = deleteTransactionService;
const bulkDeleteTransactionService = async (userId, transactionIds) => {
    const result = await transaction_model_1.default.deleteMany({
        _id: { $in: transactionIds },
        userId,
    });
    if (result.deletedCount === 0)
        throw new app_error_1.NotFoundException("No transations found");
    return {
        sucess: true,
        deletedCount: result.deletedCount,
    };
};
exports.bulkDeleteTransactionService = bulkDeleteTransactionService;
const bulkTransactionService = async (userId, transactions) => {
    try {
        const bulkOps = transactions.map((tx) => ({
            insertOne: {
                document: {
                    ...tx,
                    userId,
                    isRecurring: false,
                    nextRecurringDate: null,
                    recurringInterval: null,
                    lastProcesses: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
        }));
        const result = await transaction_model_1.default.bulkWrite(bulkOps, {
            ordered: true,
        });
        return {
            insertedCount: result.insertedCount,
            success: true,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.bulkTransactionService = bulkTransactionService;
const scanReceiptService = async (file) => {
    if (!file)
        throw new app_error_1.BadRequestException("No file uploaded");
    let worker;
    try {
        if (!file.path)
            throw new app_error_1.BadRequestException("failed to upload file");
        console.log("Processing receipt:", file.path);
        // Download the image from Cloudinary
        const responseData = await axios_1.default.get(file.path, {
            responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(responseData.data);
        // Initialize Tesseract OCR worker
        worker = await (0, tesseract_js_1.createWorker)("eng");
        // Extract text from image using OCR
        const { data: { text } } = await worker.recognize(imageBuffer);
        console.log("Extracted OCR text:", text);
        if (!text || text.trim().length === 0) {
            await worker.terminate();
            return {
                error: "Could not extract text from image",
            };
        }
        // Try using Google AI first for structured parsing
        try {
            const result = await google_ai_config_1.genAI.models.generateContent({
                model: google_ai_config_1.genAIModel,
                contents: [
                    (0, genai_1.createUserContent)([(0, prompt_1.receiptPrompt)(text)]),
                ],
                config: {
                    temperature: 0,
                    topP: 1,
                    responseMimeType: "application/json",
                },
            });
            await worker.terminate();
            const response = result.text;
            const cleanedText = response?.replace(/```(?:json)?\n?/g, "").trim();
            if (!cleanedText) {
                // Fallback to manual parsing
                console.log("AI returned empty response, using fallback parser");
                const parsedData = (0, ocr_parser_1.parseReceiptFromOCR)(text);
                if (!parsedData) {
                    return { error: "Could not extract receipt information" };
                }
                return {
                    ...parsedData,
                    receiptUrl: file.path,
                };
            }
            const data = JSON.parse(cleanedText);
            if (!data.amount || !data.date) {
                // Fallback to manual parsing
                console.log("AI missing required fields, using fallback parser");
                const parsedData = (0, ocr_parser_1.parseReceiptFromOCR)(text);
                if (!parsedData) {
                    return { error: "Receipt missing required information" };
                }
                return {
                    ...parsedData,
                    receiptUrl: file.path,
                };
            }
            return {
                title: data.title || "Receipt",
                amount: data.amount,
                date: data.date,
                description: data.description,
                category: data.category,
                paymentMethod: data.paymentMethod,
                type: data.type,
                receiptUrl: file.path,
            };
        }
        catch (aiError) {
            // If AI fails (quota exceeded, network error, etc.), use fallback parser
            await worker.terminate();
            console.log("AI service unavailable, using fallback OCR parser:", aiError.message);
            const parsedData = (0, ocr_parser_1.parseReceiptFromOCR)(text);
            if (!parsedData) {
                return {
                    error: "Could not parse receipt. AI service temporarily unavailable."
                };
            }
            return {
                ...parsedData,
                receiptUrl: file.path,
            };
        }
    }
    catch (error) {
        if (worker)
            await worker.terminate();
        console.error("Receipt scanning error:", error);
        return { error: "Receipt scanning service unavailable" };
    }
};
exports.scanReceiptService = scanReceiptService;
