import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import MobileTopTabs from './MobileTopTabs';
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const hasMobileTopTabs = ['/', '/friends', '/subscriptions'].includes(pathname);
  const close = () => setSidebarOpen(false);
  return <div className="app-shell"><Header onMenu={() => setSidebarOpen(v => !v)}/>{hasMobileTopTabs && <MobileTopTabs/>}<Sidebar open={sidebarOpen} onNavigate={close}/><main className={`main-content ${hasMobileTopTabs ? 'has-mobile-tabs' : ''}`}><Outlet/></main><MobileNavigation onMenu={() => setSidebarOpen(true)}/></div>;
}
