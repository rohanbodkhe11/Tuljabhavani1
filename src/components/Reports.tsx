import { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Users, Wallet, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MeetingSummary {
  date: string;
  total: number;
  memberCount: number;
}

export default function Reports() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/meetings')
      .then(res => res.json())
      .then(data => {
        const meetingsList = Array.isArray(data) ? data : [];
        setMeetings([...meetingsList].reverse().slice(-6));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMeetings([]);
        setLoading(false);
      });
  }, []);

  const totalSaving = meetings.reduce((acc, m) => acc + m.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">अहवाल आणि विश्लेषण</h1>
        <p className="text-stone-500 font-medium mt-1">बचत गटाची आर्थिक प्रगती</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-16 h-16 text-emerald-600" />
          </div>
          <p className="text-sm font-black text-stone-400 uppercase tracking-widest mb-2">एकूण जमा (शेवटच्या ६ मीटिंग)</p>
          <p className="text-4xl font-black text-emerald-600 tracking-tighter">₹{totalSaving.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            <span>+१२% मागील महिन्यापेक्षा</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <p className="text-sm font-black text-stone-400 uppercase tracking-widest mb-2">सरासरी हजेरी</p>
          <p className="text-4xl font-black text-blue-600 tracking-tighter">९५%</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 w-fit px-2 py-1 rounded-lg">
            <Users className="w-3 h-3" />
            <span>स्थिर</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16 text-orange-600" />
          </div>
          <p className="text-sm font-black text-stone-400 uppercase tracking-widest mb-2">कर्जवाटप प्रमाण</p>
          <p className="text-4xl font-black text-orange-600 tracking-tighter">७०%</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-50 w-fit px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            <span>+५% वाढ</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
        <h3 className="text-xl font-black text-stone-800 mb-8 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          महिन्यानिहाय बचत कल
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={meetings}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a8a29e', fontWeight: 700, fontSize: 12 }}
                dy={10}
                tickFormatter={(val) => new Date(val).toLocaleDateString('mr-IN', { month: 'short' })}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a8a29e', fontWeight: 700, fontSize: 12 }}
                dx={-10}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px'
                }}
                labelStyle={{ fontWeight: 800, color: '#444', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 700, color: '#10b981' }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                {meetings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
