import { useState, useEffect } from 'react';
import { Calendar, Search, Eye, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { fetchMeetingSummaries, deleteMeeting } from '../lib/dbService';

interface MeetingSummary {
  date: string;
  total: number;
  memberCount: number;
}

export default function History({ userRole, onViewMeeting }: { userRole?: string, onViewMeeting: (date: string) => void }) {
  const isAdmin = userRole === 'अध्यक्षा' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'adhyaksha';
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deletingDate || !isAdmin) return;
    setIsDeleting(true);
    try {
      await deleteMeeting(deletingDate);
      setMeetings(prev => prev.filter(m => m.date !== deletingDate));
      setDeletingDate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

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
      {/* Delete Confirmation Modal */}
      {deletingDate && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-6 flex items-center justify-between bg-red-50/60 border-b border-red-100">
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                मीटिंग इतिहास हटवा
              </h2>
              <button onClick={() => setDeletingDate(null)} className="p-2 hover:bg-stone-200/50 rounded-xl">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </header>
            <div className="p-6 space-y-4">
              <p className="text-stone-700 font-medium leading-relaxed">
                तुम्हाला <span className="font-bold text-stone-900">{new Date(deletingDate).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span> या तारखेचा मीटिंग इतिहास नक्की हटवायचा आहे का?
              </p>
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                ही कारवाई कायमस्वरूपी असून हटवलेली माहिती पुन्हा मिळवता येणार नाही.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeletingDate(null)}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-all text-sm"
                >
                  रद्द करा
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  होय, हटवा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onViewMeeting(meeting.date)}
                          title="मीटिंग पहा"
                          className="p-2.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setDeletingDate(meeting.date)}
                          disabled={!isAdmin}
                          title={isAdmin ? "मीटिंग इतिहास हटवा" : "केवळ अध्यक्षांना परवानगी आहे"}
                          className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
