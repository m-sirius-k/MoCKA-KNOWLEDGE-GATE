import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    inviteCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Code validation, Step 2: Registration

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  // Step 1: Validate Invitation Code
  const validateInviteCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invite-codes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.codes && data.codes.includes(formData.inviteCode)) {
        setCodeValidated(true);
        setStep(2);
        setSuccessMessage('招待コードが確認されました。次に登録情報を入力してください。');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('無効または期限切れの招待コードです。');
      }
    } catch (err) {
      setError('招待コード検証エラー：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register User with Firebase Auth
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('すべてのフィールドを入力してください。');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません。');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      setLoading(false);
      return;
    }

    try {
      // Call Firebase Auth API
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          inviteCode: formData.inviteCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('登録完了しました！メールを確認してください。');
        // Send confirmation email
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            subject: 'MoCKA KNOWLEDGE GATE - 登録確認',
            templateType: 'signup-confirmation',
            data: {
              name: formData.fullName,
              email: formData.email,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        // Log audit event
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'USER_SIGNUP',
            userId: data.uid,
            email: formData.email,
            timestamp: new Date().toISOString(),
            details: { inviteCode: formData.inviteCode },
          }),
        });

        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || '登録に失敗しました。');
      }
    } catch (err) {
      setError('登録エラー：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - MoCKA KNOWLEDGE GATE</title>
        <meta name="description" content="MoCKA Knowledge Gate - User Registration" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">MoCKA KNOWLEDGE GATE</h1>
            <p className="text-purple-300 text-lg">Sign Up</p>
          </div>

          {/* Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-2xl p-8 border border-purple-300 border-opacity-20">
            {/* Step 1: Invitation Code */}
            {step === 1 && (
              <form onSubmit={validateInviteCode}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-4">ステップ 1: 招待コード検証</h2>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    招待コード *
                  </label>
                  <input
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    placeholder="招待コードを入力"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500 bg-opacity-20 border border-green-500 text-green-200 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
                >
                  {loading ? '検証中...' : '招待コード検証'}
                </button>
              </form>
            )}

            {/* Step 2: Registration */}
            {step === 2 && (
              <form onSubmit={handleSignUp}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-4">ステップ 2: 登録情報</h2>

                  {/* Full Name */}
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    フルネーム *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="フルネーム"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition mb-4"
                    disabled={loading}
                  />

                  {/* Email */}
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="メールアドレス"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition mb-4"
                    disabled={loading}
                  />

                  {/* Password */}
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    パスワード *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="パスワード (6文字以上)"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition mb-4"
                    disabled={loading}
                  />

                  {/* Confirm Password */}
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    パスワード確認 *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="パスワード確認"
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500 bg-opacity-20 border border-green-500 text-green-200 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
                >
                  {loading ? '登録中...' : '今すぐ登録'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-purple-300 hover:text-purple-100 font-medium py-2 transition"
                  disabled={loading}
                >
                  戻る
                </button>
              </form>
            )}

            {/* Footer Links */}
            <div className="mt-6 text-center border-t border-purple-300 border-opacity-20 pt-6">
              <p className="text-purple-200 mb-3">
                既にアカウントをお持ちですか？{' '}
                <a href="/login" className="text-purple-300 hover:text-purple-100 font-semibold transition">
                  サインイン
                </a>
              </p>
              <p className="text-xs text-purple-400">
                ご質問やサポートが必要ですか？{' '}
                <a href="/support" className="text-purple-300 hover:text-purple-100 underline">
                  お問い合わせ
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
