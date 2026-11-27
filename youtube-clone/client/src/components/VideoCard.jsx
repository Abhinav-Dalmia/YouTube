import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Share2 } from 'lucide-react';
import Avatar from './Avatar';
import { formatViews, timeAgo } from '../lib/api';
import ShareVideoModal from './ShareVideoModal';

const palettes = ['thumb-blue', 'thumb-purple', 'thumb-orange', 'thumb-green', 'thumb-pink', 'thumb-cyan'];
export default function VideoCard({ video, index = 0 }) {
  const [shareOpen, setShareOpen] = useState(false);
  const owner = video.owner || {};
  return <article className="video-card">
    <Link to={`/watch/${video._id}`} className={`thumbnail ${video.thumbnailUrl ? '' : palettes[index % palettes.length]}`}>
      {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy"/> : <div className="thumb-art"><span className="play-triangle"/><span className="thumb-label">{video.category || 'VIDEO'}</span></div>}
      {video.duration > 0 && <span className="duration">{Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}</span>}
    </Link>
    <div className="video-card-info">
      <Link to={`/channel/${owner.handle || ''}`}><Avatar user={owner}/></Link>
      <div className="video-copy"><Link className="video-title" to={`/watch/${video._id}`}>{video.title}</Link><Link className="video-channel" to={`/channel/${owner.handle || ''}`}>{owner.name || 'Unknown creator'}</Link><div className="video-meta">{formatViews(video.views)} <span>•</span> {timeAgo(video.createdAt)}</div></div>
      {video.allowFriendSharing !== false && <button className="share-video-button" aria-label={`Share ${video.title} with a friend`} title="Share with a friend" onClick={() => setShareOpen(true)}><Share2 size={17}/></button>}
      <button className="more-button" aria-label="More options"><MoreVertical size={19}/></button>
    </div>
    {shareOpen && <ShareVideoModal video={video} onClose={() => setShareOpen(false)}/>}
  </article>;
}
