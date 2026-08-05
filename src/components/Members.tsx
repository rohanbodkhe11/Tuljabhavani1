import { Member } from '../types';
import { UserPlus, Search, Download, Trash2, Edit2, Loader2, X, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchMembers as getMembersFromDb, addMember, updateMember, deleteMember } from '../lib/dbService';

export default function Members({ userRole }: { userRole: string }) {
  const isAdmin = userRole === 'अध्यक्षा' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'adhyaksha';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getMembersFromDb();
      setMembers(data);
    } catch (err) {
      console.error("Error loading members:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.role) return;
    
    setSaving(true);
    try {
      if (editingMember.id) {
        await updateMember(editingMember.id, editingMember);
      } else {
        await addMember({
          name: editingMember.name,
          role: editingMember.role,
          monthlySaving: editingMember.monthlySaving
        });
      }
      setIsModalOpen(false);
      setEditingMember(null);
      await loadMembers();
    } catch (e) {
      console.error("Error saving member:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('तुम्हाला खात्री आहे का की तुम्हाला हा सदस्य हटवायचा आहे?')) return;
    
    try {
      await deleteMember(id);
      await loadMembers();
    } catch (e) {
      console.error("Error deleting member:", e);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('साई श्रद्धा महिला बचत गट', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('सदस्य यादी', 105, 25, { align: 'center' });

    autoTable(doc, {
      startY: 35,
      head: [['क्र', 'सदस्याचे नाव', 'पद', 'मासिक बचत']],
      body: members.map((m, i) => [i + 1, m.name, m.role, `Rs. ${m.monthlySaving}`]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save('Members_List.pdf');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">सदस्य व्यवस्थापन</h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5">सर्व सदस्यांची यादी आणि माहिती</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingMember({ name: '', role: 'सदस्य', monthlySaving: 100 });
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-sm"
          >
            <UserPlus className="w-5 h-5" />
            नवीन सदस्य जोडा
          </button>
        )}
      </header>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="सदस्य शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-sm transition-all"
            />
          </div>
          <button 
            onClick={generatePDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-stone-700 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors font-bold text-xs sm:text-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            PDF डाउनलोड करा
          </button>
        </div>

        {/* Mobile View: Cards Layout (< 640px) */}
        <div className="block sm:hidden divide-y divide-stone-100">
          {filteredMembers.map((member, index) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shadow-xs border border-emerald-200 shrink-0">
                  {member.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 text-sm">{member.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      member.role === 'अध्यक्षा' ? 'bg-orange-100 text-orange-700' :
                      member.role === 'सचिव' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-bold mt-0.5">मासिक बचत: <span className="text-emerald-700 font-black">₹{member.monthlySaving}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setEditingMember(member);
                    setIsModalOpen(true);
                  }}
                  disabled={!isAdmin}
                  className="p-2.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-30 active:scale-95"
                  title="सुधारा"
                >
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                </button>
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  disabled={!isAdmin}
                  className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 active:scale-95"
                  title="हटवा"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Tablet View: Table Layout (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">क्र</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">सदस्याचे नाव</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">पद</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">मासिक बचत</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredMembers.map((member, index) => (
                <tr key={member.id} className="hover:bg-stone-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-stone-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-100">
                        {member.name[0]}
                      </div>
                      <span className="font-black text-stone-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      member.role === 'अध्यक्षा' ? 'bg-orange-100 text-orange-700' :
                      member.role === 'सचिव' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-700">₹{member.monthlySaving}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => {
                          setEditingMember(member);
                          setIsModalOpen(true);
                        }}
                        title={isAdmin ? "सदस्याची माहिती बदला" : "केवळ अध्यक्षांना परवानगी आहे"}
                        className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-30 active:scale-95" 
                        disabled={!isAdmin}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        title={isAdmin ? "सदस्य हटवा" : "केवळ अध्यक्षांना परवानगी आहे"}
                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 active:scale-95" 
                        disabled={!isAdmin}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Touch-Friendly Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-stone-100 animate-in slide-in-from-bottom duration-200">
            <header className="p-6 sm:p-8 flex items-center justify-between bg-stone-50 border-b border-stone-100">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {editingMember?.id ? 'सदस्य माहिती बदला' : 'नवीन सदस्य जोडा'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-xl transition-all">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </header>
            
            <form onSubmit={handleSaveMember} className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-500 uppercase tracking-widest">सदस्याचे नाव</label>
                <input 
                  type="text" 
                  required
                  value={editingMember?.name || ''}
                  onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-sm transition-all"
                  placeholder="उदा. रुख्मणबाई बोडखे"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-500 uppercase tracking-widest">पद (Role)</label>
                <select 
                  value={editingMember?.role || 'सदस्य'}
                  onChange={e => setEditingMember({...editingMember, role: e.target.value})}
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-sm transition-all appearance-none"
                >
                  <option value="अध्यक्षा">अध्यक्षा</option>
                  <option value="सचिव">सचिव</option>
                  <option value="सदस्य">सदस्य</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-500 uppercase tracking-widest">मासिक बचत (₹)</label>
                <input 
                  type="number"
                  inputMode="numeric" 
                  required
                  value={editingMember?.monthlySaving || 100}
                  onChange={e => setEditingMember({...editingMember, monthlySaving: Number(e.target.value)})}
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-sm transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 sm:py-5 bg-emerald-600 text-white rounded-[20px] font-black text-base sm:text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {editingMember?.id ? 'बदल जतन करा' : 'सदस्य जतन करा'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
