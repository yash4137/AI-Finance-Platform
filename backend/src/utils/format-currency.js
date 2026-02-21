"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCents = convertToCents;
exports.convertToDollarUnit = convertToDollarUnit;
exports.formatCurrency = formatCurrency;
// Convert rupees to paise when saving
function convertToCents(amount) {
    return Math.round(amount * 100);
}
// Convert paise to rupees when retrieving
function convertToDollarUnit(amount) {
    return amount / 100;
}
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);
}
