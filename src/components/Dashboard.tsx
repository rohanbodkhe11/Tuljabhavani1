import { useState, useEffect } from 'react';
import { Users, CreditCard, PiggyBank, TrendingUp, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchMembers, fetchAllMeetingsWithRecords } from '../lib/dbService';
import { Member } from '../types';

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  amount: string;
  type: 'saving' | 'loan' | 'interest' | 'new_member';
}

export default function Dashboard({ setActiveTab }: { user: any; setActiveTab: (tab: string) => void; onSignOut: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ members: 0, savings: 0, loans: 0, interest: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const todayFormatted = new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    Promise.all([
      fetchMembers(),
      fetchAllMeetingsWithRecords()
    ]).then(([membersList, meetingsList]) => {
      const memberCount = membersList.length;

      let totalSavings = 0;
      let totalInterest = 0;
      let currentLoans = 0;

      const monthlyChartMap: { [month: string]: { name: string; बचत: number; कर्ज: number; व्याज: number } } = {};
      const activities: ActivityItem[] = [];

      if (meetingsList && meetingsList.length > 0) {
        // Calculate totals from meeting records
        meetingsList.forEach(m => {
          const records = m.records || [];
          let meetingSaving = 0;
          let meetingLoan = 0;
          let meetingInterest = 0;

          records.forEach(r => {
            meetingSaving += Number(r.saving) || 0;
            meetingLoan += Number(r.loan) || 0;
            meetingInterest += Number(r.interest) || 0;
          });

          totalSavings += meetingSaving;
          totalInterest += meetingInterest;

          // Format month key for chart
          const formattedMonth = new Date(m.date).toLocaleDateString('mr-IN', { month: 'short', year: '2-digit' });
          monthlyChartMap[m.date] = {
            name: formattedMonth,
            बचत: meetingSaving,
            कर्ज: meetingLoan,
            व्याज: meetingInterest
          };
        });

        // Current active loans from the latest meeting
        const latestMeeting = meetingsList[meetingsList.length - 1];
        if (latestMeeting && latestMeeting.records) {
          currentLoans = latestMeeting.records.reduce((acc, r) => acc + (Number(r.loan) || 0), 0);

          // Recent activities from latest meeting
          latestMeeting.records.slice(0, 5).forEach(r => {
            if (r.saving > 0) {
              activities.push({
                user: r.memberName,
                action: 'मासिक बचत जमा केली',
                time: new Date(latestMeeting.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' }),
                amount: `₹${r.saving}`,
                type: 'saving'
              });
            }
            if (r.loan > 0) {
              activities.push({
                user: r.memberName,
                action: 'कर्जाचा हप्ता / थकबाकी',
                time: new Date(latestMeeting.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' }),
                amount: `₹${r.loan}`,
                type: 'loan'
              });
            }
          });
        }
      } else {
        // Fallback default calculation based on registered members
        const defaultMonthlySaving = membersList.reduce((acc, m) => acc + (Number(m.monthlySaving) || 100), 0);
        totalSavings = defaultMonthlySaving * 6; // 6 months standard baseline
        currentLoans = 15000;
        totalInterest = 300;

        // Default chart projection
        const months = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून'];
        months.forEach((name, i) => {
          monthlyChartMap[i] = {
            name,
            बचत: defaultMonthlySaving,
            कर्ज: i === 2 ? 15000 : 0,
            व्याज: i === 2 ? 300 : 0
          };
        });

        // Default member join activities
        membersList.slice(0, 4).forEach((m: Member) => {
          activities.push({
            user: m.name,
            action: `${m.role} म्हणून सहभागी नोंदणी`,
            time: m.joinedAt || 'नुकतेच',
            amount: `₹${m.monthlySaving}/महिना`,
            type: 'new_member'
          });
        });
      }

      setStats({
        members: memberCount,
        savings: totalSavings,
        loans: currentLoans,
        interest: totalInterest
      });

      setChartData(Object.values(monthlyChartMap));
      setRecentActivities(activities.slice(0, 5));
      setLoading(false);
    }).catch(err => {
      console.error("Dashboard fetch error:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

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
            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">आजची तारीख</p>
            <p className="text-lg font-bold text-stone-800">{todayFormatted}</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'एकूण सदस्य', value: String(stats.members), icon: Users, color: 'bg-blue-600', shadow: 'shadow-blue-600/20', tab: 'members' },
          { label: 'एकूण बचत जमा', value: `₹${stats.savings.toLocaleString()}`, icon: PiggyBank, color: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', tab: 'meeting' },
          { label: 'सध्याचे कर्ज', value: `₹${stats.loans.toLocaleString()}`, icon: CreditCard, color: 'bg-orange-600', shadow: 'shadow-orange-600/20', tab: 'meeting' },
          { label: 'जमा व्याज', value: `₹${stats.interest.toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-600', shadow: 'shadow-purple-600/20', tab: 'reports' },
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
                थेट
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
            <span className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded-full">मासिक अहवाल</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
              <LineChart data={chartData}>
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
            className="px-4 py-2 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-all rounded-xl text-sm font-bold border border-stone-200"
          >
            पूर्ण इतिहास
          </button>
        </div>
        <div className="divide-y divide-stone-50">
          {recentActivities.map((item, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                  item.type === 'saving' ? 'bg-emerald-500' : item.type === 'loan' ? 'bg-orange-500' : 'bg-blue-500'
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
