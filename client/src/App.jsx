import { useState, useCallback, useEffect } from 'react';
import UploadCard from './UploadCard';
import JobList from './JobList';

// ─── Toast System ──────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: '1.1rem' }}>{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────
function StatsBar({ jobs }) {
  const total     = jobs.length;
  const completed = jobs.filter(j => j._state === 'completed').length;
  const failed    = jobs.filter(j => j._state === 'failed').length;
  const active    = jobs.filter(j => j._state === 'active' || j._state === 'waiting').length;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-value">{total}</div>
        <div className="stat-label">Total Jobs</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {completed}
        </div>
        <div className="stat-label">Completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {failed}
        </div>
        <div className="stat-label">Failed</div>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────
export default function App() {
  const [jobs,   setJobs]   = useState([]);
  const [toasts, setToasts] = useState([]);

  // Fetch all jobs on initial load
  useEffect(() => {
    fetch('http://localhost:3000/jobs')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error('Failed to fetch jobs:', err));
  }, []);

  const pushToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleJobAdded = useCallback(({ id, email, filename }) => {
    setJobs(prev => [{ id, email, filename, _state: 'waiting' }, ...prev]);
    pushToast(`Job #${id} queued for ${email}`, 'success');
  }, []);

  const handleComplete = useCallback((id, state) => {
    setJobs(prev =>
      prev.map(j => j.id === id ? { ...j, _state: state } : j)
    );
    if (state === 'completed') {
      pushToast(`Job #${id} completed successfully! 🎉`, 'success');
    } else {
      pushToast(`Job #${id} failed. Check the worker logs.`, 'error');
    }
  }, []);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-icon">📊</div>
        <h1>CSV Queue Processing System</h1>
        <div className="header-sub">
          <span className="status-dot" />
          API: localhost:3000
        </div>
      </header>

      <main className="main">
        {/* Left column: upload + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UploadCard onJobAdded={handleJobAdded} />
          <StatsBar jobs={jobs} />

          {/* Quick links */}
          <div className="card" style={{ padding: '18px 24px' }}>
            <div className="card-title"><span>🔗</span> Quick Links</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: '📊 Bull Board', href: 'http://localhost:3000/admin/queues' },
                { label: '📖 API Docs', href: '#' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'rgba(99,102,241,.1)',
                    border: '1px solid rgba(99,102,241,.25)',
                    borderRadius: '8px',
                    color: '#a5b4fc',
                    fontSize: '.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,.1)'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: job list */}
        <JobList jobs={jobs} onComplete={handleComplete} />
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
