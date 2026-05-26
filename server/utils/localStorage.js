import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION !== undefined;
const storagePath = isVercel
  ? '/tmp/expenses.json'
  : path.resolve(__dirname, '../data/expenses.json');

let inMemoryExpenses = [];

async function ensureStorage() {
  try {
    await fs.access(storagePath);
  } catch {
    try {
      await fs.mkdir(path.dirname(storagePath), { recursive: true });
      await fs.writeFile(storagePath, JSON.stringify({ expenses: [] }, null, 2), 'utf-8');
    } catch (writeError) {
      console.warn('Could not create storage file on disk. Using in-memory fallback:', writeError.message);
    }
  }
}

export async function readExpensesFromFile() {
  try {
    await ensureStorage();
    const raw = await fs.readFile(storagePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.expenses) ? data.expenses : [];
  } catch (err) {
    console.warn('Falling back to in-memory storage because reading file failed:', err.message);
    return inMemoryExpenses;
  }
}

export async function saveExpenseToFile(payload) {
  let expenses = [];
  let useInMemory = false;
  try {
    expenses = await readExpensesFromFile();
  } catch (err) {
    expenses = inMemoryExpenses;
    useInMemory = true;
  }

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
  inMemoryExpenses = expenses;

  if (!useInMemory) {
    try {
      await fs.writeFile(storagePath, JSON.stringify({ expenses }, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn('Failed to write expense to disk, kept in-memory:', writeErr.message);
    }
  }

  return expense;
}
