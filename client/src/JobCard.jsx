import { useEffect, useState } from 'react';

const API = 'http://localhost:3000';

const POLL_INTERVAL = 2000; // poll every 2s

function StatusPill({ state }) {
  const icons = {
    waiting:   '⏳',
    active:    '⚡',
    completed: '✅',
    failed:    '❌',
    delayed:   '🕐',
  };
  return (
    <span className={`status-pill ${state}`}>
      {icons[state] || '•'} {state}
    </span>
  );
}

export default function JobCard({ job, onComplete }) {
  const [status, setStatus]   = useState({ state: 'waiting', progress: 0 });
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (done) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/job/${job.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus({ state: data.state, progress: data.progress ?? 0, reason: data.reason });

        if (data.state === 'completed' || data.state === 'failed') {
          setDone(true);
          onComplete && onComplete(job.id, data.state);
        }
      } catch (_) {}
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [job.id, done]);

  const isActive    = status.state === 'active';
  const isCompleted = status.state === 'completed';
  const isFailed    = status.state === 'failed';
  const pct         = isCompleted ? 100 : (status.progress || 0);

  return (
    <div className="job-card">
      <div className="job-header">
        <span className="job-id">#{job.id}</span>
        <StatusPill state={status.state} />
        <span className="job-email" title={job.email}>{job.email}</span>
      </div>

      {/* Filename */}
      <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 8 }}>
        📄 {job.filename}
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <>
          <div className="progress-wrap">
            <div
              className="progress-bar"
              style={{
                width: `${pct}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, var(--accent), var(--accent2))',
              }}
            />
          </div>
          <div className="progress-label">
            <span>{isActive ? 'Processing…' : isCompleted ? 'Done!' : 'In queue…'}</span>
            <span>{pct}%</span>
          </div>
        </>
      )}

      {/* Error reason */}
      {isFailed && status.reason && (
        <div className="error-banner" style={{ marginTop: 8 }}>
          {status.reason}
        </div>
      )}
    </div>
  );
}
