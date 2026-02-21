"use strict";
/**
 * Fallback OCR text parser for extracting transaction details
 * Used when AI service is unavailable or quota exceeded
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReceiptFromOCR = void 0;
const parseReceiptFromOCR = (ocrText) => {
    if (!ocrText || ocrText.trim().length === 0) {
        return null;
    }
    console.log("🔍 Parsing OCR text for receipt data...");
    const result = {
        type: "EXPENSE",
    };
    // Extract merchant/title (usually first few lines)
    const titleMatch = ocrText.match(/(?:^|\n)\s*([A-Z][A-Z\s&,.']+(?:STORE|MARKET|SHOP|RESTAURANT|CAFE|COFFEE|SUPERMARKET|MALL)?)/i);
    if (titleMatch) {
        result.title = titleMatch[1].trim();
    }
    // Extract total amount - look for common patterns
    // Priority order: TOTAL PAID > AMOUNT > GRAND TOTAL > TOTAL (avoid SUBTOTAL)
    const amountPatterns = [
        /TOTAL\s+PAID[\s:~\-=]*[€$£]?\s*([\d\s,]+\.?\d{0,2})/im,
        /AMOUNT[\s:~\-=]*[€$£]?\s*([\d\s,]+\.?\d{0,2})/im,
        /GRAND\s+TOTAL[\s:~\-=]*[€$£]?\s*([\d\s,]+\.?\d{0,2})/im,
        /(?:^|\n)\s*TOTAL[\s:~\-=]*[€$£]?\s*([\d\s,]+\.?\d{0,2})/im,
        /[€$£]\s*([\d\s,]+\.\d{2})(?=\s*(?:\n|[=\-~]|Thank|$))/m,
    ];
    for (const pattern of amountPatterns) {
        const match = ocrText.match(pattern);
        if (match) {
            // Remove all commas, spaces, and other separators from amount
            const amountStr = match[1].replace(/[,\s]/g, "");
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0) {
                // Skip if the matched line contains "SUBTOTAL" or "VAT"
                const fullMatch = match[0].toLowerCase();
                if (!fullMatch.includes("subtotal") && !fullMatch.includes("vat")) {
                    result.amount = amount;
                    console.log(`💰 Found amount: ${amount} from text: "${match[0].trim()}"`);
                    break;
                }
            }
        }
    }
    // Extract date - multiple formats
    const datePatterns = [
        /date[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
        /date[\s:]*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[,\s]+\d{4})/i,
        /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[-\/,]\s*\d{4})/i,
        /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
    ];
    for (const pattern of datePatterns) {
        const match = ocrText.match(pattern);
        if (match) {
            const dateStr = match[1];
            const parsedDate = parseDate(dateStr);
            if (parsedDate) {
                result.date = parsedDate;
                break;
            }
        }
    }
    // Extract payment method
    const paymentPatterns = [
        { pattern: /visa|credit\s*card/i, method: "CARD" },
        { pattern: /mastercard/i, method: "CARD" },
        { pattern: /debit/i, method: "CARD" },
        { pattern: /cash/i, method: "CASH" },
        { pattern: /credit/i, method: "CARD" },
        { pattern: /bank\s*transfer/i, method: "BANK_TRANSFER" },
    ];
    for (const { pattern, method } of paymentPatterns) {
        if (pattern.test(ocrText)) {
            result.paymentMethod = method;
            break;
        }
    }
    // Infer category from merchant name or keywords
    if (result.title) {
        result.category = inferCategory(result.title, ocrText);
    }
    // Create description from items or merchant
    const items = extractItems(ocrText);
    if (items.length > 0) {
        result.description = items.slice(0, 3).join(", ");
    }
    else if (result.title) {
        result.description = `Purchase from ${result.title}`;
    }
    // Only return if we have at least amount and date
    if (result.amount && result.date) {
        console.log("✅ Successfully parsed receipt:", result);
        return result;
    }
    console.log("❌ Failed to parse receipt - missing required fields:", {
        hasAmount: !!result.amount,
        hasDate: !!result.date,
        amount: result.amount,
        date: result.date
    });
    return null;
};
exports.parseReceiptFromOCR = parseReceiptFromOCR;
/**
 * Parse various date formats to ISO format
 */
const parseDate = (dateStr) => {
    try {
        // Clean the date string
        dateStr = dateStr.trim();
        // Handle format: MM/DD/YYYY or DD/MM/YYYY
        const slashMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
        if (slashMatch) {
            let [, part1, part2, year] = slashMatch;
            // Convert 2-digit year to 4-digit
            if (year.length === 2) {
                const yearNum = parseInt(year);
                year = yearNum > 50 ? `19${year}` : `20${year}`;
            }
            // Try MM/DD/YYYY first, then DD/MM/YYYY as fallback
            let month = parseInt(part1);
            let day = parseInt(part2);
            // If month > 12, swap (it's likely DD/MM format)
            if (month > 12 && day <= 12) {
                [month, day] = [day, month];
            }
            if (month <= 12 && day <= 31 && month > 0 && day > 0) {
                const date = new Date(parseInt(year), month - 1, day);
                if (!isNaN(date.getTime())) {
                    // Use local date formatting to avoid timezone conversion issues
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
        }
        // Handle format: April 9/2025 or similar
        const monthNames = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const monthMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})[-\/,\s]+(\d{4})/i);
        if (monthMatch) {
            const [, monthStr, day, year] = monthMatch;
            const month = monthNames[monthStr.toLowerCase().substring(0, 3)];
            const date = new Date(parseInt(year), month, parseInt(day));
            if (!isNaN(date.getTime())) {
                // Use local date formatting to avoid timezone conversion issues
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }
        return null;
    }
    catch {
        return null;
    }
};
/**
 * Infer transaction category from merchant name and text
 */
const inferCategory = (title, text) => {
    const categoryKeywords = {
        groceries: ["supermarket", "grocery", "food", "market", "walmart", "tesco", "aldi"],
        dining: ["restaurant", "cafe", "coffee", "bar", "pizza", "burger", "starbucks"],
        transport: ["taxi", "uber", "lyft", "bus", "train", "parking", "fuel", "gas"],
        shopping: ["store", "shop", "mall", "retail", "amazon"],
        entertainment: ["cinema", "movie", "theater", "game", "netflix", "spotify"],
        health: ["pharmacy", "medical", "hospital", "doctor", "clinic", "health"],
        utilities: ["electric", "water", "gas", "internet", "phone", "utility"],
        electronics: ["apple", "samsung", "electronics", "tech", "computer", "laptop"],
    };
    const combinedText = `${title} ${text}`.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => combinedText.includes(keyword))) {
            return category;
        }
    }
    return "other";
};
/**
 * Extract item names from receipt text
 */
const extractItems = (text) => {
    const items = [];
    const lines = text.split("\n");
    for (const line of lines) {
        // Look for lines with product names and prices
        // Usually format: "Item Name    $XX.XX" or "Item Name    1    $XX.XX"
        const itemMatch = line.match(/^([A-Za-z][A-Za-z0-9\s\-\.()]+)\s+(?:\d+\s+)?[€$£]?\s*\d+\.\d{2}/);
        if (itemMatch) {
            const itemName = itemMatch[1].trim();
            if (itemName.length > 2 && itemName.length < 50) {
                items.push(itemName);
            }
        }
    }
    return items;
};
