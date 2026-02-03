import axios from "axios";
import { createWorker } from "tesseract.js";
import TransactionModel, {
    TransactionTypeEnum,
} from "../models/transaction.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { calculateNextOccurrence } from "../utils/helper";
import {
    CreateTransactionType,
    UpdateTransactionType,
} from "../validators/transaction.validator";
import { genAI, genAIModel } from "../config/google-ai.config";
import { createUserContent } from "@google/genai";
import { receiptPrompt } from "../utils/prompt";
import { parseReceiptFromOCR } from "../utils/ocr-parser";

export const createTransactionService = async (
    body: CreateTransactionType,
    userId: string
) => {
    let nextRecurringDate: Date | undefined;
    const currentDate = new Date();

    if (body.isRecurring && body.recurringInterval) {
        const calulatedDate = calculateNextOccurrence(
            body.date,
            body.recurringInterval
        );

        nextRecurringDate =
            calulatedDate < currentDate
                ? calculateNextOccurrence(currentDate, body.recurringInterval)
                : calulatedDate;
    }

    const transaction = await TransactionModel.create({
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

export const getAllTransactionService = async (
    userId: string,
    filters: {
        keyword?: string;
        type?: keyof typeof TransactionTypeEnum;
        recurringStatus?: "RECURRING" | "NON_RECURRING";
    },
    pagination: {
        pageSize: number;
        pageNumber: number;
    }
) => {
    const { keyword, type, recurringStatus } = filters;

    const filterConditions: Record<string, any> = {
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
        } else if (recurringStatus === "NON_RECURRING") {
            filterConditions.isRecurring = false;
        }
    }

    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    const [transations, totalCount] = await Promise.all([
        TransactionModel.find(filterConditions)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 }),
        TransactionModel.countDocuments(filterConditions),
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

export const getTransactionByIdService = async (
    userId: string,
    transactionId: string
) => {
    const transaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction) throw new NotFoundException("Transaction not found");

    return transaction;
};

export const duplicateTransactionService = async (
    userId: string,
    transactionId: string
) => {
    const transaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction) throw new NotFoundException("Transaction not found");

    const duplicated = await TransactionModel.create({
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

export const updateTransactionService = async (
    userId: string,
    transactionId: string,
    body: UpdateTransactionType
) => {
    const existingTransaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!existingTransaction)
        throw new NotFoundException("Transaction not found");

    const now = new Date();
    const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;

    const date =
        body.date !== undefined ? new Date(body.date) : existingTransaction.date;

    const recurringInterval =
        body.recurringInterval || existingTransaction.recurringInterval;

    let nextRecurringDate: Date | undefined;

    if (isRecurring && recurringInterval) {
        const calulatedDate = calculateNextOccurrence(date, recurringInterval);

        nextRecurringDate =
            calulatedDate < now
                ? calculateNextOccurrence(now, recurringInterval)
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

export const deleteTransactionService = async (
    userId: string,
    transactionId: string
) => {
    const deleted = await TransactionModel.findByIdAndDelete({
        _id: transactionId,
        userId,
    });
    if (!deleted) throw new NotFoundException("Transaction not found");

    return;
};

export const bulkDeleteTransactionService = async (
    userId: string,
    transactionIds: string[]
) => {
    const result = await TransactionModel.deleteMany({
        _id: { $in: transactionIds },
        userId,
    });

    if (result.deletedCount === 0)
        throw new NotFoundException("No transations found");

    return {
        sucess: true,
        deletedCount: result.deletedCount,
    };
};

export const bulkTransactionService = async (
    userId: string,
    transactions: CreateTransactionType[]
) => {
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

        const result = await TransactionModel.bulkWrite(bulkOps, {
            ordered: true,
        });

        return {
            insertedCount: result.insertedCount,
            success: true,
        };
    } catch (error) {
        throw error;
    }
};

export const scanReceiptService = async (
    file: Express.Multer.File | undefined
) => {
    if (!file) throw new BadRequestException("No file uploaded");

    let worker;
    try {
        if (!file.path) throw new BadRequestException("failed to upload file");

        console.log("Processing receipt:", file.path);

        // Download the image from Cloudinary
        const responseData = await axios.get(file.path, {
            responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(responseData.data);

        // Initialize Tesseract OCR worker
        worker = await createWorker("eng");

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
            const result = await genAI.models.generateContent({
                model: genAIModel,
                contents: [
                    createUserContent([receiptPrompt(text)]),
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
                const parsedData = parseReceiptFromOCR(text);

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
                const parsedData = parseReceiptFromOCR(text);

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
        } catch (aiError: any) {
            // If AI fails (quota exceeded, network error, etc.), use fallback parser
            await worker.terminate();

            console.log("AI service unavailable, using fallback OCR parser:", aiError.message);

            const parsedData = parseReceiptFromOCR(text);

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
    } catch (error) {
        if (worker) await worker.terminate();
        console.error("Receipt scanning error:", error);
        return { error: "Receipt scanning service unavailable" };
    }
};