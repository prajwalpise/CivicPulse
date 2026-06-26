import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { ReportIssue } from "./pages/ReportIssue";
import { LiveMap } from "./pages/LiveMap";
import { IssueFeed } from "./pages/IssueFeed";
import { IssueDetail } from "./pages/IssueDetail";
import { Leaderboard } from "./pages/Leaderboard";
import { LoginModal } from "./components/LoginModal";
import { DEMO_USERS } from "./services/seedData";
import { handleUserImageError } from "./utils/imageUtils";
import { 
  MapPin, 
  Map, 
  ListFilter, 
  Trophy, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  PlusCircle, 
  ArrowLeft,
  Activity,
  User,
  X
} from "lucide-react";

const MainApp: React.FC = () => {
  const { user, loginAsDemoUser, logout, showLoginModal, setShowLoginModal } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Render correct page
  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage setCurrentPage={setCurrentPage} />;
      case "report":
        return <ReportIssue setCurrentPage={setCurrentPage} setSelectedIssueId={setSelectedIssueId} />;
      case "live-map":
        return <LiveMap setCurrentPage={setCurrentPage} setSelectedIssueId={setSelectedIssueId} />;
      case "issues":
        return <IssueFeed setCurrentPage={setCurrentPage} setSelectedIssueId={setSelectedIssueId} />;
      case "leaderboard":
        return <Leaderboard setCurrentPage={setCurrentPage} setSelectedIssueId={setSelectedIssueId} />;
      case "issue-detail":
        if (selectedIssueId) {
          return (
            <IssueDetail 
              issueId={selectedIssueId} 
              setCurrentPage={setCurrentPage} 
              setSelectedIssueId={setSelectedIssueId} 
            />
          );
        }
        setCurrentPage("issues");
        return null;
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      
      {/* 1. SECURE PERSISTENT HEADER */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo with Orange Pulse */}
          <button 
            onClick={() => {
              setSelectedIssueId(null);
              setCurrentPage("landing");
            }}
            className="flex items-center space-x-2 text-left hover:opacity-90 transition-opacity"
          >
            <div className="bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center shadow-lg relative">
              <Activity className="h-5 w-5 text-orange-500 animate-pulse" />
              <div className="absolute -inset-1 bg-orange-500/20 rounded-xl filter blur-xs -z-10 animate-ping"></div>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-sm tracking-tight text-slate-900 leading-none">CivicPulse</h1>
              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5 block">Community Hero</span>
            </div>
          </button>

          {/* Central Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 text-xs font-semibold">
            <button
              onClick={() => {
                setSelectedIssueId(null);
                setCurrentPage("landing");
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                currentPage === "landing" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Overview
            </button>
            
            <button
              onClick={() => {
                setSelectedIssueId(null);
                setCurrentPage("live-map");
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                currentPage === "live-map" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>Live Map</span>
            </button>

            <button
              onClick={() => {
                setSelectedIssueId(null);
                setCurrentPage("issues");
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                currentPage === "issues" || currentPage === "issue-detail" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Grievances</span>
            </button>

            <button
              onClick={() => {
                setSelectedIssueId(null);
                setCurrentPage("leaderboard");
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                currentPage === "leaderboard" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* Right Controls: Auth and Report CTA */}
          <div className="flex items-center space-x-3.5">
            
            {/* Quick Report CTA */}
            {currentPage !== "report" && (
              <button
                onClick={() => setCurrentPage("report")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-500/10 transition-all active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Report Issue</span>
              </button>
            )}

            {/* User Profile avatar controller */}
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200/50 p-1.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.photoURL} 
                    alt={user.name} 
                    className="h-7 w-7 rounded-full object-cover border border-slate-200 shadow-sm" 
                    referrerPolicy="no-referrer"
                    onError={(e) => handleUserImageError(e, user.name)}
                  />
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-[10px] font-bold text-slate-800 leading-none truncate max-w-[80px]">{user.name}</p>
                    <span className="text-[9px] font-mono text-orange-500 mt-0.5 block">{user.points} XP</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1 rounded bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* MOBILE FLOATING NAV BAR BOTTOM */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 z-30 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setSelectedIssueId(null);
            setCurrentPage("landing");
          }}
          className={`flex flex-col items-center p-2 rounded-xl text-[10px] font-semibold flex-1 ${
            currentPage === "landing" ? "text-orange-500" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className="h-4.5 w-4.5 mb-1" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setSelectedIssueId(null);
            setCurrentPage("live-map");
          }}
          className={`flex flex-col items-center p-2 rounded-xl text-[10px] font-semibold flex-1 ${
            currentPage === "live-map" ? "text-orange-500" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Map className="h-4.5 w-4.5 mb-1" />
          <span>Map</span>
        </button>

        <button
          onClick={() => {
            setSelectedIssueId(null);
            setCurrentPage("issues");
          }}
          className={`flex flex-col items-center p-2 rounded-xl text-[10px] font-semibold flex-1 ${
            currentPage === "issues" || currentPage === "issue-detail" ? "text-orange-500" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ListFilter className="h-4.5 w-4.5 mb-1" />
          <span>Feed</span>
        </button>

        <button
          onClick={() => {
            setSelectedIssueId(null);
            setCurrentPage("leaderboard");
          }}
          className={`flex flex-col items-center p-2 rounded-xl text-[10px] font-semibold flex-1 ${
            currentPage === "leaderboard" ? "text-orange-500" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Trophy className="h-4.5 w-4.5 mb-1" />
          <span>Reputation</span>
        </button>
      </nav>

      {/* 2. MAIN SCROLLABLE CONTENT BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {renderPage()}
      </main>

      {/* 3. FOOTER INFO */}
      <footer className="bg-white border-t border-slate-200/60 py-6 text-center text-[10px] text-slate-400/80 font-mono mt-8 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 CivicPulse — Community Hero.</p>
          <p className="mt-1">Powered by Gemini 2.0 Flash Agent Pipeline and Secure Ledger Fallback.</p>
        </div>
      </footer>

      {/* 4. UNIFIED CITIZEN LOGIN & SIGN UP DIALOG */}
      <LoginModal />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
