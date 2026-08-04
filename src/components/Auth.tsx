import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, Users } from 'lucide-react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Using the requested static credentials for this environment
    if (username === 'rupeshpatil4586@gmail.com' && password === '12345') {
      onAuthSuccess({ id: 'admin-1', email: 'rupeshpatil4586@gmail.com', role: 'अध्यक्षा' });
    } else if (username === 'abc@gmail.com' && password === '12345') {
      onAuthSuccess({ id: 'member-1', email: 'abc@gmail.com', role: 'सदस्य' });
    } else {
      setError('अवैध ईमेल किंवा पासवर्ड');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">
          लॉगिन करा
        </h2>
        <p className="text-stone-500">
          प्रणालीमध्ये प्रवेश करण्यासाठी तुमची माहिती भरा
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700 ml-1">वापरकर्तानाव</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="वापरकर्तानाव टाका"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700 ml-1">पासवर्ड</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            'प्रवेश करा'
          )}
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-stone-100 text-center">
        <p className="text-sm text-stone-400 font-medium uppercase tracking-widest">तुळजाभवानी महिला बचत गट</p>
      </div>
    </div>
  );
}
