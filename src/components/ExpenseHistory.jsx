import dayjs from 'dayjs';

const formatCurrency = (value, currency) => {
  const v = Number(value || 0);
  const sym = currency === 'INR' ? '₹' : '$';
  return `${sym}${v.toFixed(2)}`;
};

export default function ExpenseHistory({ history }) {
  if (!history.length) {
    return <p className="mt-6 text-sm text-slate-500">No expenses yet. Save a parsed receipt to populate your history.</p>;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-4 p-4 text-slate-500 text-sm uppercase tracking-[0.24em] md:grid-cols-[2fr_1fr_1fr_1fr]">
        <span>Store</span>
        <span>Date</span>
        <span>Category</span>
        <span>Total</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {history.map((expense) => (
          <div key={expense._id} className="grid gap-4 p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{expense.vendor || 'Unknown vendor'}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{expense.paymentMethod || 'Payment unknown'}</p>
              {expense.taxes && expense.taxes.length ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {expense.taxes.map((t, i) => (
                    <span key={i} className="mr-2">{t.name}: {formatCurrency(t.amount, expense.currency)}</span>
                  ))}
                </p>
              ) : null}
            </div>
            <div>{dayjs(expense.date).format('MMM D, YYYY')}</div>
            <div className="capitalize">{expense.category || 'other'}</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{expense.total ? formatCurrency(expense.total, expense.currency) : 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
