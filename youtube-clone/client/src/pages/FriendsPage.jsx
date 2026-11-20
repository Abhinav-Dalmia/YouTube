import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle, Search, Send, UserPlus, Users, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function FriendsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [friendResponse, requestResponse, chatResponse] = await Promise.all([
        api.get('/friends'), api.get('/friends/requests'), api.get('/chats')
      ]);
      setFriends(friendResponse.data.friends);
      setIncoming(requestResponse.data.incoming);
      setOutgoing(requestResponse.data.outgoing);
      const chats = chatResponse.data.conversations;
      setConversations(chats);
      setConversationId(current => current && chats.some(chat => chat._id === current) ? current : (chats[0]?._id || ''));
    } catch (e) { setError(e.response?.data?.message || 'Could not load friends and chats.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2 || !user) { setResults([]); return; }
    const timer = window.setTimeout(() => {
      api.get('/friends/search', { params: { q: search } }).then(({ data }) => setResults(data.users)).catch(e => setError(e.response?.data?.message || 'Friend search failed.'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, user]);

  const refreshMessages = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    try {
      const { data } = await api.get(`/chats/${conversationId}/messages`);
      setMessages(data.messages);
    } catch (e) { setError(e.response?.data?.message || 'Could not load this conversation.'); }
  }, [conversationId]);

  useEffect(() => {
    refreshMessages();
    if (!conversationId) return undefined;
    const timer = window.setInterval(refreshMessages, 2000);
    return () => window.clearInterval(timer);
  }, [conversationId, refreshMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, conversationId]);

  const sendRequest = async friendId => {
    setBusyId(friendId); setError('');
    try { await api.post('/friends/requests', { userId: friendId }); await loadData(); }
    catch (e) { setError(e.response?.data?.message || 'Could not send friend request.'); }
    finally { setBusyId(''); }
  };

  const respond = async (requestId, action) => {
    setBusyId(requestId); setError('');
    try {
      const { data } = await api.patch(`/friends/requests/${requestId}`, { action });
      await loadData();
      if (data.conversationId) setConversationId(data.conversationId);
    } catch (e) { setError(e.response?.data?.message || 'Could not update friend request.'); }
    finally { setBusyId(''); }
  };

  const removeFriend = async friend => {
    if (!window.confirm(`Remove ${friend.name} from your friends?`)) return;
    setError('');
    try { await api.delete(`/friends/${friend._id}`); await loadData(); }
    catch (e) { setError(e.response?.data?.message || 'Could not remove friend.'); }
  };

  const sendMessage = async event => {
    event.preventDefault();
    if (!draft.trim() || !conversationId) return;
    const text = draft.trim(); setDraft(''); setError('');
    try {
      const { data } = await api.post(`/chats/${conversationId}/messages`, { type: 'text', text });
      setMessages(current => [...current, data.message]);
      const chatResponse = await api.get('/chats'); setConversations(chatResponse.data.conversations);
    } catch (e) { setDraft(text); setError(e.response?.data?.message || 'Message could not be sent.'); }
  };

  const activeChat = conversations.find(chat => chat._id === conversationId);
  const friendInChat = activeChat?.participants?.find(participant => String(participant._id) !== String(user?._id));

  if (!user) return <div className="page chats-page"><div className="page-heading"><div><h1>YouTube Chats</h1><p>Share videos and catch up with your friends</p></div></div><section className="chats-empty"><div className="chats-empty-icon"><MessageCircle size={36}/></div><h2>Sign in to use YouTube Chats</h2><p>Sign in to find friends and start a conversation.</p><Link className="primary-button" to="/login">Sign in</Link></section></div>;

  const searchBox = <label className="friend-search" htmlFor="friend-search"><Search size={18}/><input id="friend-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or handle"/><span className="search-shortcut">2+ chars</span></label>;
  const emptyState = <section className="chats-empty" aria-live="polite"><div className="chats-empty-icon"><MessageCircle size={36}/></div><h2>Add friends to use YouTube Chats</h2><p>When you add friends, you can share videos and talk here.</p>{searchBox}<span className="friend-search-hint"><Users size={15}/> Search by a YouTube channel name or handle</span></section>;

  return <div className="page chats-page">
    <div className="page-heading chats-heading"><div><h1>YouTube Chats</h1><p>Share videos and catch up with your friends</p></div><button className="secondary-button" type="button" onClick={() => document.getElementById('friend-search')?.focus()}><UserPlus size={17}/> Add friends</button></div>
    {error && <div className="inline-error chats-error">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={15}/></button></div>}
    {loading ? <div className="loading-screen">Loading friends…</div> : <>
      {!friends.length ? emptyState : <section className="chats-layout">
        <aside className="chats-friend-list">
          <h2>Messages <span>{friends.length}</span></h2>
          {searchBox}
          <div className="chats-roster">{friends.map(friend => {
            const chat = conversations.find(item => item.participants.some(person => String(person._id) === friend._id));
            const active = chat?._id === conversationId;
            return <div className={`chat-friend-row ${active ? 'active' : ''}`} key={friend._id}><button className="chat-friend" type="button" onClick={() => chat && setConversationId(chat._id)}><Avatar user={friend} size="sm"/><span><b>{friend.name}</b><small>{chat?.lastMessage?.type === 'video' ? 'Shared a video' : chat?.lastMessage?.text || `@${friend.handle}`}</small></span></button><button className="remove-friend" title={`Remove ${friend.name}`} onClick={() => removeFriend(friend)}><X size={15}/></button></div>;
          })}</div>
        </aside>
        <section className="chat-main">
          {friendInChat ? <>
            <header className="chat-header"><Avatar user={friendInChat}/><div><b>{friendInChat.name}</b><small>@{friendInChat.handle}</small></div></header>
            <div className="chat-message-list">{messages.length ? messages.map(message => <article className={`chat-bubble ${String(message.sender?._id) === String(user._id) ? 'mine' : ''}`} key={message._id}>
              {message.type === 'video' && (message.sharedVideo ? <Link to={`/watch/${message.sharedVideo._id}`} className="chat-video-card"><div className="chat-video-thumb">{message.sharedVideo.thumbnailUrl ? <img src={message.sharedVideo.thumbnailUrl} alt=""/> : <span>▶</span>}</div><b>{message.sharedVideo.title}</b><small>Shared video</small></Link> : <div className="chat-video-unavailable">This shared video is no longer available</div>)}
              {message.text && <p>{message.text}</p>}<time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
            </article>) : <div className="chat-start-hint"><MessageCircle size={26}/><p>Say hello to {friendInChat.name}.</p></div>}<div ref={bottomRef}/></div>
            <form className="chat-compose" onSubmit={sendMessage}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Message ${friendInChat.name}`} maxLength={4000}/><button className="primary-button" disabled={!draft.trim()} aria-label="Send message"><Send size={18}/></button></form>
          </> : <div className="chat-conversation"><MessageCircle size={30}/><h2>Select a friend to chat</h2><p>Your conversations will show up here.</p></div>}
        </section>
      </section>}

      {!!incoming.length && <section className="friend-requests"><h2>Friend requests <span>{incoming.length}</span></h2>{incoming.map(request => <div className="friend-request-card" key={request._id}><Avatar user={request.from}/><div className="friend-request-copy"><b>{request.from?.name}</b><small>@{request.from?.handle}</small></div><button className="primary-button" disabled={busyId === request._id} onClick={() => respond(request._id, 'accept')}><Check size={16}/> Accept</button><button className="secondary-button" disabled={busyId === request._id} onClick={() => respond(request._id, 'decline')}>Decline</button></div>)}</section>}
      {!!outgoing.length && <section className="friend-requests outgoing-requests"><h2>Sent requests</h2>{outgoing.map(request => <div className="friend-request-card" key={request._id}><Avatar user={request.to}/><div className="friend-request-copy"><b>{request.to?.name}</b><small>Request pending</small></div></div>)}</section>}
      {query.trim().length >= 2 && <section className="friend-search-results"><h2>Search results</h2>{results.length ? results.map(person => <div className="friend-request-card" key={person._id}><Avatar user={person}/><div className="friend-request-copy"><b>{person.name}</b><small>@{person.handle}</small></div>{person.requestStatus === 'outgoing' ? <button className="secondary-button" disabled>Request sent</button> : person.requestStatus === 'incoming' ? <span className="pending-label">Check incoming requests</span> : <button className="primary-button" disabled={busyId === person._id} onClick={() => sendRequest(person._id)}><UserPlus size={16}/>{busyId === person._id ? 'Sending…' : 'Add friend'}</button>}</div>) : <p className="friend-search-empty">No accounts found for “{query.trim()}”.</p>}</section>}
    </>}
  </div>;
}
