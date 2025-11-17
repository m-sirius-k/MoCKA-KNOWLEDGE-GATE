import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // In a real app, you would fetch user data from your auth endpoint
    // For now, we'll just check that the token exists
    setUser({
      email: localStorage.getItem('userEmail') || 'user@example.com',
      role: localStorage.getItem('userRole') || 'viewer',
    });
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/login')} style={styles.button}>
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MoCKA KNOWLEDGE GATE</title>
        <meta name="description" content="Your MoCKA KNOWLEDGE GATE Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.logo}>MoCKA KNOWLEDGE GATE</h1>
            <div style={styles.userSection}>
              <span style={styles.userInfo}>{user?.email}</span>
              <span style={styles.role}>{user?.role}</span>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Sidebar Navigation */}
          <aside style={styles.sidebar}>
            <nav style={styles.nav}>
              <button
                style={{
                  ...styles.navButton,
                  ...(activeTab === 'overview' ? styles.navButtonActive : {}),
                }}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                style={{
                  ...styles.navButton,
                  ...(activeTab === 'conversations' ? styles.navButtonActive : {}),
                }}
                onClick={() => setActiveTab('conversations')}
              >
                Conversations
              </button>
              <button
                style={{
                  ...styles.navButton,
                  ...(activeTab === 'api-keys' ? styles.navButtonActive : {}),
                }}
                onClick={() => setActiveTab('api-keys')}
              >
                API Keys
              </button>
              <button
                style={{
                  ...styles.navButton,
                  ...(activeTab === 'settings' ? styles.navButtonActive : {}),
                }}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </nav>
          </aside>

          {/* Content Area */}
          <div style={styles.content}>
            {activeTab === 'overview' && (
              <div style={styles.section}>
                <h2>Welcome to Your Dashboard</h2>
                <p>This is your MoCKA KNOWLEDGE GATE dashboard. You can manage conversations, API keys, and settings from here.</p>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <h3>Conversations</h3>
                    <p style={styles.statNumber}>0</p>
                  </div>
                  <div style={styles.statCard}>
                    <h3>API Keys</h3>
                    <p style={styles.statNumber}>0</p>
                  </div>
                  <div style={styles.statCard}>
                    <h3>Audit Logs</h3>
                    <p style={styles.statNumber}>0</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'conversations' && (
              <div style={styles.section}>
                <h2>Conversations</h2>
                <p>View and manage your conversations here.</p>
                <div style={styles.emptyState}>
                  <p>No conversations yet.</p>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div style={styles.section}>
                <h2>API Keys</h2>
                <p>Manage your API keys for programmatic access.</p>
                <button style={styles.primaryButton}>Generate New API Key</button>
                <div style={styles.emptyState}>
                  <p>No API keys created yet.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={styles.section}>
                <h2>Settings</h2>
                <div style={styles.settingsForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email:</label>
                    <span style={styles.value}>{user?.email}</span>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Role:</label>
                    <span style={styles.value}>{user?.role}</span>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Account Created:</label>
                    <span style={styles.value}>Today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#333',
    color: 'white',
    padding: '20px',
    borderBottom: '3px solid #667eea',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userInfo: {
    fontSize: '14px',
  },
  role: {
    backgroundColor: '#667eea',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    backgroundColor: 'white',
    borderRight: '1px solid #ddd',
    width: '250px',
    padding: '20px',
    overflowY: 'auto',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  navButton: {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    backgroundColor: '#667eea',
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
  section: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0 0 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '20px',
  },
  settingsForm: {
    marginTop: '20px',
  },
  formGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  label: {
    fontWeight: '600',
    minWidth: '120px',
    color: '#333',
  },
  value: {
    color: '#666',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
};
