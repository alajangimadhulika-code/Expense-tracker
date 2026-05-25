import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Moon, Sun, UploadCloud, Search, FileText, Download, Save, CheckCircle2 } from 'lucide-react';
import ReceiptUploader from './components/ReceiptUploader.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseHistory from './components/ExpenseHistory.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';

const defaultExpense = {
  vendor: '',
  date: '',
  time: '',
  paymentMethod: '',
  category: '',
  subtotal: '',
  tax: '',
  total: '',
  rawText: '',
  summary: '',
  items: [{ description: '', quantity: 1, price: '', total: '' }]
};

function App() {
  const [theme, setTheme] = useState('light');
  const [expense, setExpense] = useState(defaultExpense);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Upload a receipt to extract expense details.');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const categories = useMemo(() => ['all', 'food', 'travel', 'shopping', 'medical', 'utilities', 'other'], []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/expenses');
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleParseReceipt = async (file) => {
    setLoading(true);
    setMessage('Recognizing receipt text and parsing expense details...');
    const form = new FormData();
    form.append('receipt', file);

    try {
      const { data } = await axios.post('/api/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // API now returns ocr_raw, ocr_cleaned, expense, summary, and optional debug
      const serverExpense = data.expense || {};
      const parsedExpense = {
        ...defaultExpense,
        ...serverExpense,
        items: serverExpense.items && serverExpense.items.length ? serverExpense.items : defaultExpense.items,
        rawText: data.ocr_cleaned || data.ocr_raw || ''
      };
      // attach debug info if present
      if (data.debug) parsedExpense.debug = data.debug;
      setExpense({
        ...parsedExpense,
        summary: data.summary || parsedExpense.summary || generateSummary(parsedExpense)
      });
      if (parsedExpense.debug) {
        setMessage('Parsed with warnings — check debug panel below.');
      } else {
        setMessage('Expense details extracted. Review and save to history.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Failed to parse receipt. Try another image or check the backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    setLoading(true);
    try {
      const payload = {
        ...expense,
        total: expense.total || expense.items.reduce((sum, item) => sum + Number(item.total || item.price || 0) * Number(item.quantity || 1), 0),
        summary: expense.summary || generateSummary(expense)
      };
      await axios.post('/api/expenses', payload);
      setMessage('Expense saved successfully. History and analytics updated.');
      setExpense(defaultExpense);
      fetchHistory();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setMessage('Unable to save expense at the moment.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = (data) => {
    const lines = [`Store: ${data.vendor}`, `Date: ${data.date}${data.time ? ` ${data.time}` : ''}`];
    lines.push('Items:');
    data.items.forEach((item) => {
      if (item.description) {
        lines.push(`- ${item.description} x${item.quantity} @ ${item.price}`);
      }
    });
    lines.push(`Tax: ${data.tax || 'N/A'}`);
    lines.push(`Total: ${data.total}`);
    lines.push(`Payment: ${data.paymentMethod}`);
    lines.push(`Category: ${data.category}`);
    return lines.join('\n');
  };

  const handleDownloadCSV = () => {
    const header = ['Vendor', 'Date', 'Time', 'Category', 'Payment', 'Subtotal', 'Tax', 'Total', 'Item', 'Qty', 'Price', 'LineTotal'];
    const rows = expense.items.length
      ? expense.items.map((item) => [
          expense.vendor,
          expense.date,
          expense.time,
          expense.category,
          expense.paymentMethod,
          expense.subtotal,
          expense.tax,
          expense.total,
          item.description,
          item.quantity,
          item.price,
          item.total
        ])
      : [[expense.vendor, expense.date, expense.time, expense.category, expense.paymentMethod, expense.subtotal, expense.tax, expense.total, '', '', '', '']];

    const csv = [header.join(','), ...rows.map((row) => row.map((cell) => `"${cell ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-${expense.vendor || 'receipt'}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text('Expense Summary', 15, 20);
    pdf.setFontSize(11);
    pdf.text(`Store: ${expense.vendor}`, 15, 30);
    pdf.text(`Date: ${expense.date} ${expense.time}`, 15, 36);
    pdf.text(`Category: ${expense.category}`, 15, 42);
    pdf.text(`Payment: ${expense.paymentMethod}`, 15, 48);
    pdf.text(`Subtotal: ${expense.subtotal}`, 15, 54);
    pdf.text(`Tax: ${expense.tax}`, 15, 60);
    pdf.text(`Total: ${expense.total}`, 15, 66);
    pdf.text('Items:', 15, 76);
    expense.items.forEach((item, idx) => {
      const y = 84 + idx * 8;
      pdf.text(`${item.description} x${item.quantity} @ ${item.price} = ${item.total}`, 15, y);
    });
    pdf.save(`expense-report-${Date.now()}.pdf`);
  };

  const filteredHistory = history.filter((entry) => {
    const matchSearch = search.trim().length === 0 || [entry.vendor, entry.category, entry.paymentMethod, entry.summary].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || entry.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-soft dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-indigo-600">AI Expense Tracker</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Capture receipts and turn them into smart expense reports</h1>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest action</p>
              <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{message}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total history</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{history.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Current status</p>
              <p className="mt-3 text-3xl font-semibold text-indigo-600 dark:text-indigo-300">{loading ? 'Processing...' : 'Ready'}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <ReceiptUploader onFileSelect={handleParseReceipt} loading={loading} />

            <ExpenseForm
              expense={expense}
              setExpense={setExpense}
              onSave={handleSaveExpense}
              onDownloadCSV={handleDownloadCSV}
              onDownloadPDF={handleDownloadPDF}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            <AnalyticsPanel analytics={analytics} />
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Receipt Summary</p>
                  <h2 className="text-xl font-semibold">Auto-generated text</h2>
                </div>
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <textarea
                readOnly
                value={expense.summary}
                className="h-60 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              {expense.rawText ? (
                <div className="mt-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">OCR (cleaned)</p>
                  <textarea readOnly value={expense.rawText} className="mt-2 h-32 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                </div>
              ) : null}

              {expense.debug ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/30 dark:border-rose-800">
                  <p className="font-medium">Parser debug</p>
                  {expense.debug.openai_error ? <div className="mt-2">Error: {expense.debug.openai_error}</div> : null}
                  {expense.debug.openai_raw ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer">AI raw output (click to expand)</summary>
                      <pre className="whitespace-pre-wrap text-xs mt-2">{expense.debug.openai_raw}</pre>
                    </details>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleDownloadCSV} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-700">
                  <Download size={16} /> CSV
                </button>
                <button type="button" onClick={handleDownloadPDF} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                  <Download size={16} /> PDF
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Expense history</h2>
              <p className="text-slate-500">Search, filter, and inspect your saved expenses.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search receipts"
                  className="w-40 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ExpenseHistory history={filteredHistory} />
        </section>
      </div>
    </div>
  );
}

export default App;
