/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import Members from './components/Members';
import MeetingRegister from './components/Meetings';
import Settings from './components/Settings';
import History from './components/History';
import Reports from './components/Reports';

export default function App() {
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('bg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meetingDate, setMeetingDate] = useState<string | null>(null);

  const handleSignOut = () => {
    localStorage.removeItem('bg_user');
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} setActiveTab={setActiveTab} onSignOut={handleSignOut} />;
      case 'members':
        return <Members userRole={user.role} />;
      case 'meeting':
        return <MeetingRegister userRole={user.role} initialDate={meetingDate} onDateChange={() => setMeetingDate(null)} />;
      case 'history':
        return <History userRole={user.role} onViewMeeting={(date) => {
          setMeetingDate(date);
          setActiveTab('meeting');
        }} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings userRole={user.role} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <h2 className="text-2xl font-black text-stone-800 mb-2">लवकरच येत आहे...</h2>
            <p className="text-stone-500">हे मॉड्यूल सध्या विकसित केले जात आहे.</p>
          </div>
        );
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
        <Auth onAuthSuccess={(u: any) => {
          setUser(u);
          localStorage.setItem('bg_user', JSON.stringify(u));
        }} />
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onSignOut={handleSignOut}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
}

