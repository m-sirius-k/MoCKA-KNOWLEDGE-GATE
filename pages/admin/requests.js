import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/request-approval?status=pending');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const inviteCode = inviteCodeInput[requestId];
    if (!inviteCode) {
      alert('Please enter an invitation code');
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/request-approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'approved',
          inviteCode,
          adminId: 'admin@example.com',
        }),
      });

      if (response.ok) {
        alert('Request approved! Email sent to user.');
        fetchRequests();
        setInviteCodeInput({ ...inviteCodeInput, [requestId]: '' });
      } else {
        alert('Failed to approve request');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/request-approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'rejected',
          adminId: 'admin@example.com',
        }),
      });

      if (response.ok) {
        alert('Request rejected! Email sent to user.');
        fetchRequests();
      } else {
        alert('Failed to reject request');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  return (
    <>
      <Head>
        <title>Admin - Access Requests - MoCKA KNOWLEDGE GATE</title>
      </Head>

      <div style={styles.container}>
        <h1 style={styles.title}>Access Requests</h1>
        {error && <div style={styles.error}>{error}</div>}

        {requests.length === 0 ? (
          <p style={styles.noRequests}>No pending requests</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Invitation Code</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={styles.row}>
                  <td style={styles.td}>{req.name}</td>
                  <td style={styles.td}>{req.email}</td>
                  <td style={styles.td}>{req.requestReason}</td>
                  <td style={styles.td}>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      placeholder="Enter invite code"
                      value={inviteCodeInput[req.id] || ''}
                      onChange={(e) => setInviteCodeInput({
                        ...inviteCodeInput,
                        [req.id]: e.target.value,
                      })}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                      style={{...styles.button, backgroundColor: '#28a745'}}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={processingId === req.id}
                      style={{...styles.button, backgroundColor: '#dc3545'}}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  noRequests: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #ddd',
  },
  headerRow: {
    backgroundColor: '#f0f0f0',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  row: {
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '12px',
  },
  input: {
    width: '100%',
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '8px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '2px',
    fontSize: '14px',
  },
};
