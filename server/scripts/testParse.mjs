import { parseReceiptText } from '../utils/aiParser.js';

const sample = `Cedarstay Hotels
56 Civic Center, Mumbai, West Bengal 997697
Contact: 9665514626

Date: 07/01/2026 Time: 16:03
Table: 11, 12
Invoice No: INV-2025-2745
Customer: Diya Sharma
Payment Mode: Card
GSTIN: 21NIHBG5941M7Z5

4 x Veg Biryani — ₹360.00
2 x Veg Biryani — ₹678.00
2 x Veg Biryani — ₹658.00
2 x Hakka Noodles — ₹538.00
3 x Hakka Noodles — ₹657.00
1 x Butter Naan — ₹699.00

CGST (2.5%) — ₹89.75
SGST (2.5%) — ₹89.75

Subtotal — ₹3,590.00
Total — ₹3,769.50
`;

(async () => {
  const parsed = await parseReceiptText(sample);
  console.log(JSON.stringify(parsed, null, 2));
})();
