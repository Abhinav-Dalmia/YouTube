import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bell, Pencil } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import VideoGrid from '../components/VideoGrid';
export default function ChannelPage() {
  const { handle } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const actualHandle = handle === 'me' ? user?.handle : handle;
  const [channel, setChannel] = useState(null); const [videos, setVideos] = useState([]); const [subscribed, setSubscribed] = useState(false); const [tab, setTab] = useState('Videos'); const [error, setError] = useState('');
  useEffect(() => { if (handle === 'me' && !user) { navigate('/login'); return; } if (!actualHandle) return; api.get(`/users/${actualHandle}`).then(({ data }) => { setChannel(data.channel); setVideos(data.videos); setSubscribed(data.isSubscribed); }).catch(() => setError('Channel not found')); }, [actualHandle, user?._id]);
  const isOwner = user && channel && user._id === channel._id;
  const toggleSubscribe = async () => { if (!user) return navigate('/login'); const { data } = await api.post(`/users/${channel._id}/subscribe`); setSubscribed(data.subscribed); setChannel(c => ({ ...c, subscriberCount: data.subscriberCount })); };
  if (error) return <div className="page"><div className="empty-state"><h3>{error}</h3><Link to="/">Go home</Link></div></div>;
  if (!channel) return <div className="loading-screen">Loading channel…</div>;
  return <div className="page channel-page"><div className="channel-banner" style={channel.banner ? { backgroundImage: `url(${channel.banner})` } : {}}/><div className="channel-header"><Avatar user={channel} size="xxl"/><div className="channel-details"><h1>{channel.name}</h1><div className="channel-handle">@{channel.handle} · {channel.subscriberCount || channel.subscribers?.length || 0} subscribers · {videos.length} videos</div><p>{channel.description || 'Welcome to my channel.'}</p></div><div className="channel-header-actions">{isOwner ? <Link to="/studio" className="secondary-button"><Pencil size={16}/> Customize channel</Link> : <button className={`subscribe-button ${subscribed ? 'subscribed' : ''}`} onClick={toggleSubscribe}>{subscribed ? <><Bell size={16}/> Subscribed</> : 'Subscribe'}</button>}</div></div>
    <div className="channel-tabs">{['Videos', 'Shorts', 'Playlists', 'About'].map(t => <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
    {tab === 'Videos' ? <VideoGrid videos={videos}/> : <div className="empty-state"><h3>{tab}</h3><p>This channel section is ready for content.</p></div>}
  </div>;
}
