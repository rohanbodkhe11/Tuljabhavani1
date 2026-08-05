import { Member } from '../types';
import { UserPlus, Search, Download, Trash2, Edit2, Loader2, X, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Members({ userRole }: { userRole: string }) {
  const isAdmin = userRole === 'अध्यक्षा';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMembers([]);
        setLoading(false);
      });
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.role) return;
    
    setSaving(true);
    try {
      const isEdit = !!editingMember.id;
      const url = isEdit ? `/api/members/${editingMember.id}` : '/api/members';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setEditingMember(null);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('तुम्हाला खात्री आहे का की तुम्हाला हा सदस्य हटवायचा आहे?')) return;
    
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
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
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-800 tracking-tight">सदस्य व्यवस्थापन</h1>
          <p className="text-stone-500 font-medium mt-1">सर्व सदस्यांची यादी आणि माहिती</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingMember({ name: '', role: 'सदस्य', monthlySaving: 100 });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            नवीन सदस्य जोडा
          </button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="सदस्य शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            />
          </div>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors font-bold"
          >
            <Download className="w-4 h-4" />
            PDF डाउनलोड करा
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">क्र</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">सदस्याचे नाव</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">पद</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">मासिक बचत</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredMembers.map((member, index) => (
                <tr key={member.id} className="hover:bg-stone-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-stone-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {member.name[0]}
                      </div>
                      <span className="font-bold text-stone-800">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      member.role === 'अध्यक्षा' ? 'bg-orange-100 text-orange-700' :
                      member.role === 'सचिव' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-stone-600">₹{member.monthlySaving}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingMember(member);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-stone-400 hover:text-emerald-600 transition-colors disabled:opacity-30" 
                        disabled={!isAdmin}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-stone-400 hover:text-red-600 transition-colors disabled:opacity-30" 
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

      {/* Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <header className="p-8 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-2xl font-black text-stone-800 tracking-tight">
                {editingMember?.id ? 'सदस्य माहिती बदला' : 'नवीन सदस्य जोडा'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-xl transition-all">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </header>
            
            <form onSubmit={handleSaveMember} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-stone-400 uppercase tracking-widest">सदस्याचे नाव</label>
                <input 
                  type="text" 
                  required
                  value={editingMember?.name || ''}
                  onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold transition-all"
                  placeholder="उदा. रुख्मणबाई बोडखे"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-stone-400 uppercase tracking-widest">पद</label>
                <select 
                  value={editingMember?.role || 'सदस्य'}
                  onChange={e => setEditingMember({...editingMember, role: e.target.value})}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold transition-all appearance-none"
                >
                  <option value="अध्यक्षा">अध्यक्षा</option>
                  <option value="सचिव">सचिव</option>
                  <option value="सदस्य">सदस्य</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-stone-400 uppercase tracking-widest">मासिक बचत (₹)</label>
                <input 
                  type="number" 
                  required
                  value={editingMember?.monthlySaving || 100}
                  onChange={e => setEditingMember({...editingMember, monthlySaving: Number(e.target.value)})}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                {editingMember?.id ? 'बदल जतन करा' : 'सदस्य जतन करा'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
