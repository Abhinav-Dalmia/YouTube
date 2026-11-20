import { NavLink } from 'react-router-dom';
import { Home, Clapperboard, Radio, Clock3, History, ListVideo, ThumbsUp, Flame, Music2, Gamepad2, Trophy, Settings, CircleHelp, MessageSquareWarning, Youtube, PlaySquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const primary = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shorts', label: 'Shorts', icon: Clapperboard },
  { to: '/subscriptions', label: 'Subscriptions', icon: Radio }
];
export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();
  const navItem = (item) => <NavLink key={item.to} to={item.to} onClick={onNavigate} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><item.icon size={21} strokeWidth={1.8}/><span>{item.label}</span></NavLink>;
  return <>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="side-group">{primary.map(navItem)}</div>
      <div className="side-divider"/>
      <div className="side-heading">You <span>›</span></div>
      {[
        { to: '/channel/me', label: 'Your channel', icon: PlaySquare },
        { to: '/history', label: 'History', icon: History },
        { to: '/playlists', label: 'Playlists', icon: ListVideo },
        { to: '/liked', label: 'Liked videos', icon: ThumbsUp },
        { to: '/watch-later', label: 'Watch later', icon: Clock3 }
      ].map(navItem)}
      <div className="side-divider"/>
      <div className="side-heading">Explore</div>
      {[
        { to: '/explore/trending', label: 'Trending', icon: Flame },
        { to: '/explore/music', label: 'Music', icon: Music2 },
        { to: '/explore/gaming', label: 'Gaming', icon: Gamepad2 },
        { to: '/explore/sports', label: 'Sports', icon: Trophy }
      ].map(navItem)}
      {user && <><div className="side-divider"/><div className="side-heading">Creator tools</div><NavLink to="/studio" onClick={onNavigate} className="side-link"><Youtube size={21}/><span>YouTube Studio</span></NavLink></>}
      <div className="side-divider"/>
      <NavLink to="/settings" onClick={onNavigate} className="side-link"><Settings size={21}/><span>Settings</span></NavLink>
      <a className="side-link" href="https://support.google.com/youtube/" target="_blank" rel="noreferrer"><CircleHelp size={21}/><span>Help</span></a>
      <a className="side-link" href="mailto:feedback@example.com"><MessageSquareWarning size={21}/><span>Send feedback</span></a>
      <div className="side-footer">About&nbsp; Press&nbsp; Copyright<br/>Contact us&nbsp; Creators<br/><br/>Terms&nbsp; Privacy&nbsp; Policy &amp; Safety<br/><br/>© 2026 VideoTube</div>
    </aside>
    {open && <button aria-label="Close navigation" className="sidebar-scrim" onClick={onNavigate}/>}
  </>;
}
