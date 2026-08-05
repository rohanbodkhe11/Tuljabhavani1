import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, Users, UserPlus } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailInput = username.trim();

    // Try direct client Firebase Auth first
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, emailInput, password);
        const role = emailInput.toLowerCase() === 'rupeshpatil4586@gmail.com' ? 'अध्यक्षा' : 'सदस्य';
        const userObj = { id: userCred.user.uid, email: userCred.user.email, role };
        localStorage.setItem('bg_user', JSON.stringify(userObj));
        onAuthSuccess(userObj);
        return;
      } else {
        const userCred = await signInWithEmailAndPassword(auth, emailInput, password);
        const role = emailInput.toLowerCase() === 'rupeshpatil4586@gmail.com' ? 'अध्यक्षा' : 'सदस्य';
        const userObj = { id: userCred.user.uid, email: userCred.user.email, role };
        localStorage.setItem('bg_user', JSON.stringify(userObj));
        onAuthSuccess(userObj);
        return;
      }
    } catch (fbErr: any) {
      // Fallback to server proxy endpoint if client auth fails or needs server backend
      try {
        const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput, password })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          const role = emailInput.toLowerCase() === 'rupeshpatil4586@gmail.com' ? 'अध्यक्षा' : (data.user.role || 'सदस्य');
          const userObj = { id: data.user.uid || 'fb-user', email: data.user.email, role };
          localStorage.setItem('bg_user', JSON.stringify(userObj));
          onAuthSuccess(userObj);
          return;
        } else {
          // Check static preset credentials fallback if password is 12345
          if (emailInput === 'rupeshpatil4586@gmail.com' && password === '12345') {
            const userObj = { id: 'admin-1', email: 'rupeshpatil4586@gmail.com', role: 'अध्यक्षा' };
            localStorage.setItem('bg_user', JSON.stringify(userObj));
            onAuthSuccess(userObj);
            return;
          } else if (emailInput === 'abc@gmail.com' && password === '12345') {
            const userObj = { id: 'member-1', email: 'abc@gmail.com', role: 'सदस्य' };
            localStorage.setItem('bg_user', JSON.stringify(userObj));
            onAuthSuccess(userObj);
            return;
          }

          let msg = data.error || fbErr.message || 'अवैध ईमेल किंवा पासवर्ड';
          if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/user-not-found') {
            msg = 'वापरकर्ता सापडला नाही. कृपया पासवर्ड तपासा किंवा नवीन खाते तयार करा.';
          } else if (fbErr.code === 'auth/email-already-in-use') {
            msg = 'हा ईमेल आधीपासून नोंदणीकृत आहे. कृपया लॉगिन करा.';
          } else if (fbErr.code === 'auth/weak-password') {
            msg = 'पासवर्ड किमान ६ अक्षरी असणे आवश्यक आहे.';
          }
          setError(msg);
        }
      } catch (apiErr: any) {
        setError('प्रमाणिकरण करताना त्रुटी आली. कृपया नंतर पुन्हा प्रयत्न करा.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">
          {isSignUp ? 'नवीन नोंदणी करा' : 'लॉगिन करा'}
        </h2>
        <p className="text-stone-500">
          {isSignUp ? 'तुमच्या संगणक/मोबाईलवरून बचत गट खात्यासाठी नोंदणी करा' : 'प्रणालीमध्ये प्रवेश करण्यासाठी तुमची माहिती भरा'}
        </p>
      </div>

      <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setError(null); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          लॉगिन (Sign In)
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setError(null); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          नवीन नोंदणी (Sign Up)
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700 ml-1">ईमेल आयडी</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              placeholder="उदा. rupeshpatil4586@gmail.com"
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
              className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus className="w-5 h-5" />
              नवीन खाते तयार करा
            </>
          ) : (
            'प्रवेश करा'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-100">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 text-center">त्वरित लॉगिन (Demo Credentials)</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setUsername('rupeshpatil4586@gmail.com');
              setPassword('12345');
            }}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors text-left"
          >
            <div className="font-bold">अध्यक्षा / Admin</div>
            <div className="text-[10px] text-emerald-600 truncate">rupeshpatil4586@gmail.com</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setUsername('abc@gmail.com');
              setPassword('12345');
            }}
            className="p-2.5 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold border border-stone-200 transition-colors text-left"
          >
            <div className="font-bold">सदस्य / Member</div>
            <div className="text-[10px] text-stone-500 truncate">abc@gmail.com</div>
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-stone-400 font-medium uppercase tracking-widest">तुळजाभवानी महिला बचत गट</p>
      </div>
    </div>
  );
}
