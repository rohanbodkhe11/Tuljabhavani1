import { useState, useEffect } from 'react';
import { MeetingRecord } from '../types';
import { Save, Printer, Download, Calculator, Info, Loader2, CheckCircle, X, CheckCircle2, XCircle, Trash2, AlertTriangle, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchMembers, fetchMeetingRecords, fetchMeetingSummaries, saveMeetingRecords, deleteMeeting } from '../lib/dbService';

export default function MeetingRegister({ userRole, initialDate, onDateChange }: { userRole: string, initialDate?: string | null, onDateChange?: () => void }) {
  const isAdmin = userRole === 'अध्यक्षा' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'adhyaksha';
  const [records, setRecords] = useState<Partial<MeetingRecord>[]>([]);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [calcData, setCalcData] = useState({ amount: 0, rate: 2, months: 1 });
  const calcResult = (calcData.amount * calcData.rate * calcData.months) / 100;

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    setLoading(true);
    // Fetch members and meeting data for this date using dbService
    const loadMeetingData = async () => {
      try {
        const [members, existingRecords, allMeetings] = await Promise.all([
          fetchMembers(),
          fetchMeetingRecords(date),
          fetchMeetingSummaries()
        ]);

        if (existingRecords && existingRecords.length > 0) {
          const memberMap = new Map(members.map(m => [m.id, m]));
          const recordMemberIds = new Set(existingRecords.map(r => r.memberId));

          // Update memberName to match current member name from member section
          const updatedExisting = existingRecords.map(r => {
            const matchedMember = memberMap.get(r.memberId);
            return {
              ...r,
              memberName: matchedMember ? matchedMember.name : r.memberName,
              present: r.present !== false
            };
          });

          // Check if any new member was added in the Members section that isn't in existingRecords
          const missingMembers = members.filter(m => !recordMemberIds.has(m.id));
          const newMemberRecords = missingMembers.map(m => {
            const monthlySaving = Number(m.monthlySaving) || 100;
            return {
              memberId: m.id,
              memberName: m.name,
              loan: 0,
              interest: 0,
              saving: monthlySaving,
              total: monthlySaving,
              present: true
            };
          });

          setRecords([...updatedExisting, ...newMemberRecords]);
        } else {
          // Carry over logic: find the latest meeting before this date
          let lastMeetingRecords: MeetingRecord[] = [];
          const pastMeetings = allMeetings
            .filter(m => m && m.date && m.date < date)
            .sort((a, b) => b.date.localeCompare(a.date));
          
          if (pastMeetings.length > 0) {
            try {
              lastMeetingRecords = await fetchMeetingRecords(pastMeetings[0].date);
            } catch (err) {
              console.error(err);
            }
          }

          // Initialize from members list, optionally carrying over loans
          const initial = members.map(m => {
            const lastRecord = lastMeetingRecords.find(r => r && r.memberId === m.id);
            const loan = lastRecord ? (Number(lastRecord.loan) || 0) : 0;
            const interest = loan * 0.02;
            const monthlySaving = Number(m.monthlySaving) || 100;
            return {
              memberId: m.id,
              memberName: m.name,
              loan: loan,
              interest: interest,
              saving: monthlySaving,
              total: interest + monthlySaving,
              present: true
            };
          });
          setRecords(initial);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMeetingData();
  }, [date]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await saveMeetingRecords(date, records as MeetingRecord[]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    try {
      await deleteMeeting(date);
      setIsConfirmDeleteOpen(false);
      if (onDateChange) onDateChange();
      // Reload current date data (will revert to un-saved default)
      setDate(new Date().toISOString().split('T')[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAttendance = (index: number) => {
    if (!isAdmin) return;
    const newRecords = [...records];
    const isPresent = newRecords[index].present !== false;
    newRecords[index] = {
      ...newRecords[index],
      present: !isPresent
    };
    setRecords(newRecords);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const formattedDate = new Date(date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Add header
    doc.setFontSize(20);
    doc.text('तुळजाभवानी महिला बचत गट', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`मासिक सभा नोंदणी - ${formattedDate}`, 105, 25, { align: 'center' });

    // Summary stats
    doc.setFontSize(10);
    doc.text(`उपस्थिती: ${records.filter(r => r.present !== false).length}/${records.length} सदस्य`, 14, 40);
    doc.text(`एकूण कर्ज: Rs. ${totals.loan}`, 65, 40);
    doc.text(`एकूण व्याज: Rs. ${totals.interest}`, 110, 40);
    doc.text(`एकूण जमा: Rs. ${totals.total}`, 160, 40);

    // Table
    autoTable(doc, {
      startY: 50,
      head: [['क्र', 'सदस्याचे नाव', 'उपस्थिती', 'कर्ज (Rs)', 'व्याज (Rs)', 'बचत (Rs)', 'एकूण (Rs)']],
      body: records.map((r, i) => [
        i + 1,
        r.memberName,
        r.present !== false ? 'उपस्थित' : 'अनुपस्थित',
        r.loan,
        r.interest,
        r.saving,
        r.total
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      foot: [['', '', 'एकूण जमा', totals.loan, totals.interest, totals.saving, totals.total]],
      footStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] }
    });

    doc.save(`Meeting_Register_${date}.pdf`);
  };

  const updateRecord = (index: number, field: keyof MeetingRecord, value: number) => {
    if (!isAdmin) return;
    
    const newRecords = [...records];
    const record = { ...newRecords[index] };

    if (field === 'loan') {
      record.loan = value;
      record.interest = value * 0.02; // 2% interest
    } else if (field === 'interest') {
      record.interest = value;
      record.loan = value / 0.02;
    } else if (field === 'saving') {
      record.saving = value;
    }

    record.total = (record.interest || 0) + (record.saving || 0);
    newRecords[index] = record;
    setRecords(newRecords);
  };

  const totals = records.reduce((acc, curr) => ({
    loan: acc.loan + (curr.loan || 0),
    interest: acc.interest + (curr.interest || 0),
    saving: acc.saving + (curr.saving || 0),
    total: acc.total + (curr.total || 0),
  }), { loan: 0, interest: 0, saving: 0, total: 0 });

  const presentCount = records.filter(r => r.present !== false).length;

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-6 flex items-center justify-between bg-red-50/60 border-b border-red-100">
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                मीटिंग इतिहास हटवा
              </h2>
              <button onClick={() => setIsConfirmDeleteOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-xl">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </header>
            <div className="p-6 space-y-4">
              <p className="text-stone-700 font-medium leading-relaxed">
                तुम्हाला <span className="font-bold text-stone-900">{new Date(date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span> या तारखेची मीटिंग नोंदणी नक्की हटवायची आहे का?
              </p>
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                ही कारवाई कायमस्वरूपी असून हटवलेली माहिती पुन्हा मिळवता येणार नाही.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-all text-sm"
                >
                  रद्द करा
                </button>
                <button
                  onClick={handleDeleteMeeting}
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

      {/* Calculator Modal */}
      {isCalcOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-8 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-2xl font-black text-stone-800 tracking-tight flex items-center gap-3">
                <Calculator className="w-7 h-7 text-emerald-600" />
                व्याज कॅल्क्युलेटर
              </h2>
              <button onClick={() => setIsCalcOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-xl">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </header>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-stone-400 uppercase tracking-widest">मुद्दल रक्कम (₹)</label>
                <input 
                  type="number" 
                  value={calcData.amount}
                  onChange={e => setCalcData({...calcData, amount: Number(e.target.value)})}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-stone-400 uppercase tracking-widest">व्याज दर (%)</label>
                  <input 
                    type="number" 
                    value={calcData.rate}
                    onChange={e => setCalcData({...calcData, rate: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-stone-400 uppercase tracking-widest">महिने</label>
                  <input 
                    type="number" 
                    value={calcData.months}
                    onChange={e => setCalcData({...calcData, months: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
              </div>
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-1">एकूण व्याज</p>
                <p className="text-4xl font-black text-emerald-700 tracking-tighter">₹{calcResult.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsCalcOpen(false)}
                className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">मीटिंग रजिस्टर</h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5">मासिक सभा नोंदणी आणि व्यवहार</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 md:flex-initial px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs text-sm"
          />
          {isAdmin && (
            <>
              <button 
                onClick={() => setIsCalcOpen(true)}
                className="p-2.5 sm:p-3 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-all active:scale-95"
                title="कॅल्क्युलेटर"
              >
                <Calculator className="w-5 h-5 text-emerald-600" />
              </button>
              <button 
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-2.5 sm:p-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all active:scale-95"
                title="या तारखेचा इतिहास हटवा"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-emerald-600 text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
                जतन करा
              </button>
            </>
          )}
        </div>
      </header>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 font-bold animate-in fade-in slide-in-from-top-4 shadow-sm text-sm sm:text-base">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <span>माहिती यशस्वीरीत्या जतन करण्यात आली आहे!</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
              <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                उपस्थिती
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-800">{presentCount} / {records.length}</p>
            </div>
            {[
              { label: 'एकूण कर्ज', value: totals.loan, color: 'text-orange-600', bg: 'bg-orange-50/80' },
              { label: 'एकूण व्याज', value: totals.interest, color: 'text-blue-600', bg: 'bg-blue-50/80' },
              { label: 'एकूण बचत', value: totals.saving, color: 'text-emerald-600', bg: 'bg-emerald-50/80' },
              { label: 'एकूण जमा', value: totals.total, color: 'text-stone-900', bg: 'bg-white border-stone-200' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-xs`}>
                <p className="text-[11px] font-black text-stone-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-xl sm:text-2xl font-black ${stat.color}`}>₹{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 text-emerald-900 text-xs sm:text-sm font-bold">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>व्याज दर: २% (दर महा) - उपस्थिती नोंदवा आणि कर्ज / बचत बदलावा.</span>
            </div>
            
            {/* Sticky Mobile & Desktop Responsive Table */}
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-stone-100 text-stone-600">
                    <th className="sticky top-0 left-0 z-30 bg-stone-100 border-b border-r border-stone-200 px-3 sm:px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-500 w-12 text-center">
                      क्र
                    </th>
                    <th className="sticky top-0 left-12 z-30 bg-stone-100 border-b border-r border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-700 min-w-[160px] shadow-xs">
                      सदस्याचे नाव
                    </th>
                    <th className="sticky top-0 z-20 bg-stone-100 border-b border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-600 text-center w-36">
                      उपस्थिती
                    </th>
                    <th className="sticky top-0 z-20 bg-stone-100 border-b border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-600 w-32">
                      कर्ज (₹)
                    </th>
                    <th className="sticky top-0 z-20 bg-stone-100 border-b border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-600 w-32">
                      व्याज (₹)
                    </th>
                    <th className="sticky top-0 z-20 bg-stone-100 border-b border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-600 w-32">
                      बचत (₹)
                    </th>
                    <th className="sticky top-0 z-20 bg-stone-200/60 border-b border-stone-200 px-4 py-4 text-xs font-black uppercase tracking-widest text-stone-900 w-32">
                      एकूण (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {records.map((record, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <tr key={index} className={`${isEven ? 'bg-white' : 'bg-stone-50/60'} hover:bg-emerald-50/20 transition-colors`}>
                        <td className={`sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-stone-50'} border-r border-stone-200 px-3 sm:px-4 py-3.5 font-bold text-stone-400 text-center text-xs sm:text-sm`}>
                          {index + 1}
                        </td>
                        <td className={`sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-stone-50'} border-r border-stone-200 px-4 py-3.5 font-black text-stone-900 text-xs sm:text-sm shadow-xs`}>
                          {record.memberName}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(index)}
                            disabled={!isAdmin}
                            title={isAdmin ? "उपस्थिती बदला" : "केवळ अध्यक्षांना परवानगी आहे"}
                            className={`min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all w-full active:scale-95 ${
                              record.present !== false
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            } disabled:opacity-80`}
                          >
                            {record.present !== false ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>उपस्थित</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>अनुपस्थित</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={record.loan}
                            readOnly={!isAdmin}
                            onChange={(e) => updateRecord(index, 'loan', Number(e.target.value))}
                            className="w-full min-h-[40px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-black text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={record.interest}
                            readOnly={!isAdmin}
                            onChange={(e) => updateRecord(index, 'interest', Number(e.target.value))}
                            className="w-full min-h-[40px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={record.saving}
                            readOnly={!isAdmin}
                            onChange={(e) => updateRecord(index, 'saving', Number(e.target.value))}
                            className="w-full min-h-[40px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 font-black text-stone-900 bg-stone-100/30 text-sm sm:text-base">
                          ₹{record.total?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-900 text-white font-black">
                    <td colSpan={3} className="sticky left-0 z-10 bg-stone-900 px-4 py-4 text-sm sm:text-base">
                      एकूण जमा (Total):
                    </td>
                    <td className="px-3 py-4 text-sm sm:text-base text-orange-300">₹{totals.loan.toLocaleString()}</td>
                    <td className="px-3 py-4 text-sm sm:text-base text-blue-300">₹{totals.interest.toLocaleString()}</td>
                    <td className="px-3 py-4 text-sm sm:text-base text-emerald-300">₹{totals.saving.toLocaleString()}</td>
                    <td className="px-4 py-4 text-base sm:text-lg text-emerald-400">₹{totals.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
      
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button 
          onClick={() => window.print()}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-700 hover:bg-stone-50 transition-all text-sm shadow-xs active:scale-95"
        >
          <Printer className="w-4 h-4 text-stone-500" />
          प्रिंट काढा
        </button>
        <button 
          onClick={generatePDF}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl font-bold text-stone-700 hover:bg-stone-50 transition-all text-sm shadow-xs active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          अहवाल डाउनलोड करा (PDF)
        </button>
      </div>
    </div>
  );
}
