import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Menu, Mic, Plus, Search, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Header({ onMenu }) {
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setMobileSearchOpen(false);
  };

  const closeProfile = () => setProfileOpen(false);

  return <header className={`topbar ${mobileSearchOpen ? 'mobile-search-open' : ''} ${user ? 'has-user' : ''}`}>
    <div className="topbar-left">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={23}/></button>
      <Link to="/" className="brand" aria-label="YouTube home"><span className="brand-mark"><span/></span><span className="brand-text">YouTube</span><sup>IN</sup></Link>
    </div>

    <div className="topbar-search">
      <form className="search-form" onSubmit={submit}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" aria-label="Search"/>
        <button className="search-submit" type="submit" aria-label="Search"><Search size={21}/></button>
      </form>
      <button className="icon-button mic-button" aria-label="Voice search" title="Voice search"><Mic size={19}/></button>
    </div>

    <div className="topbar-actions">
      {user && <Link className="icon-button upload-shortcut" to="/upload" title="Create" aria-label="Create"><Video className="desktop-create-icon" size={22}/><Plus className="mobile-create-icon" size={22}/></Link>}
      {user && <button className="icon-button notification-button" title="Notifications" aria-label="Notifications"><Bell size={22}/></button>}
      <button className="icon-button mobile-search-toggle" onClick={() => setMobileSearchOpen(true)} aria-label="Search"><Search size={22}/></button>
      {user ? <div className="profile-menu-wrap">
        <button className="profile-trigger" onClick={() => setProfileOpen(v => !v)} aria-label="Account menu" aria-expanded={profileOpen}><Avatar user={user}/></button>
        {profileOpen && <div className="profile-menu">
          <div className="profile-menu-user"><Avatar user={user}/><div><b>{user.name}</b><span>@{user.handle}</span></div></div>
          <Link to="/channel/me" onClick={closeProfile}>Your channel</Link>
          <Link to="/history" onClick={closeProfile}>History</Link>
          <Link to="/playlists" onClick={closeProfile}>Playlists</Link>
          <Link to="/liked" onClick={closeProfile}>Liked videos</Link>
          <Link to="/watch-later" onClick={closeProfile}>Watch later</Link>
          <Link to="/friends" onClick={closeProfile}>Your friends</Link>
          <Link to="/studio" onClick={closeProfile}>YouTube Studio</Link>
          <Link to="/settings" onClick={closeProfile}>Settings</Link>
          <button className="mobile-more-link" onClick={() => { closeProfile(); onMenu(); }}>More destinations</button>
          <button onClick={() => { logout(); closeProfile(); navigate('/'); }}>Sign out</button>
        </div>}
      </div> : <Link className="sign-in-button" to="/login"><span className="user-outline">●</span> Sign in</Link>}
    </div>

    {mobileSearchOpen && <form className="mobile-search-form" onSubmit={submit}>
      <button type="button" className="icon-button" aria-label="Close search" onClick={() => setMobileSearchOpen(false)}><ArrowLeft size={22}/></button>
      <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search YouTube" aria-label="Search YouTube"/>
      <button type="submit" className="icon-button" aria-label="Submit search"><Search size={22}/></button>
    </form>}
  </header>;
}
