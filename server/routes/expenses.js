import express from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import { upload } from '../utils/upload.js';
import { extractText, cleanOcrText } from '../utils/ocr.js';
import { parseReceiptText } from '../utils/aiParser.js';
import { readExpensesFromFile, saveExpenseToFile } from '../utils/localStorage.js';

const router = express.Router();
const useMongo = () => mongoose.connection.readyState === 1;

router.post('/parse', upload.single('receipt'), async (req, res) => {
  try {
    let ocrRaw = '';

    if (req.file) {
      ocrRaw = await extractText(req.file.buffer);
    } else if (req.body && req.body.text) {
      ocrRaw = req.body.text;
    } else {
      return res.status(400).json({ error: 'Receipt image or text is required' });
    }

    console.log('Route /parse: OCR raw length:', (ocrRaw || '').length);
    const cleaned = cleanOcrText(ocrRaw || '');
    console.log('Route /parse: OCR cleaned length:', cleaned.length);
    const expense = await parseReceiptText(cleaned);
    const response = { ocr_raw: ocrRaw, ocr_cleaned: cleaned, expense, summary: expense.summary };
    if (expense && expense.debug) response.debug = expense.debug;
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to parse receipt' });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const payload = req.body;

    if (useMongo()) {
      const expense = new Expense({
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
        items: (payload.items || []).map((item) => ({
          description: item.description || '',
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          total: Number(item.total || 0)
        }))
      });
      await expense.save();
      return res.status(201).json(expense);
    }

    const expense = await saveExpenseToFile(payload);
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to save expense' });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const expenses = useMongo()
      ? await Expense.find().sort({ createdAt: -1 }).lean()
      : await readExpensesFromFile();
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch expenses' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const expenses = useMongo() ? await Expense.find().lean() : await readExpensesFromFile();
    const categoryTotals = expenses.reduce((acc, expense) => {
      const key = expense.category || 'other';
      acc[key] = (acc[key] || 0) + Number(expense.total || 0);
      return acc;
    }, {});

    const monthlyTotals = expenses.reduce((acc, expense) => {
      const month = expense.date ? new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
      const found = acc.find((item) => item.label === month);
      if (found) {
        found.total += Number(expense.total || 0);
      } else {
        acc.push({ label: month, total: Number(expense.total || 0) });
      }
      return acc;
    }, []);

    monthlyTotals.sort((a, b) => new Date(a.label) - new Date(b.label));

    const overallTotal = expenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0);
    res.json({ categoryTotals, monthlyTotals, overallTotal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to compute analytics' });
  }
});

export default router;
