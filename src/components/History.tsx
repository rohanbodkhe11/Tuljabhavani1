import { useState, useEffect } from 'react';
import { Calendar, Search, Eye, Loader2 } from 'lucide-react';
import { fetchMeetingSummaries } from '../lib/dbService';

interface MeetingSummary {
  date: string;
  total: number;
  memberCount: number;
}

export default function History({ onViewMeeting }: { onViewMeeting: (date: string) => void }) {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMeetingSummaries()
      .then(data => {
        setMeetings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMeetings([]);
        setLoading(false);
      });
  }, []);

  const filteredMeetings = meetings.filter(m => m.date.includes(searchTerm));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">मीटिंग इतिहास</h1>
          <p className="text-stone-500 font-medium mt-1">मागील सर्व मीटिंग्सची यादी</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="तारीख शोधा (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold transition-all"
            />
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="p-20 text-center">
            <Calendar className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-bold">कोणत्याही मीटिंग्स सापडल्या नाहीत.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-6 py-5 text-xs font-black text-stone-400 uppercase tracking-widest">तारीख</th>
                  <th className="px-6 py-5 text-xs font-black text-stone-400 uppercase tracking-widest text-center">सदस्य संख्या</th>
                  <th className="px-6 py-5 text-xs font-black text-stone-400 uppercase tracking-widest text-right">एकूण जमा (₹)</th>
                  <th className="px-6 py-5 text-xs font-black text-stone-400 uppercase tracking-widest text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.date} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-stone-800">{new Date(meeting.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-stone-500">{meeting.memberCount}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">₹{meeting.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewMeeting(meeting.date)}
                        className="p-3 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
