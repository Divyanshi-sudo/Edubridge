import { useState } from 'react';
import { uploadTimetable } from '../lib/timetableStorage';

type TimetableUploadProps = {
  userId: string;
  onUploaded?: (file: File) => void;
};

export default function TimetableUpload({
  userId,
  onUploaded,
}: TimetableUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError('');
    setUploaded(false);

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'application/pdf',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB.');
      event.target.value = '';
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview(null);
    }

    setUploading(true);

    try {
      await uploadTimetable(userId, selectedFile);

      setUploaded(true);
      onUploaded?.(selectedFile);
    } catch (err) {
      console.error('Timetable upload error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload timetable. Please try again.'
      );
      setUploaded(false);
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setUploaded(false);
    setError('');
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Upload Your Timetable
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Upload your college timetable so EduBridge can automatically
          identify your free time.
        </p>
      </div>

      {!file ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center transition hover:border-sky-500 hover:bg-sky-500/5">
          <div className="mb-4 rounded-2xl bg-sky-500/10 p-4 text-3xl">
            📅
          </div>

          <p className="font-medium text-white">
            Upload your timetable
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Click to browse your files
          </p>

          <p className="mt-3 text-xs text-slate-500">
            PNG, JPG or PDF · Maximum 10 MB
          </p>

          <input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          {preview && (
            <img
              src={preview}
              alt="Timetable preview"
              className="mb-4 max-h-96 w-full rounded-xl object-contain"
            />
          )}

          {!preview && (
            <div className="mb-4 flex items-center justify-center rounded-xl bg-slate-900 py-10 text-5xl">
              📄
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={removeFile}
              disabled={uploading}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          <div className="mt-4">
            {uploading && (
              <p className="text-sm text-sky-300">
                ⏳ Uploading timetable to Supabase...
              </p>
            )}

            {uploaded && (
              <p className="text-sm text-emerald-400">
                ✓ Timetable successfully saved to Supabase!
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}