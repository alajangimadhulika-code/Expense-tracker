import { createWorker } from 'tesseract.js';

let workerInstance = null;

async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker();
    await workerInstance.loadLanguage('eng');
    await workerInstance.initialize('eng');
  }
  return workerInstance;
}

export async function extractText(buffer) {
  try {
    // try to optionally resize image using sharp to improve OCR on small receipts
    let procBuffer = buffer;
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      const meta = await sharp(buffer).metadata();
      // If image is small, upscale to improve OCR
      if (meta && meta.width && meta.width < 1000) {
        const scale = meta.width < 600 ? 3 : 2;
        procBuffer = await sharp(buffer).resize(Math.round(meta.width * scale)).toBuffer();
        console.log('OCR: resized image for better recognition', { width: meta.width, scale });
      }
    } catch (e) {
      // sharp not available or failed — continue with original buffer
      // don't crash; log at debug level
      console.debug('OCR: sharp resize skipped', e?.message || e);
    }

    const worker = await getWorker();
    const { data } = await worker.recognize(procBuffer);
    console.log('OCR extracted length:', (data.text || '').length);
    return data.text || '';
  } catch (error) {
    console.error('OCR extraction error:', error);
    return '';
  }
}

export function cleanOcrText(text) {
  if (!text) return '';
  // normalize newlines and spaces
  let t = text.replace(/\r/g, '\n');
  t = t.replace(/\n+/g, '\n');
  t = t.replace(/[ ]{2,}/g, ' ');
  t = t.replace(/\t+/g, ' ');
  // common OCR confusions: replace common unicode multiplication sign and normalize rupee symbols
  t = t.replace(/×/g, 'x');
  t = t.replace(/Rs\.?/gi, '₹');
  t = t.replace(/INR\b/gi, '₹');
  // remove non-printable/control characters
  t = t.replace(/[\x00-\x09\x0B-\x1F\x7F]+/g, '');
  // trim lines and overall
  t = t.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  return t.trim();
}
