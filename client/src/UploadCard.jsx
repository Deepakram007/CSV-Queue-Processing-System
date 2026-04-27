import { useState, useCallback } from 'react';

const API = 'http://localhost:3000';

export default function UploadCard({ onJobAdded }) {
  const [file, setFile]       = useState(null);
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    setError('');
    if (!f) return;
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      setError('Only .csv files are accepted.');
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file)  { setError('Please select a CSV file.'); return; }
    if (!email) { setError('Email is required.');         return; }

    const fd = new FormData();
    fd.append('csvFile', file);
    fd.append('email', email);

    setLoading(true);
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onJobAdded({ id: data.jobId, email, filename: file.name });
      setFile(null);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>📤</span> Upload CSV File
      </div>

      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => document.getElementById('csv-input').click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <span className="drop-icon">📁</span>
          <div className="drop-title">
            {dragging ? 'Drop it here!' : 'Click or drag & drop'}
          </div>
          <div className="drop-sub">Accepts .csv files up to 100 MB</div>

          {file && (
            <div className="file-chosen">
              ✅ <strong>{file.name}</strong>&nbsp;
              <span style={{ color: 'var(--muted)' }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Email field */}
        <div className="form-group">
          <label htmlFor="email-input">Notification Email</label>
          <input
            id="email-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Error */}
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Submit */}
        <button className="btn-upload" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Processing…</> : '🚀 Upload & Queue'}
        </button>
      </form>
    </div>
  );
}
