import React, { useState, useEffect } from "react";
import { getIssues, getUsers } from "../services/db";
import { Issue, UserProfile } from "../types";
import { handleImageError } from "../utils/imageUtils";
import { 
  PlusCircle, 
  Map, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Users, 
  Camera, 
  Brain, 
  Vote, 
  TrendingUp, 
  ArrowRight,
  Sparkles
} from "lucide-react";

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
  setSelectedIssueId: (id: string | null) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage, setSelectedIssueId }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userCount, setUserCount] = useState<number>(5);

  useEffect(() => {
    const fetchData = async () => {
      const allIssues = await getIssues();
      setIssues(allIssues);
      const allUsers = await getUsers();
      setUserCount(allUsers.length || 5);
    };
    fetchData();
  }, []);

  const totalReported = issues.length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;
  const activeCount = totalReported - resolvedCount;

  // Filter 3 latest issues
  const latestIssues = issues.slice(0, 3);

  // Group issues by category for mini bar chart
  const categoryCounts: Record<string, number> = {
    Pothole: 0,
    "Water Leakage": 0,
    Streetlight: 0,
    Waste: 0,
    Encroachment: 0,
    Other: 0,
  };

  issues.forEach((i) => {
    if (categoryCounts[i.category] !== undefined) {
      categoryCounts[i.category]++;
    } else {
      categoryCounts.Other++;
    }
  });

  const categories = Object.keys(categoryCounts);
  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-700 border-red-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-orange-100 text-orange-700";
      case "Under Review": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleIssueClick = (id: string) => {
    setSelectedIssueId(id);
    setCurrentPage("issue-detail");
  };

  return (
    <div className="space-y-16 animate-slideup max-w-7xl mx-auto pb-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-16 text-white shadow-xl shadow-slate-900/15">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-500/5 to-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-orange-400">
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>AI-Powered Local Governance Platform</span>
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight tracking-tight text-white">
            Your City. <br />
            <span className="text-orange-500">Your Voice.</span> Your Power.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Report local issues, track municipal resolutions, and make your community better in real-time. Powering local action with advanced agentic AI pipelines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => setCurrentPage("report")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Report an Issue</span>
            </button>

            <button
              onClick={() => setCurrentPage("map")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold py-3 px-6 rounded-xl border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Map className="h-5 w-5" />
              <span>View Live Location Map</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME COUNTER STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-orange-500/20 transition-all">
          <div className="bg-slate-50 p-3 rounded-xl w-fit group-hover:bg-orange-50 transition-colors">
            <ShieldAlert className="h-5 w-5 text-slate-700 group-hover:text-orange-500" />
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reported</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{totalReported}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-green-500/20 transition-all">
          <div className="bg-slate-50 p-3 rounded-xl w-fit group-hover:bg-green-50 transition-colors">
            <CheckCircle className="h-5 w-5 text-slate-700 group-hover:text-green-500" />
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Cases</p>
            <h3 className="text-2xl font-extrabold text-green-600 mt-1 font-mono">{resolvedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-orange-500/20 transition-all">
          <div className="bg-slate-50 p-3 rounded-xl w-fit group-hover:bg-orange-50 transition-colors">
            <Clock className="h-5 w-5 text-slate-700 group-hover:text-orange-500" />
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Actions</p>
            <h3 className="text-2xl font-extrabold text-orange-600 mt-1 font-mono">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-yellow-500/20 transition-all">
          <div className="bg-slate-50 p-3 rounded-xl w-fit group-hover:bg-yellow-50 transition-colors">
            <Users className="h-5 w-5 text-slate-700 group-hover:text-yellow-500" />
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Community Heroes</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{userCount}</h3>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-900">How CivicPulse Works</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Our agentic pipeline handles your reports, checks duplicates, generates official complaint drafts, and schedules resolutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Timeline connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-200 -z-10"></div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="bg-slate-900 text-white h-12 w-12 rounded-full flex items-center justify-center mx-auto text-sm font-bold font-mono border-4 border-slate-50">
              1
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl w-fit mx-auto text-orange-600">
              <Camera className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Upload Photo</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Take a photo of the road damage, leakage, waste heap, or broken bulb.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="bg-slate-900 text-white h-12 w-12 rounded-full flex items-center justify-center mx-auto text-sm font-bold font-mono border-4 border-slate-50">
              2
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl w-fit mx-auto text-orange-600">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">AI Agent Evaluation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Gemini Flash Vision analyzes category, severity, and estimates repair schedules.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="bg-slate-900 text-white h-12 w-12 rounded-full flex items-center justify-center mx-auto text-sm font-bold font-mono border-4 border-slate-50">
              3
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl w-fit mx-auto text-orange-600">
              <Vote className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Citizen Upvoting</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Local neighbors upvote, confirm, and verify the issue on our live map feed.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="bg-slate-900 text-white h-12 w-12 rounded-full flex items-center justify-center mx-auto text-sm font-bold font-mono border-4 border-slate-50">
              4
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl w-fit mx-auto text-orange-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Track Progress</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Municipal wings get alerted and you receive real-time notification alerts.</p>
          </div>
        </div>
      </section>

      {/* 4. RECENT ISSUES AND MINI IMPACT CHART */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Issues List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-slate-900">Recent Community Concerns</h2>
            <button
              onClick={() => setCurrentPage("issues")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <span>Explore All Issues</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latestIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleIssueClick(issue.id)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                <div className="h-32 bg-slate-100 overflow-hidden relative">
                  <img
                    src={issue.imageURL}
                    alt={issue.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e)}
                  />
                  <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">
                        {issue.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                      {issue.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {issue.upvoteCount} votes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Impact Dashboard Column */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span>Grievances by Category</span>
            </h3>
            <p className="text-[11px] text-slate-400">Monthly reporting density comparison</p>
          </div>

          {/* Mini Custom SVG/Div bar chart */}
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {categories.map((cat) => {
              const count = categoryCounts[cat];
              const percentage = (count / maxCount) * 100;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-medium text-slate-600 truncate max-w-[120px]">{cat}</span>
                    <span className="font-mono text-slate-400 font-bold">{count} reports</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div>
          <p className="font-semibold text-slate-700">CivicPulse — community hero</p>
          <p className="mt-0.5">Democratizing citizen-led local issue tracking</p>
        </div>
        <div className="text-center sm:text-right font-mono">
          <p>Built for Vibe2Ship Hackathon 2026</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Coding Ninjas x Google for Developers</p>
        </div>
      </footer>

    </div>
  );
};
