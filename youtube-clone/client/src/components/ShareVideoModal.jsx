import { useEffect, useState } from 'react';
import { Check, Link2, Search, Send, X } from 'lucide-react';
import api from '../lib/api';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

export default function ShareVideoModal({ video, onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([api.get('/friends'), api.get('/chats')]).then(([friendResponse, chatResponse]) => {
      setFriends(friendResponse.data.friends);
      setConversations(chatResponse.data.conversations);
    }).catch(e => setError(e.response?.data?.message || 'Could not load your friends.')).finally(() => setLoading(false));
  }, [user]);

  const filtered = friends.filter(friend => `${friend.name} ${friend.handle}`.toLowerCase().includes(query.toLowerCase()));
  const share = async () => {
    if (!selected) return;
    setSending(true); setError('');
    try {
      const chat = conversations.find(item => item.participants.some(participant => String(participant._id) === selected));
      if (!chat) throw new Error('Start a chat with this friend before sharing a video.');
      const { data } = await api.post(`/chats/${chat._id}/messages`, { type: 'video', videoId: video._id });
      setSentTo(data.message.sender?._id || selected);
      setSentTo(friends.find(friend => friend._id === selected)?.name || 'your friend');
      window.setTimeout(onClose, 800);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Could not share this video.'); }
    finally { setSending(false); }
  };

  return <div className="share-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-video-title">
      <header><div><h2 id="share-video-title">Share video</h2><p>{video.title}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button></header>
      {!user ? <div className="share-modal-message">Sign in to share videos with friends.</div> : loading ? <div className="share-modal-message">Loading friends…</div> : <>
        <label className="friend-search share-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search friends" autoFocus/></label>
        <div className="share-friend-options">{filtered.length ? filtered.map(friend => <button className={`share-friend-option ${selected === friend._id ? 'selected' : ''}`} key={friend._id} onClick={() => setSelected(friend._id)}><Avatar user={friend} size="sm"/><span><b>{friend.name}</b><small>@{friend.handle}</small></span>{selected === friend._id && <Check size={18}/>}</button>) : <div className="share-modal-message">{friends.length ? 'No friends match that search.' : 'Add friends before sharing videos.'}</div>}</div>
        {error && <p className="share-error">{error}</p>}
        {sentTo ? <div className="share-success"><Check size={17}/> Shared with {sentTo}</div> : <footer><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/watch/${video._id}`)}><Link2 size={16}/> Copy link</button><button className="primary-button" disabled={!selected || sending || !friends.length} onClick={share}><Send size={16}/>{sending ? 'Sharing…' : 'Send'}</button></footer>}
      </>}
    </section>
  </div>;
}
