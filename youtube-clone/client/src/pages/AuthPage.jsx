import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play } from 'lucide-react';
export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register'; const { login, register } = useAuth(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', handle: '', email: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const update = e => setForm(v => ({ ...v, [e.target.name]: e.target.value }));
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { if (isRegister) await register(form); else await login({ email: form.email, password: form.password }); navigate(params.get('next') || '/'); } catch (err) { setError(err.response?.data?.message || 'Could not sign in. Check the server connection.'); } finally { setBusy(false); } };
  return <div className="auth-page"><div className="auth-card"><Link to="/" className="brand auth-brand"><span className="brand-mark"><span/></span><span className="brand-text">YouTube</span></Link><h1>{isRegister ? 'Create your account' : 'Sign in'}</h1><p>{isRegister ? 'Join the community and start sharing videos.' : 'Use your VideoTube account to continue.'}</p><form onSubmit={submit} className="auth-form">
    {isRegister && <><label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your name" required maxLength={60}/></label><label>Channel handle<input name="handle" value={form.handle} onChange={update} placeholder="yourchannel" required minLength={3}/></label></>}
    <label>Email<input name="email" type="email" value={form.email} onChange={update} placeholder="name@example.com" required autoComplete="email"/></label>
    <label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required minLength={isRegister ? 8 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'}/></label>
    {error && <div className="inline-error">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
  </form><div className="auth-switch">{isRegister ? 'Already have an account?' : 'New to YouTube Clone?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create account'}</Link></div><small>By continuing, you agree to the demo application's terms and privacy policy.</small></div></div>;
}
