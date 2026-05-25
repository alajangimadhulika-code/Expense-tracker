import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expense-tracker';

const startServer = () => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
};

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startServer();
  })
  .catch((error) => {
    console.warn('MongoDB connection failed. Running with local JSON fallback storage.');
    console.error(error);
    startServer();
  });
