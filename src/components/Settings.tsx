import { Settings as SettingsIcon, Save, Database, Trash2, Palette, Shield } from 'lucide-react';
import { resetDatabase } from '../lib/dbService';

export default function Settings({ userRole }: { userRole: string }) {
  const isAdmin = userRole === 'अध्यक्षा';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-stone-800 mb-2">प्रवेश मर्यादित आहे</h2>
        <p className="text-stone-500 max-w-md mx-auto">
          सेटिंग्ज बदलण्याचे अधिकार फक्त 'अध्यक्षा' यांना आहेत. तुम्ही फक्त माहिती पाहू शकता.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">सेटिंग्ज</h1>
        <p className="text-stone-500 font-medium mt-1">प्रणालीची रचना आणि नियंत्रण</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-50">
              <SettingsIcon className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-stone-800">सामान्य माहिती</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600">अॅपचे नाव</label>
                <input 
                  type="text" 
                  defaultValue="तुळजाभवानी बचत गट"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600">व्याज दर (%)</label>
                <input 
                  type="number" 
                  defaultValue="2"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600">मासिक बचत रक्कम (₹)</label>
                <input 
                  type="number" 
                  defaultValue="100"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
              <Save className="w-5 h-5" />
              बदल जतन करा
            </button>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-50">
              <Database className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-stone-800">डेटा आणि बॅकअप</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={async () => {
                  if(confirm('तुम्हाला खात्री आहे का की तुम्हाला डेटा रिसेट करायचा आहे?')) {
                    await resetDatabase();
                    window.location.reload();
                  }
                }}
                className="flex-1 px-6 py-4 bg-orange-50 text-orange-700 rounded-2xl font-bold border border-orange-100 hover:bg-orange-100 transition-all text-center"
              >
                डेटा रिसेट करा
              </button>
              <button 
                onClick={async () => {
                   if(confirm('सर्व डेटा कायमस्वरूपी हटवला जाईल. सुरू ठेवायचे?')) {
                     await resetDatabase();
                     window.location.reload();
                   }
                }}
                className="flex-1 px-6 py-4 bg-red-50 text-red-700 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-all text-center flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                सर्व डेटा हटवा
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-6 border-b border-stone-50">
              <Palette className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-stone-800">थीम</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-between cursor-pointer">
                <span className="font-bold text-emerald-800">डिफॉल्ट हिरवा</span>
                <div className="w-6 h-6 bg-emerald-600 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all">
                <span className="font-bold text-stone-600">क्लासिक निळा</span>
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
