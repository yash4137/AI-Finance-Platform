"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodEnum = exports.TransactionTypeEnum = exports.RecurringIntervalEnum = exports.TransactionStatusEnum = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const format_currency_1 = require("../utils/format-currency");
var TransactionStatusEnum;
(function (TransactionStatusEnum) {
    TransactionStatusEnum["PENDING"] = "PENDING";
    TransactionStatusEnum["COMPLETED"] = "COMPLETED";
    TransactionStatusEnum["FAILED"] = "FAILED";
})(TransactionStatusEnum || (exports.TransactionStatusEnum = TransactionStatusEnum = {}));
var RecurringIntervalEnum;
(function (RecurringIntervalEnum) {
    RecurringIntervalEnum["DAILY"] = "DAILY";
    RecurringIntervalEnum["WEEKLY"] = "WEEKLY";
    RecurringIntervalEnum["MONTHLY"] = "MONTHLY";
    RecurringIntervalEnum["YEARLY"] = "YEARLY";
})(RecurringIntervalEnum || (exports.RecurringIntervalEnum = RecurringIntervalEnum = {}));
var TransactionTypeEnum;
(function (TransactionTypeEnum) {
    TransactionTypeEnum["INCOME"] = "INCOME";
    TransactionTypeEnum["EXPENSE"] = "EXPENSE";
})(TransactionTypeEnum || (exports.TransactionTypeEnum = TransactionTypeEnum = {}));
var PaymentMethodEnum;
(function (PaymentMethodEnum) {
    PaymentMethodEnum["CARD"] = "CARD";
    PaymentMethodEnum["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethodEnum["MOBILE_PAYMENT"] = "MOBILE_PAYMENT";
    PaymentMethodEnum["AUTO_DEBIT"] = "AUTO_DEBIT";
    PaymentMethodEnum["CASH"] = "CASH";
    PaymentMethodEnum["OTHER"] = "OTHER";
})(PaymentMethodEnum || (exports.PaymentMethodEnum = PaymentMethodEnum = {}));
;
const transactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(TransactionTypeEnum),
        required: true
    },
    amount: {
        type: Number,
        required: true,
        set: (value) => (0, format_currency_1.convertToCents)(value),
        get: (value) => (0, format_currency_1.convertToDollarUnit)(value),
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    receiptUrl: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringInterval: {
        type: String,
        enum: Object.values(RecurringIntervalEnum),
        default: null,
    },
    nextRecurringDate: {
        type: Date,
        default: null,
    },
    lastProcessed: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatusEnum),
        default: TransactionStatusEnum.COMPLETED,
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethodEnum),
        default: PaymentMethodEnum.CASH,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
});
const TransactionModel = mongoose_1.default.model("Transaction", transactionSchema);
exports.default = TransactionModel;
