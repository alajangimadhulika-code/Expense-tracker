import OpenAI from 'openai';
import { cleanOcrText } from './ocr.js';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const detectCurrency = (text) => {
  if (!text) return 'USD';
  const indicators = ['₹', 'GST', 'CGST', 'SGST', 'INR', 'Rs.'];
  for (const ind of indicators) {
    if (text.includes(ind)) return 'INR';
  }
  return 'USD';
};

const buildReceiptSummary = (data) => {
  const vendor = data.vendor || 'Unknown vendor';
  const date = data.date || 'unknown date';
  const time = data.time ? ` at ${data.time}` : '';
  const paymentMethod = data.paymentMethod || 'unknown payment method';
  const category = data.category || 'other';
  const currency = data.currency === 'INR' ? '₹' : '$';
  const lines = [
    `Receipt from ${vendor} on ${date}${time}.`,
    `Payment method: ${paymentMethod}. Category: ${category}.`
  ];

  if (data.items && data.items.length) {
    lines.push('Items:');
    data.items.forEach((item) => {
      const description = item.description || 'Unknown item';
      const quantity = item.quantity || 1;
      const price = formatAmount(item.price);
      lines.push(`- ${quantity} × ${description} — ${currency}${price}`);
    });
  }

  lines.push(`\nSubtotal: ${currency}${formatAmount(data.subtotal || 0)}`);
  const taxTotal = (data.taxes || []).reduce((s, t) => s + Number(t.amount || 0), 0) || data.tax || 0;
  if (taxTotal) lines.push(`Total Tax: ${currency}${formatAmount(taxTotal)}`);
  lines.push(`Grand Total: ${currency}${formatAmount(data.total || 0)}`);
  return lines.join('\n');
};

