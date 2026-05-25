import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.resolve(__dirname, '../data/expenses.json');

async function ensureStorage() {
  try {
    await fs.access(storagePath);
  } catch {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, JSON.stringify({ expenses: [] }, null, 2), 'utf-8');
  }
}

export async function readExpensesFromFile() {
  await ensureStorage();
  const raw = await fs.readFile(storagePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data.expenses) ? data.expenses : [];
}

export async function saveExpenseToFile(payload) {
  const expenses = await readExpensesFromFile();
  const expense = {
    _id: payload._id || crypto.randomUUID(),
    vendor: payload.vendor || '',
    date: payload.date || '',
    time: payload.time || '',
    paymentMethod: payload.paymentMethod || '',
    category: payload.category || 'other',
    currency: payload.currency || 'USD',
    subtotal: Number(payload.subtotal || 0),
    tax: Number(payload.tax || 0),
    total: Number(payload.total || 0),
    taxes: Array.isArray(payload.taxes) ? payload.taxes.map((tax) => ({ name: tax.name || '', amount: Number(tax.amount || 0) })) : [],
    invoice_number: payload.invoice_number || '',
    customer_name: payload.customer_name || '',
    gstin: payload.gstin || '',
    rawText: payload.rawText || '',
    summary: payload.summary || '',
    items: Array.isArray(payload.items)
      ? payload.items.map((item) => ({
          description: item.description || '',
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          total: Number(item.total || 0)
        }))
      : [],
    createdAt: payload.createdAt || new Date().toISOString()
  };
  expenses.unshift(expense);
  await fs.writeFile(storagePath, JSON.stringify({ expenses }, null, 2), 'utf-8');
  return expense;
}
