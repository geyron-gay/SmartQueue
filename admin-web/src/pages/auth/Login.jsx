import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import tmcLogo from '../../assets/logo.webp'; // adjust path as needed
import '../../styles/auth/login.css';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'staff') navigate('/staff/dashboard');
            else if (user.role === 'admin') navigate('/admin/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(email, password);
            if (result.role === 'staff') navigate('/staff/dashboard');
            else if (result.role === 'admin') navigate('/admin/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* ── LEFT PANEL ── */}
                <div className="login-left">
                    <img src={tmcLogo} alt="TMC Logo" className="tmc-logo" />
                    <div>
                        <p className="left-title">Efficient Flow</p>
                        <p className="left-subtitle">
                            Advanced queue management<br />
                            for modern institutional<br />
                            services.
                        </p>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="login-right">
                    <div className="brand-header">
                        <div className="brand-title">
                            <span className="brand-icon">🏛️</span>
                            TMC SmartQueue
                        </div>
                        <div className="brand-tagline">
                            <span></span>Pila No More
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-msg">{error}</div>}

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="admin@gmail.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <div className="password-row">
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
                            </div>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="eye-toggle"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="remember-row">
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Keep me logged in</label>
                        </div>

                        <button type="submit" className="btn-signin">
                            Sign In <span className="btn-arrow">→</span>
                        </button>
                    </form>

                    <div className="card-footer">
                        <a href="#" className="footer-link">System Support</a>
                        <span className="footer-sep">•</span>
                        <a href="#" className="footer-link">Privacy Policy</a>
                        <span className="footer-sep">•</span>
                        <a href="#" className="footer-link">Terms of Service</a>
                    </div>
                </div>

            </div>
        </div>
    );
}