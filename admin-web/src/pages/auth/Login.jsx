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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.role === 'staff') navigate('/staff/dashboard');
            else if (user.role === 'admin') navigate('/admin/dashboard');
        }
    }, [user, navigate]);

const handleSubmit = async (e) => {
    console.log("=== LOGIN START ===");
    e.preventDefault();
    console.log("✔ preventDefault called");
    console.log("📧 Email:", email);
    console.log("🔑 Password exists:", !!password);

    if (!navigator.onLine) {
        setError("No internet connection.");
        return;
    }

    setError('');
    setLoading(true);

    try {
        console.log("🚀 Calling login API...");
        const result = await login(email, password); // await directly
        console.log("🎉 Login result:", result);
        console.log("👤 Role received:", result.role);

        if (result.role === 'staff') {
            console.log("➡️ Navigating to staff dashboard");
            navigate('/staff/dashboard');
        } else if (result.role === 'admin') {
            console.log("➡️ Navigating to admin dashboard");
            navigate('/admin/dashboard');
        } else {
            console.log("⚠️ Unknown role:", result);
            setError("Unknown role");
        }

    } catch (err) {
        console.error("💥 CATCH BLOCK:", err);
        setError(err.message.includes("Request timeout") ? 
                 "Server is taking too long. Please try again." : 
                 "Invalid email or password.");
    } finally {
        setLoading(false);
        console.log("🏁 Finally block reached");
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
               

                        <button type="submit" className="btn-signin" disabled={loading}>
    {loading ? (
        <div className="smartqueue-loader">
            <span>S</span>
            <span>m</span>
            <span>a</span>
            <span>r</span>
            <span>t</span>
            <span>Q</span>
            <span>u</span>
            <span>e</span>
            <span>u</span>
            <span>e</span>
        </div>
    ) : (
        <>
            Sign In <span className="btn-arrow">→</span>
        </>
    )}
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