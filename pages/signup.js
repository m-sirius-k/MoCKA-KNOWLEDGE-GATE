import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignUp() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateInviteCode = async (e) => {
    e.preventDefault();
    
    if (!formData.inviteCode.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/invite-codes?code=${encodeURIComponent(formData.inviteCode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invitation code');
        setCodeValidated(false);
        return;
      }

      if (data.valid) {
        setCodeValidated(true);
        setSuccessMessage(`Invitation code valid! Role: ${data.role || 'viewer'}`);
      } else {
        setError(data.error || 'This invitation code is no longer valid');
        setCodeValidated(false);
      }
    } catch (err) {
      setError('Failed to validate invitation code. Please try again.');
      setCodeValidated(false);
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!codeValidated) {
      setError('Please validate your invitation code first');
      return;
    }

    if (formData.email.length === 0) {
      setError('Email is required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          email: formData.email,
          password: formData.password,
          inviteCode: formData.inviteCode,
          displayName: formData.fullName || formData.email.split('@')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('An error occurred during signup. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - MoCKA KNOWLEDGE GATE</title>
        <meta name="description" content="Create your account with an invitation code" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>MoCKA KNOWLEDGE GATE</h1>
          <p style={styles.subtitle}>Create Your Account</p>

          {error && <div style={styles.errorAlert}>{error}</div>}
          {successMessage && <div style={styles.successAlert}>{successMessage}</div>}

          <form onSubmit={handleSignUp} style={styles.form}>
            {/* Step 1: Validate Invitation Code */}
            <fieldset style={styles.fieldset} disabled={codeValidated}>
              <legend style={styles.legend}>Step 1: Verify Invitation Code</legend>
              
              <div style={styles.formGroup}>
                <label htmlFor="inviteCode" style={styles.label}>Invitation Code *</label>
                <div style={styles.inputGroup}>
                  <input
                    type="text"
                    id="inviteCode"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    placeholder="Enter your invitation code"
                    style={styles.input}
                    disabled={codeValidated}
                  />
                  <button
                    type="button"
                    onClick={validateInviteCode}
                    disabled={codeValidated || loading}
                    style={styles.validateButton}
                  >
                    {loading ? 'Validating...' : 'Validate Code'}
                  </button>
                </div>
              </div>
            </fieldset>

            {codeValidated && (
              <>
                {/* Step 2: Account Information */}
                <fieldset style={styles.fieldset}>
                  <legend style={styles.legend}>Step 2: Account Information</legend>
                  
                  <div style={styles.formGroup}>
                    <label htmlFor="fullName" style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Your full name (optional)"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label htmlFor="password" style={styles.label}>Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label htmlFor="confirmPassword" style={styles.label}>Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter your password"
                      style={styles.input}
                      required
                    />
                  </div>
                </fieldset>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </>
            )}
          </form>

          <div style={styles.divider}></div>

          <p style={styles.loginLink}>
            Already have an account? <a href="/login" style={styles.link}>Sign In</a>
          </p>

          <p style={styles.helpText}>
            Questions? Contact your administrator for an invitation code.
          </p>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica',
            'Arial', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
      `}</style>
    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '16px',
  },
  errorAlert: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  successAlert: {
    backgroundColor: '#efe',
    border: '1px solid #cfc',
    color: '#060',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldset: {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '10px',
  },
  legend: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    padding: '0 5px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
  },
  validateButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '20px 0',
  },
  loginLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  helpText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
    marginTop: '10px',
  },
};
