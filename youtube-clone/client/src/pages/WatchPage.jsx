import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bell, Bookmark, Download, ListPlus, MoreHorizontal, Share2, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import api, { formatViews, timeAgo } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import VideoGrid from '../components/VideoGrid';
import ShareVideoModal from '../components/ShareVideoModal';

export default function WatchPage() {
  const { id } = useParams(); const { user } = useAuth();
  const [video, setVideo] = useState(null); const [related, setRelated] = useState([]); const [comments, setComments] = useState([]);
  const [comment, setComment] = useState(''); const [error, setError] = useState(''); const [reaction, setReaction] = useState(null); const [subscribed, setSubscribed] = useState(false); const [saved, setSaved] = useState(false); const [saveOpen, setSaveOpen] = useState(false); const [shareOpen, setShareOpen] = useState(false); const [playlists, setPlaylists] = useState([]);
  const load = () => api.get(`/videos/${id}`).then(({ data }) => { setVideo(data.video); setReaction(user && data.video.likes?.includes(user._id) ? 'like' : user && data.video.dislikes?.includes(user._id) ? 'dislike' : null); setSubscribed(user && data.video.owner.subscribers?.includes(user._id)); }).catch(() => setError('This video is unavailable.'));
  useEffect(() => {
    setVideo(null); setError(''); setSaved(false); load();
    api.get(`/videos/${id}/comments`).then(({ data }) => setComments(data.comments)).catch(() => setComments([]));
    api.get('/videos', { params: { limit: 12, sort: 'popular' } }).then(({ data }) => setRelated(data.videos.filter(v => v._id !== id))).catch(() => {});
    if (user) { api.get('/users/watch-later').then(({ data }) => setSaved(data.videos.some(v => v._id === id))).catch(() => {}); }
  }, [id, user?._id]);
  useEffect(() => { api.post(`/videos/${id}/view`).then(() => {}).catch(() => {}); }, [id]);
  const react = async (kind) => { if (!user) return setError('Sign in to rate videos.'); try { const { data } = await api.post(`/videos/${id}/reaction`, { reaction: kind }); setVideo(v => ({ ...v, likes: Array(data.likes), dislikes: Array(data.dislikes) })); setReaction(data.userReaction); } catch (e) { setError(e.response?.data?.message || 'Could not update reaction'); } };
  const subscribe = async () => { if (!user) return setError('Sign in to subscribe.'); try { const { data } = await api.post(`/users/${video.owner._id}/subscribe`); setSubscribed(data.subscribed); setVideo(v => ({ ...v, owner: { ...v.owner, subscribers: Array(data.subscriberCount) } })); } catch (e) { setError(e.response?.data?.message || 'Could not subscribe'); } };
  const toggleSaved = async () => { if (!user) return setError('Sign in to save videos.'); try { const { data } = await api.post(`/users/watch-later/${id}`); setSaved(data.saved); } catch (e) { setError(e.response?.data?.message || 'Could not save video'); } };
  const openSavePanel = async () => { if (!user) return setError('Sign in to save videos to a playlist.'); try { const { data } = await api.get('/playlists'); setPlaylists(data.playlists); setSaveOpen(v => !v); } catch { setError('Could not load playlists'); } };
  const addToPlaylist = async (playlistId) => { try { await api.post(`/playlists/${playlistId}/videos`, { videoId: id }); setSaveOpen(false); setError('Added to playlist.'); } catch (e) { setError(e.response?.data?.message || 'Could not add to playlist'); } };
  const postComment = async (e) => { e.preventDefault(); if (!user) return setError('Sign in to comment.'); try { const { data } = await api.post(`/videos/${id}/comments`, { text: comment }); setComments(c => [data.comment, ...c]); setComment(''); } catch (e) { setError(e.response?.data?.message || 'Comment failed'); } };
  if (!video) return <div className="page">{error ? <div className="empty-state"><h3>{error}</h3><Link to="/">Back to home</Link></div> : <div className="loading-screen">Loading video…</div>}</div>;
  const owner = video.owner || {};
  return <div className="page watch-page"><div className="watch-layout">
    <section className="watch-main">
      <div className="player-wrap">{video.videoUrl ? <video className="video-player" src={video.videoUrl} controls autoPlay playsInline poster={video.thumbnailUrl || undefined}/> : <div className="player-placeholder"><span>▶</span><p>Video file unavailable</p></div>}</div>
      <h1 className="watch-title">{video.title}</h1>
      <div className="watch-toolbar"><div className="channel-inline"><Link to={`/channel/${owner.handle}`}><Avatar user={owner} size="lg"/></Link><div className="channel-inline-copy"><Link to={`/channel/${owner.handle}`} className="channel-name">{owner.name}</Link><span>{owner.subscribers?.length || 0} subscribers</span></div><button className={`subscribe-button ${subscribed ? 'subscribed' : ''}`} onClick={subscribe}>{subscribed ? <><Bell size={16}/> Subscribed</> : 'Subscribe'}</button></div>
        <div className="action-buttons"><button className={reaction === 'like' ? 'action-active' : ''} onClick={() => react('like')}><ThumbsUp size={18}/>{video.likes?.length || 0}</button><span className="action-divider"/><button className={reaction === 'dislike' ? 'action-active' : ''} onClick={() => react('dislike')}><ThumbsDown size={18}/></button><button onClick={() => navigator.clipboard?.writeText(window.location.href)}><Share2 size={18}/> Share</button>{video.allowFriendSharing !== false && <button onClick={() => setShareOpen(true)}><Users size={18}/> Send to friend</button>}<button onClick={toggleSaved} className={saved ? 'action-active' : ''}><Bookmark size={18}/> {saved ? 'Saved' : 'Save'}</button><button onClick={openSavePanel}><ListPlus size={18}/> Playlist</button><button><Download size={18}/> Download</button><button aria-label="More"><MoreHorizontal size={20}/></button></div>
      </div>
      <div className="video-description"><b>{formatViews(video.views)} · {timeAgo(video.createdAt)}</b><p>{video.description || 'No description added.'}</p></div>
      {error && <div className="inline-error">{error}</div>}
      {saveOpen && <div className="save-playlist-panel"><b>Save to playlist</b>{playlists.length ? playlists.map(p => <button key={p._id} onClick={() => addToPlaylist(p._id)}>{p.title}</button>) : <span>No playlists yet. <Link to="/playlists">Create one</Link></span>}</div>}
      {shareOpen && <ShareVideoModal video={video} onClose={() => setShareOpen(false)}/>}
      <section className="comments-section"><h2>{comments.length} Comments</h2><form className="comment-form" onSubmit={postComment}><Avatar user={user}/><input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…"/><button disabled={!comment.trim()}>Comment</button></form>
        {comments.map(item => <div className="comment-item" key={item._id}><Avatar user={item.owner}/><div><div className="comment-meta"><b>{item.owner?.name || 'User'}</b><span>{timeAgo(item.createdAt)}</span></div><p>{item.text}</p></div></div>)}
      </section>
    </section>
    <aside className="watch-related"><h3>Up next</h3>{related.map(v => <div className="related-item" key={v._id}><Link to={`/watch/${v._id}`} className="related-thumb"><img src={v.thumbnailUrl || ''} alt=""/>{!v.thumbnailUrl && <span>▶</span>}</Link><div><Link to={`/watch/${v._id}`} className="related-title">{v.title}</Link><span>{v.owner?.name}</span><span>{formatViews(v.views)} · {timeAgo(v.createdAt)}</span></div></div>)}</aside>
  </div></div>;
}
