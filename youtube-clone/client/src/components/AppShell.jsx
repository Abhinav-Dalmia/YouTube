import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);
  return <div className="app-shell"><Header onMenu={() => setSidebarOpen(v => !v)}/><Sidebar open={sidebarOpen} onNavigate={close}/><main className="main-content"><Outlet/></main></div>;
}
