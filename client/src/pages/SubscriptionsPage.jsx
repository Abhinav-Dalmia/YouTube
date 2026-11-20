import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import VideoGrid from '../components/VideoGrid';
export default function SubscriptionsPage() {
  const { user } = useAuth(); const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!user) { setLoading(false); return; } api.get('/videos/feed/subscriptions').then(({ data }) => setVideos(data.videos)).catch(() => setVideos([])).finally(() => setLoading(false)); }, [user]);
  return <div className="page"><div className="page-heading"><div><h1>Subscriptions</h1><p>Latest videos from channels you follow</p></div></div>{!user ? <div className="empty-state"><h3>See the latest from your favorite channels</h3><p>Sign in to view your subscriptions.</p><Link className="primary-button" to="/login">Sign in</Link></div> : <VideoGrid videos={videos} loading={loading} empty="You're all caught up"/>}</div>;
}
