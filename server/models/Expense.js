import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const TaxSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  amount: { type: Number, default: 0 }
}, { _id: false });

const ExpenseSchema = new mongoose.Schema(
  {
    vendor: { type: String, trim: true },
    date: { type: String, trim: true },
    time: { type: String, trim: true },
    items: { type: [ItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true },
    category: { type: String, trim: true },
    currency: { type: String, trim: true, default: 'USD' },
    taxes: { type: [TaxSchema], default: [] },
    invoice_number: { type: String, trim: true },
    customer_name: { type: String, trim: true },
    gstin: { type: String, trim: true },
    rawText: { type: String },
    summary: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
