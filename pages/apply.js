import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Apply() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: '',
    reason: '',
    email: '',
    phone: '',
    requestedAccess: 'viewer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.organizationName || !formData.reason || !formData.email || !formData.phone) {
      setError('すべてのフィールドを入力してください。');
      setLoading(false);
      return;
    }

    try {
      // Submit request
      const response = await fetch('/api/request-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          reason: formData.reason,
          email: formData.email,
          phone: formData.phone,
          requestedAccess: formData.requestedAccess,
          status: 'pending',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('申請が正常に送信されました。管理者が確認して、様子メールに連絡いたします。');
        setFormData({
          organizationName: '',
          reason: '',
          email: '',
          phone: '',
          requestedAccess: 'viewer',
        });

        // Log audit event
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'ACCESS_REQUEST_SUBMITTED',
            email: formData.email,
            organization: formData.organizationName,
            timestamp: new Date().toISOString(),
          }),
        });

        // Send notification email to admins
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@example.com',
            subject: '新しいアクセスリクエスト - ' + formData.organizationName,
            templateType: 'admin-request-notification',
            data: formData,
          }),
        });

        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setError(data.error || '申請の送信に失敗しました。');
      }
    } catch (err) {
      setError('申請エラー：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Access Request - MoCKA KNOWLEDGE GATE</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">MoCKA KNOWLEDGE GATE</h1>
            <p className="text-purple-300 text-lg">アクセスリクエスト</p>
          </div>

          {/* Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-2xl p-8 border border-purple-300 border-opacity-20">
            <form onSubmit={handleSubmit}>
              {/* Organization Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  所属組織 / 会社名 *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="e.g. ABC Corporation"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Reason / Purpose */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  アクセスを試したい理由 *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="あなたがこのプラットフォームを取得したい理由を説明してください。"
                  rows="4"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition resize-none"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  電話番号 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+81-XX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Requested Access Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  リクエストしたアクセスレベル *
                </label>
                <select
                  name="requestedAccess"
                  value={formData.requestedAccess}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                >
                  <option value="viewer" className="bg-slate-800">閲覧用 (Viewer)</option>
                  <option value="user" className="bg-slate-800">ユーザー (User)</option>
                  <option value="admin" className="bg-slate-800">管理者 (Admin)</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-500 bg-opacity-20 border border-green-500 text-green-200 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
              >
                {loading ? '送信中...' : 'アクセスリクエストを送信'}
              </button>

              {/* Back Button */}
              <a
                href="/dashboard"
                className="block text-center text-purple-300 hover:text-purple-100 font-medium py-2 transition"
              >
                戻る
              </a>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-purple-600 bg-opacity-20 rounded-lg border border-purple-400 border-opacity-20">
              <p className="text-sm text-purple-200">
                🔐 <strong>次の情報を貼付けてください：</strong> こいしは、新しい招待を取得したい場合、お所属組織、会社名、利用分夙を貼付けて、下記を送信してください。 admin@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
