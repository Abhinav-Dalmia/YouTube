import { useState } from 'react';
import { MessageCircle, Search, UserPlus, Users } from 'lucide-react';

export default function FriendsPage() {
  const [query, setQuery] = useState('');
  const friends = [];

  return (
    <div className="page chats-page">
      <div className="page-heading chats-heading">
        <div><h1>YouTube Chats</h1><p>Share videos and catch up with your friends</p></div>
        <button className="secondary-button" type="button" onClick={() => document.getElementById('friend-search')?.focus()}><UserPlus size={17}/> Add friends</button>
      </div>
      {friends.length === 0 ? (
        <section className="chats-empty" aria-live="polite">
          <div className="chats-empty-icon"><MessageCircle size={36}/></div>
          <h2>Add friends to use YouTube Chats</h2>
          <p>When you add friends, you can share videos and talk here.</p>
          <label className="friend-search" htmlFor="friend-search"><Search size={18}/><input id="friend-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search friends by name or handle"/><button type="button" aria-label="Find friends"><UserPlus size={18}/></button></label>
          <span className="friend-search-hint"><Users size={15}/> Your friends will appear here</span>
        </section>
      ) : (
        <section className="chats-layout">
          <aside className="chats-friend-list"><h2>Messages</h2><label className="friend-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search friends"/></label>{friends.map(friend => <button className="chat-friend" key={friend.id} type="button">{friend.name}</button>)}</aside>
          <div className="chat-conversation"><MessageCircle size={30}/><h2>Select a friend to chat</h2><p>Your conversations will show up here.</p></div>
        </section>
      )}
    </div>
  );
}
