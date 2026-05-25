import express from 'express';
import cors from 'cors';
import expenseRoutes from './routes/expenses.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', expenseRoutes);

export default app;