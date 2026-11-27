import { useState } from 'react';
import { CirclePlus, Clapperboard, House, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const mainLinks = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/shorts', label: 'Shorts', icon: Clapperboard },
  { to: '/upload', label: 'Create', icon: CirclePlus, create: true },
];

export default function MobileNavigation({ onMenu }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [youOpen, setYouOpen] = useState(false);
  const onWatchPage = pathname.startsWith('/watch/');
  const onYouPage = ['/channel/me', '/history', '/playlists', '/liked', '/watch-later', '/studio', '/settings'].includes(pathname);
  const close = () => setYouOpen(false);

  return <>
    <nav className={`mobile-bottom-nav ${onWatchPage ? 'mobile-bottom-nav-hidden' : ''}`} aria-label="Main navigation">
      {mainLinks.map(({ to, label, icon: Icon, end, create }) => <NavLink
        key={to}
        to={create && !user ? '/login' : to}
        end={end}
        aria-label={label}
        className={({ isActive }) => `mobile-nav-item ${create ? 'mobile-nav-create' : ''} ${isActive ? 'active' : ''}`}
      >
        <Icon size={create ? 29 : 23} strokeWidth={create ? 1.8 : 1.7}/>
        <span>{label}</span>
      </NavLink>)}
      <button type="button" aria-label="You" aria-expanded={youOpen} className={`mobile-nav-item ${onYouPage ? 'active' : ''}`} onClick={() => setYouOpen(true)}>
        {user?.avatar ? <img className="mobile-nav-avatar" src={user.avatar} alt=""/> : <UserRound size={23} strokeWidth={1.7}/>}
        <span>You</span>
      </button>
    </nav>

    {youOpen && <div className="mobile-you-backdrop" onClick={close}>
      <section className="mobile-you-sheet" role="dialog" aria-modal="true" aria-label="You menu" onClick={event => event.stopPropagation()}>
        <div className="mobile-you-sheet-handle"/>
        <header><h2>You</h2><button type="button" className="icon-button" aria-label="Close menu" onClick={close}><X size={22}/></button></header>
        {user ? <>
          <Link className="mobile-you-account" to="/channel/me" onClick={close}>
            {user.avatar ? <img src={user.avatar} alt=""/> : <span className="mobile-you-avatar-fallback"><UserRound size={24}/></span>}
            <span><b>{user.name}</b><small>@{user.handle}</small></span>
            <span className="mobile-you-view-channel">View channel</span>
          </Link>
          <div className="mobile-you-links">
            <Link to="/history" onClick={close}>History</Link>
            <Link to="/playlists" onClick={close}>Playlists</Link>
            <Link to="/liked" onClick={close}>Liked videos</Link>
            <Link to="/watch-later" onClick={close}>Watch later</Link>
            <Link to="/friends" onClick={close}>Your friends</Link>
            <Link to="/studio" onClick={close}>YouTube Studio</Link>
            <Link to="/settings" onClick={close}>Settings</Link>
          </div>
          <button className="mobile-you-more" type="button" onClick={() => { close(); onMenu(); }}>More destinations</button>
        </> : <div className="mobile-you-signed-out"><p>Sign in to like videos, comment, and subscribe.</p><Link to="/login" className="sign-in-button" onClick={close}>Sign in</Link></div>}
      </section>
    </div>}
  </>;
}
