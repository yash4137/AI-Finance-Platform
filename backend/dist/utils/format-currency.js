"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCents = convertToCents;
exports.convertToDollarUnit = convertToDollarUnit;
function convertToCents(amount) {
    return Math.round(amount * 100);
}
function convertToDollarUnit(amount) {
    return amount / 100;
}
