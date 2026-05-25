import { useCallback, useState } from 'react';
import { Camera, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function ReceiptUploader({ onFileSelect, loading }) {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      setPreview(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Receipt capture</p>
          <h2 className="mt-2 text-2xl font-semibold">Upload or take a photo</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Camera className="h-4 w-4" />
          Camera-ready OCR
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`mt-6 flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed p-6 text-center transition ${
          isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-slate-800/80' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
        }`}
      >
        <input {...getInputProps()} capture="environment" />
        <UploadCloud className="h-12 w-12 text-indigo-600" />
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Drag & drop an image or click to browse</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Supports receipts, bills, invoices, and handwritten totals.</p>
        </div>
        {loading && <p className="text-sm text-indigo-600">Processing receipt... please wait.</p>}
      </div>

      {preview ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
          <img src={preview} alt="Receipt preview" className="h-60 w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
