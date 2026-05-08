import { useState } from 'react';
import api from '../services/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/uploads/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Uploaded ${response.data.name} successfully.`);
      setFile(null);
    } catch (err) {
      setMessage('Upload failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Upload term sheet</h3>
        <p className="mt-2 text-slate-500">Upload PDF, image, or text files for validation and AI review.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
            <input
              type="file"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? file.name : 'Click to select a document'}
          </label>
          <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
            Upload document
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
