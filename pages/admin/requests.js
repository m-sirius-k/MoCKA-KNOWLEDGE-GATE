import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if admin
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/request-approval?status=pending');
      const data = await response.json();
      setRequests(data.requests || []);
      setLoading(false);
    } catch (err) {
      setError('申請一覧の取得に失敗しました。');
      console.error(err);
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!inviteCodeInput.trim()) {
      alert('招待コードを入力してください。');
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
          inviteCode: inviteCodeInput,
          adminId: 'admin@example.com',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`申請 ID: ${requestId} を承認しました`);
        setInviteCodeInput('');
        
        // Log audit event
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'REQUEST_APPROVED',
            requestId,
            inviteCode: inviteCodeInput,
            timestamp: new Date().toISOString(),
            adminId: 'admin@example.com',
          }),
        });

        // Refresh requests
        setTimeout(() => {
          fetchRequests();
          setSuccessMessage('');
        }, 1500);
      } else {
        setError(data.error || '承認処理に失敗しました。');
      }
    } catch (err) {
      setError('承認エラー: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('本当にこの申請を拒否しますか？')) {
      return;
    }

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

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`申請 ID: ${requestId} を拒否しました`);
        
        // Log audit event
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'REQUEST_REJECTED',
            requestId,
            timestamp: new Date().toISOString(),
            adminId: 'admin@example.com',
          }),
        });

        // Refresh requests
        setTimeout(() => {
          fetchRequests();
          setSuccessMessage('');
        }, 1500);
      } else {
        setError(data.error || '拒否処理に失敗しました。');
      }
    } catch (err) {
      setError('拒否エラー: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-purple-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Request Approvals - MoCKA KNOWLEDGE GATE</title>
      </Head>

      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-300 mb-2">Admin Panel - Request Approvals</h1>
            <p className="text-purple-400">Pending access requests: <span className="font-bold">{requests.length}</span></p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 text-green-200 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Requests Table */}
          {requests.length > 0 ? (
            <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-purple-500 border-opacity-20">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Organization</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Requested Access</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-purple-500 border-opacity-10 hover:bg-slate-700 transition"
                    >
                      <td className="px-6 py-3">
                        <span className="font-medium">{request.organizationName}</span>
                      </td>
                      <td className="px-6 py-3 text-purple-300">{request.email}</td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-purple-600 bg-opacity-50 text-purple-200 rounded text-sm capitalize">
                          {request.requestedAccess}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-300">
                        <div className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm font-medium transition"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm font-medium transition"
                          >
                            拒否
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 p-12 text-center">
              <p className="text-purple-300 text-lg">待機中の申請はありません</p>
            </div>
          )}

          {/* Invite Code Input Modal */}
          {processingId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-8 max-w-md border border-purple-500 border-opacity-20">
                <h2 className="text-2xl font-bold text-white mb-4">招待コードを入力</h2>
                <p className="text-purple-200 mb-4">この申請者に発行する招待コードを入力してください。</p>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="e.g., INVITE-ABC123XYZ"
                  className="w-full px-4 py-2 bg-white bg-opacity-10 border border-purple-400 rounded-lg text-white placeholder-purple-300 mb-4 focus:outline-none focus:border-purple-300"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(processingId)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => setProcessingId(null)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
