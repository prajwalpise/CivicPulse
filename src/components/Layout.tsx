import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationsAsRead, subscribeToLocalChange } from "../services/db";
import { Notification } from "../types";
import { handleUserImageError } from "../utils/imageUtils";
import { 
  Home, 
  PlusCircle, 
  Map, 
  ListFilter, 
  BarChart3, 
  Trophy, 
  User, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Sparkles,
  Award
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage, 
  setCurrentPage,
  selectedIssueId,
  setSelectedIssueId
}) => {
  const { user, signOut, setShowLoginModal } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch notifications
  const fetchNotifs = async () => {
    if (user) {
      const list = await getNotifications(user.id);
      setNotifications(list);
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Subscribe to notification additions/updates
    if (user) {
      const unsub = subscribeToLocalChange("notifications", () => {
        fetchNotifs();
      });
      return unsub;
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (user) {
      await markNotificationsAsRead(user.id);
      fetchNotifs();
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "issues", label: "Issues Feed", icon: ListFilter },
    { id: "report", label: "Report Issue", icon: PlusCircle, highlight: true },
    { id: "map", label: "Live Map", icon: Map },
    { id: "dashboard", label: "Impact Dashboard", icon: BarChart3 },
    { id: "leaderboard", label: "Heroes Leaderboard", icon: Trophy },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setSelectedIssueId(null);
    setMobileMenuOpen(false);
  };

  const handleNotifClick = (issueId: string) => {
    if (issueId) {
      setSelectedIssueId(issueId);
      setCurrentPage("issue-detail");
      setShowNotifDropdown(false);
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "home": return "Community Hub";
      case "report": return "Report Civic Issue";
      case "map": return "Live Location Map";
      case "issues": return "Community Issues Feed";
      case "issue-detail": return "Grievance Detail Card";
      case "dashboard": return "Civic Impact Dashboard";
      case "leaderboard": return "Community Leaderboard";
      case "profile": return "Civic Hero Profile";
      default: return "CivicPulse";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 fixed h-screen z-20 border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow-md shadow-orange-500/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white leading-tight">CivicPulse</h1>
            <p className="text-xs text-slate-400 font-mono">COMMUNITY HERO</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? item.highlight
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-slate-800 text-white border-l-4 border-orange-500 pl-3"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : "opacity-80"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {user ? (
            <div className="space-y-3">
              <button 
                onClick={() => handleNavClick("profile")}
                className="w-full flex items-center space-x-3 text-left hover:bg-slate-800/40 p-2 rounded-xl transition-all group"
              >
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-orange-500 transition-colors"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleUserImageError(e, user.name)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">{user.name}</p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-bold font-mono">{user.points} pts</span>
                  </div>
                </div>
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center space-x-2 text-xs text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out Session</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-login")), 10);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all text-center border border-slate-700 hover:border-orange-500/40"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-signup")), 10);
                }}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all text-center shadow-md shadow-orange-950/25"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. TOP HEADER BAR */}
      <div className="flex-1 flex flex-col md:pl-64">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm shadow-slate-100/40">
          {/* Menu button on mobile */}
          <div className="flex items-center space-x-3 md:space-x-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-display font-bold text-lg text-slate-800 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          {/* Quick Stats + Notifications */}
          <div className="flex items-center space-x-4">
            {/* Quick points chip for logged in users */}
            {user && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full border border-yellow-200 text-xs font-semibold font-mono shadow-sm">
                <Award className="h-3.5 w-3.5" />
                <span>{user.points} XP</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-30 animate-slideup">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="font-semibold text-sm text-slate-800">Alerts & Statuses</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n.issueId)}
                          className={`w-full text-left p-3.5 text-xs hover:bg-slate-50 flex items-start space-x-3 transition-colors ${
                            !n.read ? "bg-orange-50/40 border-l-2 border-orange-500 pl-3" : ""
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            n.type === "resolved" ? "bg-green-100 text-green-700" :
                            n.type === "badge" ? "bg-yellow-100 text-yellow-700" :
                            "bg-orange-100 text-orange-700"
                          }`}>
                            <Bell className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 leading-tight">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar linking to Profile */}
            {user ? (
              <button
                onClick={() => handleNavClick("profile")}
                className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 hover:border-orange-500 transition-colors"
              >
                <img 
                  src={user.photoURL} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => handleUserImageError(e, user.name)}
                />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-login")), 10);
                  }}
                  className="text-slate-600 hover:text-slate-950 px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-signup")), 10);
                  }}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 3. MAIN WORKSPACE CONTENT */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* 4. MOBILE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-20 px-2 shadow-lg">
        <button
          onClick={() => handleNavClick("home")}
          className={`flex flex-col items-center justify-center flex-1 h-full text-slate-500 ${
            currentPage === "home" ? "text-slate-900 font-semibold" : ""
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button
          onClick={() => handleNavClick("issues")}
          className={`flex flex-col items-center justify-center flex-1 h-full text-slate-500 ${
            currentPage === "issues" ? "text-slate-900 font-semibold" : ""
          }`}
        >
          <ListFilter className="h-5 w-5" />
          <span className="text-[10px] mt-1">Issues</span>
        </button>

        {/* Central highlighted Report FAB Button */}
        <button
          onClick={() => handleNavClick("report")}
          className="flex flex-col items-center justify-center relative -top-4 bg-orange-500 text-white rounded-full h-14 w-14 shadow-lg shadow-orange-500/40 border-4 border-white transition-all transform active:scale-95"
        >
          <PlusCircle className="h-6 w-6" />
        </button>

        <button
          onClick={() => handleNavClick("map")}
          className={`flex flex-col items-center justify-center flex-1 h-full text-slate-500 ${
            currentPage === "map" ? "text-slate-900 font-semibold" : ""
          }`}
        >
          <Map className="h-5 w-5" />
          <span className="text-[10px] mt-1">Live Map</span>
        </button>

        <button
          onClick={() => handleNavClick(user ? "profile" : "leaderboard")}
          className={`flex flex-col items-center justify-center flex-1 h-full text-slate-500 ${
            currentPage === "profile" || currentPage === "leaderboard" ? "text-slate-900 font-semibold" : ""
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-1">{user ? "Profile" : "Heroes"}</span>
        </button>
      </nav>

      {/* 5. MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-30 flex md:hidden animate-fade-in">
          <div className="bg-slate-900 w-64 p-6 flex flex-col h-full text-white animate-slideup">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display font-bold text-lg text-white">CivicPulse</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isActive 
                        ? "bg-orange-500 text-white" 
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {/* Extra nav options in menu */}
              {user && (
                <button
                  onClick={() => handleNavClick("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    currentPage === "profile" ? "bg-orange-500 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>My Profile</span>
                </button>
              )}
            </nav>

            <div className="mt-auto border-t border-slate-800 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2">
                    <img 
                      src={user.photoURL} 
                      alt={user.name} 
                      className="h-9 w-9 rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleUserImageError(e, user.name)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                      <p className="text-xs text-yellow-500 font-bold font-mono">{user.points} XP</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-xs text-slate-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setMobileMenuOpen(false);
                      setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-login")), 10);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-semibold text-white border border-slate-700 text-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setMobileMenuOpen(false);
                      setTimeout(() => window.dispatchEvent(new CustomEvent("open-auth-signup")), 10);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-orange-500/20 text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
