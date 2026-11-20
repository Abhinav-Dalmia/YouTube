import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import api from '../lib/api';
import Avatar from '../components/Avatar';
export default function ShortsPage() {
  const [videos, setVideos] = useState([]);
  useEffect(() => { api.get('/videos', { params: { limit: 30, sort: 'popular' } }).then(({ data }) => setVideos(data.videos)).catch(() => {}); }, []);
  return <div className="page shorts-page"><div className="shorts-feed">{videos.map(v => <article className="short-card" key={v._id}><div className="short-player">{v.videoUrl ? <video src={v.videoUrl} controls loop playsInline/> : <div className="short-empty">▶</div>}<div className="short-overlay"><h3>{v.title}</h3><Link to={`/channel/${v.owner?.handle}`}><Avatar user={v.owner} size="sm"/> <b>@{v.owner?.handle}</b></Link></div></div><div className="short-actions"><button><Heart size={22}/><span>{v.likes?.length || 0}</span></button><Link to={`/watch/${v._id}`}><MessageCircle size={22}/><span>Comments</span></Link><button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/watch/${v._id}`)}><Share2 size={22}/><span>Share</span></button></div></article>)}</div>{!videos.length && <div className="empty-state"><h3>No Shorts yet</h3><p>Upload videos to start filling this feed.</p></div>}</div>;
}
