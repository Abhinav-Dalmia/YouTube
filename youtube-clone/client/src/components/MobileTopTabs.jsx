import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', end: true },
  { to: '/friends', label: 'Your Friends' },
  { to: '/subscriptions', label: 'Subscriptions' },
];

export default function MobileTopTabs() {
  return <nav className="mobile-top-tabs" aria-label="Home sections">
    {tabs.map(({ to, label, end }) => <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) => `mobile-top-tab ${isActive ? 'active' : ''}`}
    >{label}</NavLink>)}
  </nav>;
}
