import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers, getIssues } from "../services/db";
import { UserProfile, Issue } from "../types";
import { handleImageError, handleUserImageError } from "../utils/imageUtils";
import { 
  Award, 
  Trophy, 
  User, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  Flame, 
  ShieldAlert, 
  ShieldCheck,
  Zap,
  Star,
  Lock
} from "lucide-react";

interface LeaderboardProps {
  setCurrentPage: (page: string) => void;
  setSelectedIssueId: (id: string | null) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ setCurrentPage, setSelectedIssueId }) => {
  const { user, setShowLoginModal } = useAuth();

  const [activeTab, setActiveTab] = useState<"leaderboard" | "profile">("leaderboard");
  const [boardUsers, setBoardUsers] = useState<UserProfile[]>([]);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stats
  const [totalPointsGlobal, setTotalPointsGlobal] = useState<number>(0);
  const [resolvedIssuesGlobal, setResolvedIssuesGlobal] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const allUsers = await getUsers();
      const ranking = [...allUsers].sort((a, b) => b.points - a.points);
      setBoardUsers(ranking);

      // Sum global points
      const pts = ranking.reduce((acc, curr) => acc + curr.points, 0);
      setTotalPointsGlobal(pts);

      const allIssues = await getIssues();
      const resolved = allIssues.filter(i => i.status === "Resolved").length;
      setResolvedIssuesGlobal(resolved);

      // If logged in user, fetch their reports
      if (user) {
        const mine = allIssues.filter(i => i.reportedBy === user.id);
        setMyIssues(mine);
      }
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  // Badge list with definitions
  const badgeDefinitions = [
    { id: "badge_first_step", name: "First Step", desc: "Reported your first infrastructure issue", emoji: "🌱" },
    { id: "badge_civic_guru", name: "Civic Guru", desc: "Unlocked by gathering 100+ civic experience points", emoji: "🧙" },
    { id: "badge_pothole_knight", name: "Pothole Knight", desc: "Reported at least 2 road potholes", emoji: "🕳️" },
    { id: "badge_clean_crusader", name: "Cleanliness Crusader", desc: "Successfully logged 2 solid waste dumping spots", emoji: "🗑️" },
    { id: "badge_light_bringer", name: "Light Bringer", desc: "Reported broken streetlights", emoji: "💡" },
    { id: "badge_action_hero", name: "Action Hero", desc: "Upvoted 5 community grievances", emoji: "🔥" }
  ];

  // Helper to get Level rank
  const getLevelInfo = (xp: number) => {
    if (xp >= 150) return { level: 3, title: "Ward Defender 🛡️", next: "Max Level Reached" };
    if (xp >= 50) return { level: 2, title: "Neighborhood Sentinel 🕵️", next: `${150 - xp} XP to Level 3` };
    return { level: 1, title: "Civic Citizen 🌱", next: `${50 - xp} XP to Level 2` };
  };

  const getPodiumUsers = () => {
    if (boardUsers.length === 0) return [];
    // podium ranks: 1st, 2nd, 3rd
    const sorted = [...boardUsers].sort((a, b) => b.points - a.points);
    return sorted.slice(0, 3);
  };

  const podium = getPodiumUsers();
  const restUsers = boardUsers.slice(3);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slideup pb-12">
      
      {/* Tab select Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Citizen Ledger & Leaderboard</h2>
          <p className="text-xs text-slate-400">Honoring neighbors leading the infrastructural restoration in Kolhapur.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "leaderboard" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => {
              if (!user) {
                setShowLoginModal(true);
              } else {
                setActiveTab("profile");
              }
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "profile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            👤 My Profile
          </button>
        </div>
      </div>

      {activeTab === "leaderboard" ? (
        <div className="space-y-8">
          
          {/* Top global helper cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Collective XP Points</span>
                <span className="font-display font-black text-slate-800 text-lg">{totalPointsGlobal} XP</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-xl text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Solved Spots</span>
                <span className="font-display font-black text-slate-800 text-lg">{resolvedIssuesGlobal} Spots</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <Star className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Helper Citizens</span>
                <span className="font-display font-black text-slate-800 text-lg">{boardUsers.length} Neighbors</span>
              </div>
            </div>
          </div>

          {/* VISUAL PODIUM (Top 3) */}
          {podium.length > 0 && (
            <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl text-white border border-slate-800 shadow-xl space-y-6">
              <h3 className="font-display font-bold text-center text-sm tracking-wider text-slate-400 uppercase">🏆 Top Helper Champions</h3>
              
              <div className="flex flex-col sm:flex-row items-end justify-center gap-8 pt-6">
                
                {/* 2nd Place */}
                {podium[1] && (
                  <div className="flex flex-col items-center space-y-3 order-2 sm:order-1 shrink-0 w-32">
                    <div className="relative">
                      <img 
                        src={podium[1].photoURL} 
                        className="h-16 w-16 rounded-full border-4 border-slate-400 object-cover shadow-lg" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleUserImageError(e, podium[1].name)}
                      />
                      <span className="absolute -bottom-2 -right-1 bg-slate-400 text-slate-900 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xs truncate max-w-[120px]">{podium[1].name}</p>
                      <span className="text-[10px] text-orange-400 font-mono">{podium[1].points} XP</span>
                    </div>
                    {/* Podium pillar */}
                    <div className="bg-slate-800 w-24 h-16 rounded-t-lg border-t border-slate-700/60 flex items-center justify-center shadow-inner">
                      <span className="text-xs font-black text-slate-500">2nd</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {podium[0] && (
                  <div className="flex flex-col items-center space-y-3 order-1 sm:order-2 shrink-0 w-36">
                    <div className="relative">
                      {/* Floating crown */}
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl animate-bounce">👑</span>
                      <img 
                        src={podium[0].photoURL} 
                        className="h-20 w-20 rounded-full border-4 border-amber-400 object-cover shadow-2xl" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleUserImageError(e, podium[0].name)}
                      />
                      <span className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-950 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md">1</span>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-sm truncate max-w-[140px] text-amber-300">{podium[0].name}</p>
                      <span className="text-xs text-orange-400 font-mono font-bold">{podium[0].points} XP</span>
                    </div>
                    {/* Podium pillar */}
                    <div className="bg-slate-800 w-28 h-24 rounded-t-xl border-t-2 border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/5">
                      <span className="text-sm font-black text-amber-300">1st</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {podium[2] && (
                  <div className="flex flex-col items-center space-y-3 order-3 shrink-0 w-32">
                    <div className="relative">
                      <img 
                        src={podium[2].photoURL} 
                        className="h-16 w-16 rounded-full border-4 border-amber-700 object-cover shadow-lg" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleUserImageError(e, podium[2].name)}
                      />
                      <span className="absolute -bottom-2 -right-1 bg-amber-700 text-white h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xs truncate max-w-[120px]">{podium[2].name}</p>
                      <span className="text-[10px] text-orange-400 font-mono">{podium[2].points} XP</span>
                    </div>
                    {/* Podium pillar */}
                    <div className="bg-slate-800 w-24 h-12 rounded-t-lg border-t border-slate-700/60 flex items-center justify-center shadow-inner">
                      <span className="text-xs font-black text-amber-700">3rd</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Ranks 4-10 Table list */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-display font-bold text-xs text-slate-700 uppercase tracking-wide">Citizen Ranks Table</h4>
            </div>

            <div className="divide-y divide-slate-100">
              {restUsers.map((u, index) => {
                const rank = index + 4;
                return (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 text-xs">
                    <div className="flex items-center space-x-4 min-w-0">
                      <span className="font-mono font-semibold text-slate-400 w-4 text-center">{rank}</span>
                      <img 
                        src={u.photoURL} 
                        className="h-8 w-8 rounded-full object-cover shrink-0" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleUserImageError(e, u.name)}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{u.name}</p>
                        <span className="text-[9px] text-slate-400 block font-mono">{getLevelInfo(u.points).title}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 shrink-0">
                      {/* Unlocked Badge preview emojis */}
                      <div className="flex space-x-1">
                        {u.badges?.map(bId => {
                          const badge = badgeDefinitions.find(b => b.id === bId);
                          return badge ? (
                            <span key={bId} className="text-sm cursor-help" title={badge.desc}>
                              {badge.emoji}
                            </span>
                          ) : null;
                        })}
                      </div>

                      <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        {u.points} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* 2. PROFILE TAB (MY DASHBOARD) */
        user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideup">
            
            {/* Left Card: Account details */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm text-center space-y-5 h-fit">
              <div className="relative h-24 w-24 mx-auto">
                <img 
                  src={user.photoURL} 
                  alt={user.name} 
                  className="h-full w-full rounded-full border-4 border-orange-500 object-cover shadow-md" 
                  referrerPolicy="no-referrer"
                  onError={(e) => handleUserImageError(e, user.name)}
                />
                <span className="absolute bottom-0 right-0 bg-slate-900 text-white p-1 rounded-full text-[10px] font-mono font-bold">Lvl {getLevelInfo(user.points).level}</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-800 text-base">{user.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Citizen Reputation Score</span>
                <span className="font-display font-black text-2xl text-slate-800 mt-1 block">{user.points} XP</span>
                <span className="inline-block bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-2 border border-orange-200">
                  {getLevelInfo(user.points).title}
                </span>
              </div>

              {/* Next level tracker progress */}
              <div className="space-y-1.5 text-left text-[11px]">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>Level Progress</span>
                  <span>{getLevelInfo(user.points).next}</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ 
                      width: `${getLevelInfo(user.points).level === 3 ? 100 : (user.points % 50 / 50) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right Card: Badges grid & reports list */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Badges Grid card */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <Award className="h-4.5 w-4.5 text-orange-500" />
                    <span>Honorary Merit Badges ({user.badges?.length || 0}/6 unlocked)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {badgeDefinitions.map((b) => {
                    const isUnlocked = user.badges?.includes(b.id);
                    return (
                      <div 
                        key={b.id} 
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                          isUnlocked 
                            ? "bg-orange-50/10 border-orange-200/60" 
                            : "bg-slate-50/40 border-slate-100 grayscale opacity-40"
                        }`}
                      >
                        <span className="text-3xl mb-2">{b.emoji}</span>
                        <h5 className="font-bold text-slate-800 text-xs">{b.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{b.desc}</p>
                        
                        {!isUnlocked && (
                          <span className="text-[9px] text-slate-400 flex items-center space-x-1 mt-2 font-semibold">
                            <Lock className="h-3 w-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My reported issues section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                <h4 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">My Registered Wards Reports ({myIssues.length})</h4>

                <div className="divide-y divide-slate-100">
                  {myIssues.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">You haven't reported any issues yet.</p>
                  ) : (
                    myIssues.map((mine) => (
                      <div
                        key={mine.id}
                        onClick={() => {
                          setSelectedIssueId(mine.id);
                          setCurrentPage("issue-detail");
                        }}
                        className="p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs cursor-pointer rounded-xl transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img 
                            src={mine.imageURL} 
                            className="h-10 w-10 object-cover rounded-lg border shrink-0" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e)}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{mine.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{mine.ward}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mine.status === "Resolved" 
                            ? "bg-green-100 text-green-700" 
                            : mine.status === "In Progress"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-700"
                        }`}>
                          {mine.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      )}

    </div>
  );
};
