import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle, Search, Send, UserPlus, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

function linkify(text) {
  const expression = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const nodes = [];
  let cursor = 0;
  for (const match of text.matchAll(expression)) {
    const raw = match[0];
    const url = raw.replace(/[.,!?;:)\]]+$/g, '');
    const start = match.index;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    if (url) nodes.push(<a className="chat-link" href={url.startsWith('www.') ? `https://${url}` : url} target="_blank" rel="noopener noreferrer" key={`url-${start}`}>{url}</a>);
    if (url.length < raw.length) nodes.push(raw.slice(url.length));
    cursor = start + raw.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
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
      setConversationId(current => current && chats.some(chat => chat._id === current) ? current : '');
    } catch (e) { setError(e.response?.data?.message || 'Could not load friends and chats.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2 || !user) { setResults([]); setSearching(false); return; }
    setResults([]); setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api.get('/friends/search', { params: { q: search }, signal: controller.signal }).then(({ data }) => setResults(data.users)).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Friend search failed.'); }).finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
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
  const emptyState = <section className="chats-empty" aria-live="polite"><div className="chats-empty-icon"><MessageCircle size={36}/></div><h2>Add friends to use YouTube Chats</h2><p>When you add friends, you can share videos and talk here.</p><button className="secondary-button" onClick={() => document.getElementById('friend-search')?.focus()}><UserPlus size={16}/> Find people</button></section>;

  return <div className="page chats-page">
    <div className="page-heading chats-heading"><div><h1>YouTube Chats</h1><p>Share videos and catch up with your friends</p></div><button className="secondary-button" type="button" onClick={() => document.getElementById('friend-discovery')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><UserPlus size={17}/> Add friends</button></div>
    {error && <div className="inline-error chats-error">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={15}/></button></div>}
    {loading ? <div className="loading-screen">Loading friends…</div> : <>
      {!friends.length ? emptyState : <section className="chats-layout">
        <aside className="chats-friend-list">
          <h2>Messages <span>{friends.length}</span></h2>
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
              {message.text && <p>{linkify(message.text)}</p>}<time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
            </article>) : <div className="chat-start-hint"><MessageCircle size={26}/><p>Say hello to {friendInChat.name}.</p></div>}<div ref={bottomRef}/></div>
            <form className="chat-compose" onSubmit={sendMessage}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Message ${friendInChat.name}`} maxLength={4000}/><button className="primary-button" disabled={!draft.trim()} aria-label="Send message"><Send size={18}/></button></form>
          </> : <div className="chat-conversation"><div className="chat-select-icon"><MessageCircle size={30}/></div><h2>Select a conversation</h2><p>Choose a friend from the list to open your chat.</p></div>}
        </section>
      </section>}

      <section className="friend-discovery" id="friend-discovery">
        <div className="friend-discovery-heading"><div><span className="friend-discovery-kicker">GROW YOUR CIRCLE</span><h2>Find friends</h2><p>Search for people by their channel name or handle.</p></div>{searchBox}</div>
        {query.trim().length >= 2 && <div className="friend-search-results"><div className="friend-results-heading"><h3>Search results</h3><span>{searching ? 'Searching…' : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}</span></div>{searching ? <div className="friend-search-empty">Looking for matching accounts…</div> : results.length ? <div className="friend-results-grid">{results.map(person => <article className="friend-result-card" key={person._id}><Avatar user={person} size="lg"/><div className="friend-result-identity"><b>{person.name}</b><span>@{person.handle}</span></div>{person.requestStatus === 'outgoing' ? <button className="secondary-button pending-button" disabled><Check size={15}/> Request sent</button> : person.requestStatus === 'incoming' ? <button className="secondary-button pending-button" onClick={() => document.querySelector('.friend-requests')?.scrollIntoView({ behavior: 'smooth' })}>Respond to request</button> : <button className="primary-button add-friend-button" disabled={busyId === person._id} onClick={() => sendRequest(person._id)}><UserPlus size={16}/>{busyId === person._id ? 'Sending…' : 'Add friend'}</button>}</article>)}</div> : <div className="friend-search-empty"><Search size={20}/><b>No people found</b><span>Try another name or handle.</span></div>}</div>}
        {!!incoming.length && <section className="friend-requests"><div className="friend-results-heading"><h3>Friend requests <span>{incoming.length}</span></h3></div><div className="friend-results-grid">{incoming.map(request => <article className="friend-result-card" key={request._id}><Avatar user={request.from} size="lg"/><div className="friend-result-identity"><b>{request.from?.name}</b><span>@{request.from?.handle}</span></div><div className="friend-result-actions"><button className="primary-button add-friend-button" disabled={busyId === request._id} onClick={() => respond(request._id, 'accept')}><Check size={15}/> Accept</button><button className="secondary-button pending-button" disabled={busyId === request._id} onClick={() => respond(request._id, 'decline')}>Decline</button></div></article>)}</div></section>}
        {!!outgoing.length && <section className="friend-requests outgoing-requests"><div className="friend-results-heading"><h3>Sent requests</h3></div><div className="friend-results-grid">{outgoing.map(request => <article className="friend-result-card" key={request._id}><Avatar user={request.to} size="lg"/><div className="friend-result-identity"><b>{request.to?.name}</b><span>@{request.to?.handle}</span></div><span className="pending-label">Pending</span></article>)}</div></section>}
      </section>
    </>}
  </div>;
}
