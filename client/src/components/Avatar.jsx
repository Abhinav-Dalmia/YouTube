import { initials } from '../lib/api';
export default function Avatar({ user, size = 'md' }) {
  if (user?.avatar) return <img className={`avatar avatar-${size}`} src={user.avatar} alt={user.name || 'Channel avatar'} />;
  return <div className={`avatar avatar-${size} avatar-fallback`}>{initials(user?.name || user?.handle || 'User')}</div>;
}
