# AI Expense Tracker

A React + Tailwind + Node.js expense tracker that extracts receipt data using OCR and AI parsing.

## Features

- Drag-and-drop and camera capture receipt upload
- OCR extraction using Tesseract
- AI-assisted structured expense parsing via OpenAI (optional)
- Editable extracted receipt fields before saving
- MongoDB expense history
- Search, filters, monthly analytics, category charts
- Download CSV and PDF reports
- Dark/light mode and responsive design

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start MongoDB locally or via Atlas
4. Run the app: `npm run dev`

## Environment

- `MONGO_URI` - MongoDB connection string
- `OPENAI_API_KEY` - Optional OpenAI key for improved parsing

## API Endpoints

- `POST /api/parse` - Upload receipt image and get structured data
- `POST /api/expenses` - Save a parsed expense
- `GET /api/expenses` - Fetch expense history
- `GET /api/analytics` - Get spending analytics
