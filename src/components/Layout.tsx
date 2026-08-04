import React, { useState } from 'react';
import { User, Users, Calendar, History, PieChart, Settings, LogOut, Menu, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  [key: string]: any;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 transition-all ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
        : 'text-stone-500 hover:bg-stone-50 hover:text-emerald-600'
    }`}
  >
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-inherit'}`} />
    <span className="font-bold text-lg">{label}</span>
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

  const menuItems = [
    { id: 'dashboard', label: 'डॅशबोर्ड', icon: PieChart },
    { id: 'members', label: 'सदस्य', icon: Users },
    { id: 'meeting', label: 'मीटिंग रजिस्टर', icon: Calendar },
    { id: 'history', label: 'इतिहास', icon: History },
    { id: 'reports', label: 'अहवाल', icon: TrendingUp },
    { id: 'settings', label: 'सेटिंग्ज', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white flex-col border-r border-stone-100 shadow-sm fixed inset-y-0">
        <div className="p-8 border-b border-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">तु</div>
            <h1 className="text-xl font-black text-stone-800 tracking-tight">तुळजाभवानी</h1>
          </div>
          <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">महिला बचत गट</p>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-stone-50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 border border-stone-200">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-stone-800 truncate">{user.email}</p>
              <p className="text-xs text-stone-400 font-bold uppercase">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            बाहेर पडा
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-100 p-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-lg">तु</div>
          <h1 className="text-lg font-black text-stone-800">तुळजाभवानी</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-stone-600 bg-stone-50 rounded-lg border border-stone-100"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 bg-white md:hidden"
          >
            <div className="p-4 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-lg">तु</div>
                <h1 className="text-lg font-black text-stone-800">तुळजाभवानी</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X />
              </button>
            </div>
            <nav className="py-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 ${
                    activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-stone-500'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="font-bold text-lg">{item.label}</span>
                </button>
              ))}
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-4 px-6 py-4 text-red-500 mt-4"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-bold text-lg">बाहेर पडा</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
