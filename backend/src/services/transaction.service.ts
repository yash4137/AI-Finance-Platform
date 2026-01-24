import TransactionModel from "../models/transaction.model";
import { calculateNextOccurence } from "../utils/helper";
import { CreateTransactionType } from "../validators/transaction.validator";

export const createTransactionService = async ( body:
    CreateTransactionType, userId: string) => {
        let nextRecurringDate: Date | undefined;
        const currentDate = new Date();

        if (body.isRecurring && body.recurringInterval) {
            const calculatedDate = calculateNextOccurence(
                body.date,
                body.recurringInterval
            );

            nextRecurringDate = 
                calculatedDate < currentDate
                ? calculateNextOccurence(
                    currentDate,
                    body.recurringInterval
                )
                : calculatedDate;
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