import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください。');
      setLoading(false);
      return;
    }

    try {
      // Call Login API
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          action: 'login',
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token in localStorage or sessionStorage
        if (rememberMe) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userEmail', formData.email);
        } else {
          sessionStorage.setItem('authToken', data.token);
          sessionStorage.setItem('userEmail', formData.email);
        }

        // Log audit event
        await fetch('/api/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'USER_LOGIN',
            email: formData.email,
            timestamp: new Date().toISOString(),
            ipAddress: data.ipAddress || 'unknown',
          }),
        });

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        setError(data.error || 'ログインに失敗しました。');
      }
    } catch (err) {
      setError('ログインエラー：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - MoCKA KNOWLEDGE GATE</title>
        <meta name="description" content="MoCKA Knowledge Gate - User Login" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">MoCKA KNOWLEDGE GATE</h1>
            <p className="text-purple-300 text-lg">Sign In</p>
          </div>

          {/* Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-2xl p-8 border border-purple-300 border-opacity-20">
            <form onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-purple-200">
                    パスワード *
                  </label>
                  <a
                    href="#"
                    className="text-xs text-purple-300 hover:text-purple-100 transition"
                  >
                    パスワードをお忘れですか？
                  </a>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="パスワード"
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-purple-300 placeholder-opacity-50 focus:bg-opacity-20 focus:border-purple-300 focus:outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Remember Me */}
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-purple-500 border-purple-400 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm font-medium text-purple-200"
                >
                  このデバイスで私を記憶している
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
              >
                {loading ? 'ログイン中...' : 'サインイン'}
              </button>
            </form>

            {/* Footer Links */}
            <div className="text-center border-t border-purple-300 border-opacity-20 pt-6">
              <p className="text-purple-200 mb-3">
                アカウントをお持ちでありませんか？{' '}
                <a
                  href="/signup"
                  className="text-purple-300 hover:text-purple-100 font-semibold transition"
                >
                  招待コードで登録
                </a>
              </p>
              <p className="text-xs text-purple-400">
                ご質問やサポートが必要ですか？{' '}
                <a
                  href="/support"
                  className="text-purple-300 hover:text-purple-100 underline"
                >
                  お問い合わせ
                </a>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-purple-900 bg-opacity-50 rounded-lg border border-purple-400 border-opacity-20">
            <p className="text-xs text-purple-300 text-center">
              🔐 セキュアどを確事にするため、認証いだきいたときと公共のコンピュータを使用しないでください。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
