import React, { useState } from 'react';
import { User, Users, Calendar, History, PieChart, Settings, LogOut, Menu, X, TrendingUp, Plus, Bell, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  key?: string;
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 transition-all rounded-2xl mx-auto w-[90%] ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 font-black scale-[1.01]' 
        : 'text-stone-600 hover:bg-stone-100/70 hover:text-emerald-700 font-bold'
    }`}
  >
    <div className="flex items-center gap-4">
      <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-stone-500'}`} />
      <span className="text-base">{label}</span>
    </div>
    {badge && (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
        active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

export default function Layout({ 
  user, 
  onSignOut, 
  children,
  activeTab,
  setActiveTab
}: { 
  user: any; 
  onSignOut: () => void; 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'डॅशबोर्ड', icon: PieChart, shortLabel: 'डॅशबोर्ड' },
    { id: 'members', label: 'सदस्य व्यवस्थापन', icon: Users, shortLabel: 'सदस्य' },
    { id: 'meeting', label: 'मीटिंग रजिस्टर', icon: Calendar, shortLabel: 'मीटिंग', badge: 'नवी' },
    { id: 'history', label: 'मीटिंग इतिहास', icon: History, shortLabel: 'इतिहास' },
    { id: 'reports', label: 'मासिक अहवाल', icon: TrendingUp, shortLabel: 'अहवाल' },
    { id: 'settings', label: 'सेटिंग्ज', icon: Settings, shortLabel: 'सेटिंग्ज' },
  ];

  const bottomNavItems = [
    { id: 'dashboard', label: 'डॅशबोर्ड', icon: PieChart },
    { id: 'members', label: 'सदस्य', icon: Users },
    { id: 'meeting', label: 'मीटिंग', icon: Calendar },
    { id: 'history', label: 'इतिहास', icon: History },
    { id: 'reports', label: 'अहवाल', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">
      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl border border-stone-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2 text-emerald-700 font-black">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span>सूचना व अपडेट्स</span>
                </div>
                <button onClick={() => setShowNotificationModal(false)} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 font-bold space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 font-black">मासिक सभा रिमायंडर</span>
                    <span className="text-[10px] text-emerald-600">आज</span>
                  </div>
                  <p className="font-medium text-emerald-800">चालू महिन्याची सभा नोंद करण्यासाठी मीटिंग रजिस्टर विभागात जा.</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-700 font-medium">
                  <p className="font-bold text-stone-900">ॲप ऑफलाईन वापरासाठी तयार आहे (PWA)</p>
                  <p className="text-stone-500 mt-0.5">नेटवर्क नसतानाही तुम्ही नोंदी पाहू शकता.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20"
              >
                समजले
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white flex-col border-r border-stone-100 shadow-sm fixed inset-y-0 z-20">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-600/30">
              तु
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight leading-tight">तुळजाभवानी</h1>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">महिला बचत गट</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shadow-sm border border-emerald-200">
              {user.email ? user.email[0].toUpperCase() : 'उ'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-stone-900 truncate">{user.email}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs text-emerald-700 font-bold">{user.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm border border-stone-200"
          >
            <LogOut className="w-4 h-4" />
            बाहेर पडा
          </button>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-40 flex items-center justify-between shadow-xs pt-safe">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition-all active:scale-95 border border-stone-100"
            aria-label="ओपन मेनू"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2.5" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/30">
              तु
            </div>
            <div>
              <h1 className="text-base font-black text-stone-900 leading-none">तुळजाभवानी</h1>
              <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mt-0.5">महिला बचत गट</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl relative border border-stone-100 active:scale-95"
          >
            <Bell className="w-5 h-5 text-stone-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
            {user.role === 'अध्यक्षा' ? 'अ' : 'स'}
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-white flex flex-col shadow-2xl z-10"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white text-emerald-700 rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                    तु
                  </div>
                  <div>
                    <h2 className="font-black text-lg leading-tight">तुळजाभवानी</h2>
                    <p className="text-xs font-bold text-emerald-100">महिला बचत गट</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black text-base shadow-xs border border-emerald-200">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-stone-900 truncate">{user.email}</p>
                  <p className="text-[11px] text-emerald-700 font-extrabold">{user.role}</p>
                </div>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20' 
                        : 'text-stone-700 font-bold hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-stone-500'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeTab === item.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-stone-100">
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl font-bold text-sm transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>बाहेर पडा (Logout)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 sm:p-6 md:p-10 min-h-screen pb-28 md:pb-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Action Button (FAB) for Quick Meeting Action on Mobile */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setActiveTab('meeting')}
        className="md:hidden fixed bottom-20 right-4 z-30 bg-emerald-600 text-white p-4 rounded-full shadow-2xl shadow-emerald-600/50 flex items-center justify-center ring-4 ring-emerald-600/20 active:bg-emerald-700"
        aria-label="नवीन मीटिंग घ्या"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </motion.button>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-safe">
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[64px] ${
                isActive ? 'text-emerald-600 font-black' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all ${
                isActive ? 'bg-emerald-100 text-emerald-700 scale-110 shadow-xs' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] mt-0.5 leading-none ${isActive ? 'font-black text-emerald-800' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

