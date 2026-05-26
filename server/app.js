import express from 'express';
import cors from 'cors';
import expenseRoutes from './routes/expenses.js';
import { connectDB } from './utils/db.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
  next();
});

app.use('/api', expenseRoutes);

export default app;