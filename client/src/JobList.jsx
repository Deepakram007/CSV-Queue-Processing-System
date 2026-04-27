import { useState } from 'react';
import JobCard from './JobCard';

export default function JobList({ jobs, onComplete }) {
  const [filter, setFilter] = useState('all');

  const filters = ['all', 'active', 'completed', 'failed', 'waiting'];

  const displayed = jobs.filter(j => {
    if (filter === 'all') return true;
    return j._state === filter;
  });

  return (
    <div className="card jobs-col">
      <div className="card-title">
        <span>📋</span> Job Queue
        <span className="job-count-badge">{jobs.length}</span>
      </div>

      {/* Filter tabs */}
      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background:   filter === f ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.04)',
                border:       `1px solid ${filter === f ? 'rgba(99,102,241,.5)' : 'var(--border)'}`,
                color:        filter === f ? '#a5b4fc' : 'var(--muted)',
                borderRadius: '20px',
                padding:      '4px 12px',
                fontSize:     '.72rem',
                fontWeight:   600,
                cursor:       'pointer',
                textTransform:'capitalize',
                transition:   'all .2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🗂️</span>
          No jobs yet. Upload a CSV file to get started!
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onComplete={(id, state) => {
                onComplete && onComplete(id, state);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
