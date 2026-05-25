import { PlusCircle, Save } from 'lucide-react';

export default function ExpenseForm({ expense, setExpense, onSave, onDownloadCSV, onDownloadPDF, loading }) {
  const updateField = (field, value) => {
    setExpense((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setExpense((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'price' || field === 'quantity') {
        const price = Number(items[index].price || 0);
        const qty = Number(items[index].quantity || 1);
        items[index].total = (price * qty).toFixed(2);
      }
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setExpense((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: '', total: '' }]
    }));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Extracted expense</p>
          <h2 className="text-2xl font-semibold">Review and edit details</h2>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} /> Save Expense
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Store / Shop</span>
          <input
            value={expense.vendor}
            onChange={(e) => updateField('vendor', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Category</span>
          <input
            value={expense.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder="food, travel, shopping, medical"
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date</span>
          <input
            type="date"
            value={expense.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Time</span>
          <input
            type="time"
            value={expense.time}
            onChange={(e) => updateField('time', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Payment Method</span>
          <input
            value={expense.paymentMethod}
            onChange={(e) => updateField('paymentMethod', e.target.value)}
            placeholder="Credit card, Cash, UPI"
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Subtotal</span>
          <input
            type="number"
            value={expense.subtotal}
            onChange={(e) => updateField('subtotal', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tax / GST</span>
          <input
            type="number"
            value={expense.tax}
            onChange={(e) => updateField('tax', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Amount</span>
          <input
            type="number"
            value={expense.total}
            onChange={(e) => updateField('total', e.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Line items</p>
            <h3 className="text-lg font-semibold">Purchased items</h3>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <PlusCircle size={16} /> Add item
          </button>
        </div>
        <div className="space-y-4">
          {expense.items.map((item, index) => (
            <div key={index} className="grid gap-4 md:grid-cols-4">
              <input
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Item description"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <input
                type="number"
                value={item.quantity}
                min="1"
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', e.target.value)}
                placeholder="Price"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <input
                value={item.total}
                readOnly
                placeholder="Line total"
                className="rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          ))}
        </div>
      </div>

      {expense.taxes && expense.taxes.length ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Taxes</p>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {expense.taxes.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="capitalize">{t.name}</div>
                <div className="font-medium">{expense.currency === 'INR' ? `₹${Number(t.amount).toFixed(2)}` : `$${Number(t.amount).toFixed(2)}`}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onDownloadCSV} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-700">
          <Save size={16} /> Export CSV
        </button>
        <button onClick={onDownloadPDF} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
          <Save size={16} /> Export PDF
        </button>
      </div>
    </div>
  );
}
