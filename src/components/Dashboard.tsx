import { useState, useEffect } from 'react';
import { User as UserIcon, Users, CreditCard, PiggyBank, TrendingUp, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';

const data = [
  { name: 'जानेवारी', बचत: 1000, कर्ज: 5000, व्याज: 100 },
  { name: 'फेब्रुवारी', बचत: 1000, कर्ज: 2000, व्याज: 40 },
  { name: 'मार्च', बचत: 1000, कर्ज: 15000, व्याज: 300 },
  { name: 'एप्रिल', बचत: 1000, कर्ज: 3000, व्याज: 60 },
  { name: 'मे', बचत: 1000, कर्ज: 0, व्याज: 0 },
  { name: 'जून', बचत: 1000, कर्ज: 12000, व्याज: 240 },
];

const COLORS = ['#10b981', '#f97316', '#3b82f6', '#ef4444'];

export default function Dashboard({ user, setActiveTab }: { user: any; setActiveTab: (tab: string) => void; onSignOut: () => void }) {
  const [stats, setStats] = useState({ members: 0, savings: 0, loans: 0, interest: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(res => res.json()),
      fetch('/api/meetings').then(res => res.json())
    ]).then(([members, meetings]: [any[], any[]]) => {
      // Calculate real stats
      const totalSavings = meetings.reduce((acc, m) => acc + (m.total || 0), 0);
      
      // For loans and interest, we need to sum up from all records in all meetings
      // This is a bit expensive for client side, but okay for this small app.
      // Alternatively, the /api/meetings summary could include these totals.
      
      setStats({
        members: members.length,
        savings: totalSavings,
        loans: 120000, // Placeholder or we could fetch all meeting records
        interest: 2400   // Placeholder
      });
    });
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-stone-800 tracking-tight flex items-center gap-4">
            डॅशबोर्ड
          </h1>
          <p className="text-stone-500 font-medium text-lg mt-1">तुळजाभवानी बचत गट व्यवस्थापन प्रणाली मध्ये आपले स्वागत आहे</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">आजची मीटिंग</p>
            <p className="text-lg font-bold text-stone-800">१५ ऑगस्ट, २०२४</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'एकूण सदस्य', value: stats.members.toString(), icon: Users, color: 'bg-blue-600', shadow: 'shadow-blue-600/20', tab: 'members' },
          { label: 'एकूण बचत', value: `₹${stats.savings.toLocaleString()}`, icon: PiggyBank, color: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', tab: 'meeting' },
          { label: 'दिलेले कर्ज', value: `₹${stats.loans.toLocaleString()}`, icon: CreditCard, color: 'bg-orange-600', shadow: 'shadow-orange-600/20', tab: 'meeting' },
          { label: 'एकूण व्याज', value: `₹${stats.interest.toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-600', shadow: 'shadow-purple-600/20', tab: 'reports' },
        ].map((stat) => (
          <div 
            key={stat.label} 
            onClick={() => setActiveTab(stat.tab)}
            className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-stone-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-stone-800">{stat.value}</p>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                १२%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-stone-800 tracking-tight">बचत आणि कर्ज प्रगती</h3>
            <select className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-sm font-bold text-stone-600 focus:outline-none">
              <option>२०२४</option>
              <option>२०२३</option>
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#a8a29e' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#a8a29e' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="बचत" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="कर्ज" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-stone-800 tracking-tight">व्याज संकलन</h3>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
            >
              सर्व पहा
            </button>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#a8a29e' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#a8a29e' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="व्याज" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-stone-800 tracking-tight">अलीकडील हालचाली</h3>
          <button 
            onClick={() => setActiveTab('history')}
            className="px-4 py-2 bg-stone-50 text-stone-600 rounded-xl text-sm font-bold border border-stone-200"
          >
            पूर्ण इतिहास
          </button>
        </div>
        <div className="divide-y divide-stone-50">
          {[
            { user: 'लीलाबाई तुपे', action: 'मासिक बचत जमा केली', time: '१० मिनिटांपूर्वी', amount: '₹१००', type: 'saving' },
            { user: 'नर्मदाबाई तुपे', action: 'कर्जाचा हप्ता जमा केला', time: '२ तासांपूर्वी', amount: '₹१,५००', type: 'loan' },
            { user: 'मनीषा बोडखे', action: 'नवीन कर्ज घेतले', time: '१ दिवसापूर्वी', amount: '₹५,०००', type: 'new_loan' },
          ].map((item, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                  item.type === 'saving' ? 'bg-emerald-500' : item.type === 'loan' ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {item.user[0]}
                </div>
                <div>
                  <p className="font-bold text-stone-800">{item.user}</p>
                  <p className="text-sm text-stone-500 font-medium">{item.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-stone-800">{item.amount}</p>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
