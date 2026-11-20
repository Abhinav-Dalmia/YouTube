import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, ThumbsUp } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import VideoGrid from '../components/VideoGrid';
export function HistoryPage() {
  const { user } = useAuth(); const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!user) { setLoading(false); return; } api.get('/users/history').then(({ data }) => setVideos(data.videos)).catch(() => {}).finally(() => setLoading(false)); }, [user]);
  return <div className="page"><div className="page-heading"><Clock3/><div><h1>Watch history</h1><p>Videos you've watched</p></div></div>{!user ? <SignInPrompt/> : <VideoGrid videos={videos} loading={loading} empty="Your watch history is empty"/>}</div>;
}
export function LikedPage() {
  const { user } = useAuth(); const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!user) { setLoading(false); return; } api.get('/users/liked').then(({ data }) => setVideos(data.videos)).catch(() => {}).finally(() => setLoading(false)); }, [user]);
  return <div className="page"><div className="page-heading"><ThumbsUp/><div><h1>Liked videos</h1><p>Videos you've liked</p></div></div>{!user ? <SignInPrompt/> : <VideoGrid videos={videos} loading={loading} empty="You haven't liked any videos"/>}</div>;
}
function SignInPrompt() { return <div className="empty-state"><h3>Sign in to continue</h3><Link className="primary-button" to="/login">Sign in</Link></div>; }
export function PlaylistsPage() {
  const { user } = useAuth(); const [playlists, setPlaylists] = useState([]); const [title, setTitle] = useState(''); const [error, setError] = useState('');
  const load = () => api.get('/playlists').then(({ data }) => setPlaylists(data.playlists)).catch(() => {});
  useEffect(() => { if (user) load(); }, [user]);
  const create = async (e) => { e.preventDefault(); if (!title.trim()) return; try { await api.post('/playlists', { title }); setTitle(''); load(); } catch (e) { setError(e.response?.data?.message || 'Could not create playlist'); } };
  return <div className="page"><div className="page-heading"><div><h1>Playlists</h1><p>Your saved collections</p></div></div>{!user ? <SignInPrompt/> : <><form className="create-playlist" onSubmit={create}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="New playlist name"/><button className="primary-button">Create playlist</button></form>{error && <div className="inline-error">{error}</div>}<div className="playlist-grid">{playlists.map(p => <Link className="playlist-card" to={`/playlist/${p._id}`} key={p._id}><div className="playlist-cover"><span>▶</span><b>{p.videos?.length || 0} videos</b></div><h3>{p.title}</h3><p>{p.visibility}</p></Link>)}</div>{!playlists.length && <div className="empty-state"><h3>No playlists yet</h3><p>Create your first playlist above.</p></div>}</>}</div>;
}

export function WatchLaterPage() {
  const { user } = useAuth(); const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!user) { setLoading(false); return; } api.get('/users/watch-later').then(({ data }) => setVideos(data.videos)).catch(() => {}).finally(() => setLoading(false)); }, [user]);
  return <div className="page"><div className="page-heading"><Clock3/><div><h1>Watch later</h1><p>Videos you've saved for later</p></div></div>{!user ? <SignInPrompt/> : <VideoGrid videos={videos} loading={loading} empty="Your Watch later list is empty"/>}</div>;
}

export function PlaylistPage() {
  const { id } = useParams(); const [playlist, setPlaylist] = useState(null);
  useEffect(() => { api.get(`/playlists/${id}`).then(({ data }) => setPlaylist(data.playlist)).catch(() => setPlaylist({ error: true })); }, [id]);
  return <div className="page">{!playlist ? <div className="loading-screen">Loading playlist…</div> : playlist.error ? <div className="empty-state"><h3>Playlist not found</h3></div> : <><div className="page-heading"><div><h1>{playlist.title}</h1><p>{playlist.videos.length} videos · {playlist.visibility}</p></div></div><VideoGrid videos={playlist.videos}/></>}</div>;
}