const fallbackParse = (text) => {
  const normalized = text.replace(/\r/g, '\n').replace(/\t/g, ' ').trim();
  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const currency = detectCurrency(normalized);

  const findValue = (pattern) => {
    const match = normalized.match(pattern);
    if (!match) return '';
    // if regex has a capture group, return it; otherwise return full match
    if (match[1] !== undefined && match[1] !== null) return String(match[1]).trim();
    return String(match[0]).trim();
  };

  const total = parseFloat(findValue(/total(?: amount)?[:\s]*[₹$]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)) || 0;
  // single-line tax fallback
  const tax = parseFloat(findValue(/(?:tax|gst|cgst|sgst)[:\s]*[₹$]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)) || 0;
  const date = findValue(/(\d{4}[\-/]\d{2}[\-/]\d{2}|\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4})/);
  const time = findValue(/(\d{1,2}:\d{2}(?:\s?[APap][Mm])?)/);
  const paymentMethod = findValue(/(cash|credit card|debit card|visa|mastercard|amex|upi|google pay|phonepe|card)[:\s]*/i) || 'Unknown';
  const vendor = lines[0] || 'Receipt store';

  // extract invoice number, customer name, gstin
  const invoiceNumber = findValue(/invoice\s*(?:no|number|#)?[:\s]*([^\n]+)/i) || findValue(/inv[-\s]*\d+[A-Za-z0-9-]*/i);
  const customerName = findValue(/customer[:\s]*([^\n]+)/i);
  const gstin = findValue(/gstin[:\s]*([A-Za-z0-9]{15})/i) || '';

  // Item extraction: support patterns like "4 x Veg Biryani — ₹360.00" or "4 Veg Biryani 360"
  const itemPattern1 = /(\d+)\s*[x×]\s*(.*?)\s*[—-]?\s*[₹$]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i;
  const itemPattern2 = /(.*?)\s+(\d+)\s*[₹$]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i;

  const items = [];
  for (const line of lines) {
    let m = line.match(itemPattern1);
    if (m) {
      const qty = Number(m[1]);
      const captured = Number(m[3]);
      if (qty > 1) {
        // assume captured value is a line total for safety; compute per-unit
        const lineTotal = captured;
        const unitPrice = Number((lineTotal / qty).toFixed(2));
        items.push({ description: m[2].trim(), quantity: qty, price: unitPrice, total: lineTotal, line_total: lineTotal });
      } else {
        items.push({ description: m[2].trim(), quantity: qty, price: captured, total: captured });
      }
      continue;
    }
    m = line.match(itemPattern2);
    if (m) {
      // require either an explicit currency symbol, an 'x' quantity marker, or a decimal-style price
      const priceStr = m[3] || '';
      const maybeQty = Number(m[2]);
      const hasCurrencySym = /[₹$]/.test(line);
      const hasQtyMarker = /[x×]/.test(line);
      const hasDecimalPrice = /\d+\.\d{1,2}/.test(priceStr);
      if (!Number.isNaN(maybeQty) && maybeQty > 0 && m[1].length < 60 && (hasCurrencySym || hasQtyMarker || hasDecimalPrice)) {
        const captured = Number(priceStr);
        if (maybeQty > 1) {
          const lineTotal = captured;
          const unitPrice = Number((lineTotal / maybeQty).toFixed(2));
          items.push({ description: m[1].trim(), quantity: maybeQty, price: unitPrice, total: lineTotal, line_total: lineTotal });
        } else {
          items.push({ description: m[1].trim(), quantity: maybeQty, price: captured, total: captured });
        }
      }
    }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  // extract tax lines like "CGST (2.5%) — ₹89.75" or "SGST — ₹89.75"
  const taxes = [];
  // prefer currency amounts on same line (₹ or $), avoid capturing percent numbers
  for (const line of lines) {
    const taxNameMatch = line.match(/\b(CGST|SGST|IGST|GST)\b/i);
    if (!taxNameMatch) continue;
    let amount = null;
    const currencyAmountMatch = line.match(/[₹$]\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    if (currencyAmountMatch) {
      amount = Number(currencyAmountMatch[1]);
    } else {
      // try to find a decimal number not immediately followed by %
      const decimalMatch = line.match(/([0-9]+(?:\.[0-9]{1,2})?)(?!\s*%)/);
      if (decimalMatch) {
        const val = Number(decimalMatch[1]);
        // if that decimal equals a percent present earlier, try to find amount after percent
        const percentMatch = line.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
        if (percentMatch && Number(percentMatch[1]) === val) {
          const afterPercentMatch = line.match(/%[^\d₹$]*[₹$]?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
          if (afterPercentMatch) amount = Number(afterPercentMatch[1]);
        } else {
          amount = val;
        }
      }
    }
    if (amount != null) taxes.push({ name: taxNameMatch[1].toUpperCase(), amount });
  }

  const taxTotal = taxes.reduce((s, t) => s + Number(t.amount || 0), 0) || tax;

  const parsed = {
    vendor,
    date,
    time,
    paymentMethod,
    category: 'other',
    currency,
    items: items.length ? items : [{ description: 'Unknown item', quantity: 1, price: 0, total: 0 }],
    subtotal,
    taxes: taxes.length ? taxes : (tax ? [{ name: 'tax', amount: tax }] : []),
    tax: taxTotal,
    total: total || subtotal + taxTotal,
    invoice_number: invoiceNumber,
    customer_name: customerName,
    gstin: gstin
  };

  return {
    ...parsed,
    summary: buildReceiptSummary(parsed)
  };
};

export async function parseReceiptText(rawText) {
  const cleaned = cleanOcrText(rawText || '');
  console.log('AI parser received cleaned OCR text (len):', cleaned.length);
  if (!openai) {
    return fallbackParse(cleaned);
  }

  const currencyGuess = detectCurrency(cleaned);

  const prompt = `Extract complete structured receipt information from the OCR text below.\n\nRules:\n- Detect Indian Rupee currency and use INR/₹ when detected.\n- Always return valid JSON only following the schema shown.\n- Do not hallucinate data. If missing, use empty string or 0.\n- Extract items with quantity, name, and price as numbers.\n- Extract subtotal, taxes (as array of {name, amount}), and total.\n- Extract payment mode, invoice number, customer name, GSTIN if present.\n\nReturn JSON exactly in this format:\n{\n  "store_name": "",\n  "date": "",\n  "time": "",\n  "invoice_number": "",\n  "customer_name": "",\n  "payment_mode": "",\n  "gstin": "",\n  "currency": "INR|USD",\n  "items": [ { "quantity": 1, "name": "", "price": 0 } ],\n  "subtotal": 0,\n  "taxes": [ { "name": "CGST|SGST|IGST|tax", "amount": 0 } ],\n  "total": 0\n}\n\nOCR TEXT:\n${cleaned}\n\nUse currency: ${currencyGuess}.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'system', content: 'You are a strict JSON extractor for receipts.' }, { role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 800
    });
    const content = response.choices?.[0]?.message?.content || '';
    console.log('AI raw content length:', content.length);
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error('OpenAI JSON parse error:', parseErr);
      // return fallback parse but include debug info
      const fb = fallbackParse(cleaned);
      fb.debug = { openai_raw: content, openai_error: String(parseErr) };
      return fb;
    }
    const currency = parsed.currency || detectCurrency(content || cleaned);
    const expense = {
      vendor: parsed.store_name || parsed.vendor || parsed.store || '',
      date: parsed.date || '',
      time: parsed.time || '',
      paymentMethod: parsed.payment_mode || parsed.paymentMethod || '',
      category: 'other',
      currency,
      subtotal: Number(parsed.subtotal || 0),
      taxes: parsed.taxes || [],
      tax: parsed.taxes ? parsed.taxes.reduce((s, t) => s + Number(t.amount || 0), 0) : Number(parsed.tax || 0),
      total: Number(parsed.total || 0),
      items: (parsed.items || []).map((item) => ({
        description: item.name || item.description || '',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        total: Number(item.price || 0) * Number(item.quantity || 1)
      })),
      gstin: parsed.gstin || '' ,
      invoice_number: parsed.invoice_number || '' ,
      customer_name: parsed.customer_name || ''
    };
    const result = {
      ...expense,
      summary: parsed.summary || buildReceiptSummary(expense)
    };
    // attach debug info (non-sensitive)
    result.debug = { openai_raw: content };
    return result;
  } catch (err) {
    console.error('OpenAI parse error:', err);
    const fb = fallbackParse(cleaned);
    fb.debug = { openai_error: String(err) };
    return fb;
  }
}
