import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import WatchPage from './pages/WatchPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ShortsPage from './pages/ShortsPage';
import ChannelPage from './pages/ChannelPage';
import UploadPage from './pages/UploadPage';
import StudioPage from './pages/StudioPage';
import AuthPage from './pages/AuthPage';
import { HistoryPage, LikedPage, PlaylistsPage, PlaylistPage, WatchLaterPage } from './pages/LibraryPage';
import PlaceholderPage from './pages/PlaceholderPage';
import FriendsPage from './pages/FriendsPage';
import './styles.css';

function RouteLoader() { return <div className="loading-screen">Loading…</div>; }
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<AppShell/>}>
      <Route index element={<HomePage/>}/>
      <Route path="search" element={<SearchPage/>}/>
      <Route path="watch/:id" element={<WatchPage/>}/>
      <Route path="shorts" element={<ShortsPage/>}/>
      <Route path="subscriptions" element={<SubscriptionsPage/>}/>
      <Route path="channel/:handle" element={<ChannelPage/>}/>
      <Route path="history" element={<HistoryPage/>}/>
      <Route path="liked" element={<LikedPage/>}/>
      <Route path="playlists" element={<PlaylistsPage/>}/>
      <Route path="playlist/:id" element={<PlaylistPage/>}/>
      <Route path="upload" element={<UploadPage/>}/>
      <Route path="studio" element={<StudioPage/>}/>
      <Route path="settings" element={<PlaceholderPage/>}/>
      <Route path="watch-later" element={<WatchLaterPage/>}/>
      <Route path="friends" element={<FriendsPage/>}/>
      <Route path="explore/:section" element={<PlaceholderPage/>}/>
      <Route path="*" element={<PlaceholderPage/>}/>
    </Route>
  </Routes></BrowserRouter></AuthProvider>;
}
