import VideoCard from './VideoCard';
export default function VideoGrid({ videos = [], loading = false, empty = 'No videos found.' }) {
  if (loading) return <div className="video-grid">{Array.from({ length: 8 }, (_, i) => <div className="skeleton-card" key={i}><div className="skeleton-thumb"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>)}</div>;
  if (!videos.length) return <div className="empty-state"><div className="empty-icon">▶</div><h3>{empty}</h3><p>Videos you upload or discover will appear here.</p></div>;
  return <div className="video-grid">{videos.map((video, i) => <VideoCard key={video._id} video={video} index={i}/>)}</div>;
}
