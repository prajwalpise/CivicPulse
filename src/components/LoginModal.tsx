import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { DEMO_USERS } from "../services/seedData";
import { X, Sparkles, User, Mail, Lock, ShieldAlert, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { isFirebaseConfigured } from "../services/firebase";
import { handleUserImageError } from "../utils/imageUtils";

export const LoginModal: React.FC = () => {
  const { 
    showLoginModal, 
    setShowLoginModal, 
    loginWithGoogle, 
    signUpWithEmailAndPassword,
    logInWithEmailAndPassword,
    simulateLogin
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Automatically listen to global sign up requests
  useEffect(() => {
    const handleOpenSignUp = () => {
      setIsSignUp(true);
    };
    const handleOpenLogIn = () => {
      setIsSignUp(false);
    };
    window.addEventListener("open-auth-signup", handleOpenSignUp);
    window.addEventListener("open-auth-login", handleOpenLogIn);
    return () => {
      window.removeEventListener("open-auth-signup", handleOpenSignUp);
      window.removeEventListener("open-auth-login", handleOpenLogIn);
    };
  }, []);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmailAndPassword(email.trim(), password, name.trim());
        setSuccess("Account successfully registered! Welcome to CivicPulse.");
      } else {
        await logInWithEmailAndPassword(email.trim(), password);
        setSuccess("Logged in successfully!");
      }
      // Reset inputs
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      setError(err.message || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccess("Successfully signed in with Google!");
    } catch (err: any) {
      console.error("LoginModal: Google login failed", err);
      setError(err.message || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[95vh] animate-slideup">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="bg-orange-500 p-1.5 rounded-xl text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base">CivicPulse Citizens</h3>
              <p className="text-[11px] text-slate-400">Join our hyperlocal civic actions</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLoginModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 mx-5 mt-4 rounded-2xl border">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              !isSignUp 
                ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              isSignUp 
                ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Status Message */}
          {error && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl leading-relaxed animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="text-[11px] text-green-700 bg-green-50 border border-green-100 p-3 rounded-xl leading-relaxed animate-fade-in">
              {success}
            </div>
          )}

          {/* Core Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50/30 focus:bg-white"
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50/30 focus:bg-white"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50/30 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-orange-600/10 flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              <span>{loading ? "Authenticating..." : isSignUp ? "Create Hero Account" : "Access Hero Account"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Social login / Google Authentication */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition-all active:scale-95 group text-xs"
            >
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.895 0 11.24-4.205 11.24-11.24 0-.756-.08-1.34-.18-1.955H12.24z"
                />
              </svg>
              <span>{isFirebaseConfigured ? (isSignUp ? "Sign Up with Google" : "Sign In with Google") : "Google Sign-In (Demo)"}</span>
            </button>

            {!isFirebaseConfigured && (
              <div className="flex items-start space-x-2 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  Firebase mode is inactive. Use any email & password to register/login locally, or select a demo account.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-150"></div>
            <span className="mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Demo Citizens</span>
            <div className="flex-1 border-t border-slate-150"></div>
          </div>

          {/* Preset Demo Citizens for testing */}
          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.slice(0, 3).map((hero) => (
              <button
                key={hero.id}
                type="button"
                onClick={() => {
                  simulateLogin(hero.id);
                }}
                className="w-full flex items-center space-x-3 p-2 rounded-xl border border-slate-200 hover:border-orange-500/40 hover:bg-orange-50/5 transition-all text-left active:scale-[0.99]"
              >
                <img 
                  src={hero.photoURL} 
                  alt={hero.name} 
                  className="h-8 w-8 rounded-full object-cover border border-slate-150" 
                  referrerPolicy="no-referrer"
                  onError={(e) => handleUserImageError(e, hero.name)}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-800">{hero.name}</h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                      {hero.points} XP
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">
                      {hero.issuesReported} reports | {hero.badges.length} badges
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
