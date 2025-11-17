import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

    if (!token) {
      router.push('/login');
      return;
    }

    // Mock user data - in real app, fetch from API
    setUser({
      email: email || 'user@example.com',
      name: 'User Name',
      role: 'admin',
    });
    setRole('admin');
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    // Log audit event
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'USER_LOGOUT',
        email: user?.email,
        timestamp: new Date().toISOString(),
      }),
    });

    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userEmail');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-purple-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MoCKA KNOWLEDGE GATE</title>
      </Head>

      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <header className="bg-slate-800 border-b border-purple-500 border-opacity-20 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-purple-300">MoCKA KNOWLEDGE GATE</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-purple-300">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'w-64' : 'w-0'
            } bg-slate-800 border-r border-purple-500 border-opacity-20 transition-all duration-300 overflow-hidden`}
          >
            <nav className="p-4 space-y-2 mt-4">
              {[
                { id: 'overview', label: '概要', icon: '📋' },
                { id: 'requests', label: '申請一覧', icon: '📋' },
                ...(role === 'admin'
                  ? [
                      { id: 'approvals', label: '承認管理', icon: '✅' },
                      { id: 'users', label: 'ユーザー管理', icon: '👥' },
                      { id: 'audit', label: '監査ログ', icon: '📑' },
                    ]
                  : []),
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === item.id
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-200 hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">ダッシュボード</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 rounded-lg p-6 border border-purple-500 border-opacity-20">
                    <h3 className="text-purple-300 text-sm font-semibold mb-2">Your Role</h3>
                    <p className="text-2xl font-bold capitalize">{role}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-purple-500 border-opacity-20">
                    <h3 className="text-purple-300 text-sm font-semibold mb-2">Pending Requests</h3>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-purple-500 border-opacity-20">
                    <h3 className="text-purple-300 text-sm font-semibold mb-2">Last Login</h3>
                    <p className="text-sm text-purple-300">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold">申請一覧</h2>
                  <a
                    href="/apply"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-medium"
                  >
                    新規申請
                  </a>
                </div>
                <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 p-6">
                  <p className="text-purple-300">Your requests will appear here...</p>
                </div>
              </div>
            )}

            {/* Admin: Approvals Tab */}
            {role === 'admin' && activeTab === 'approvals' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">承認管理</h2>
                <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 p-6">
                  <p className="text-purple-300">Pending approvals will appear here...</p>
                </div>
              </div>
            )}

            {/* Admin: Users Tab */}
            {role === 'admin' && activeTab === 'users' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">ユーザー管理</h2>
                <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700 border-b border-purple-500 border-opacity-20">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-purple-500 border-opacity-10 hover:bg-slate-700">
                        <td className="px-6 py-3">user@example.com</td>
                        <td className="px-6 py-3 text-purple-300">Admin</td>
                        <td className="px-6 py-3"><span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded text-sm">Active</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin: Audit Log Tab */}
            {role === 'admin' && activeTab === 'audit' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">監査ログ</h2>
                <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 p-6">
                  <p className="text-purple-300">Audit logs will appear here...</p>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Profile</h2>
                <div className="bg-slate-800 rounded-lg border border-purple-500 border-opacity-20 p-8 max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-1">Name</label>
                      <p className="text-lg">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-1">Email</label>
                      <p className="text-lg">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-1">Role</label>
                      <p className="text-lg capitalize">{role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
