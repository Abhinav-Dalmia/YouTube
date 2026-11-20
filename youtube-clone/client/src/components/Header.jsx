import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Mic, Video, Bell, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Header({ onMenu }) {
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const submit = (e) => { e.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Menu"><Menu size={23}/></button>
      <Link to="/" className="brand"><span className="brand-mark"><span/></span><span className="brand-text">YouTube</span><sup>IN</sup></Link>
    </div>
    <div className="topbar-search">
      <form className="search-form" onSubmit={submit}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" aria-label="Search"/><button className="search-submit" type="submit" aria-label="Search"><Search size={21}/></button></form>
      <button className="icon-button mic-button" aria-label="Voice search" title="Voice search"><Mic size={19}/></button>
    </div>
    <div className="topbar-actions">
      {user ? <>
        <Link className="icon-button upload-shortcut" to="/upload" title="Create"><Video size={22}/></Link>
        <button className="icon-button" title="Notifications" aria-label="Notifications"><Bell size={22}/></button>
        <div className="profile-menu-wrap"><button className="profile-trigger" onClick={() => setProfileOpen(v => !v)} aria-label="Account menu"><Avatar user={user}/></button>{profileOpen && <div className="profile-menu"><div className="profile-menu-user"><Avatar user={user}/><div><b>{user.name}</b><span>@{user.handle}</span></div></div><Link to="/channel/me" onClick={() => setProfileOpen(false)}>Your channel</Link><Link to="/studio" onClick={() => setProfileOpen(false)}>YouTube Studio</Link><Link to="/playlists" onClick={() => setProfileOpen(false)}>Your playlists</Link><button onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}>Sign out</button></div>}</div>
      </> : <Link className="sign-in-button" to="/login"><span className="user-outline">●</span> Sign in</Link>}
    </div>
  </header>;
}
