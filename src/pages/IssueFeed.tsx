import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getIssues, upvoteIssue } from "../services/db";
import { Issue, Category, IssueStatus } from "../types";
import { handleImageError, handleUserImageError } from "../utils/imageUtils";
import { 
  Search, 
  PlusCircle, 
  MessageSquare, 
  ThumbsUp, 
  MapPin, 
  Clock, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  Inbox
} from "lucide-react";

interface IssueFeedProps {
  setCurrentPage: (page: string) => void;
  setSelectedIssueId: (id: string | null) => void;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({ setCurrentPage, setSelectedIssueId }) => {
  const { user, setShowLoginModal } = useAuth();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Search, filter, and sort states
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusTab, setStatusTab] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Newest");

  // Load issues
  const loadData = async () => {
    const list = await getIssues();
    setIssues(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort Computation
  useEffect(() => {
    let result = [...issues];

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q)
      );
    }

    // 2. Category Tab Filter
    if (categoryFilter !== "All") {
      result = result.filter(i => i.category === categoryFilter);
    }

    // 3. Status Tabs
    if (statusTab !== "All") {
      if (statusTab === "Open") {
        result = result.filter(i => i.status === "Reported" || i.status === "Under Review");
      } else if (statusTab === "In Progress") {
        result = result.filter(i => i.status === "In Progress");
      } else if (statusTab === "Resolved") {
        result = result.filter(i => i.status === "Resolved");
      }
    }

    // 4. Sort selection
    if (sortBy === "Newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Most Upvoted") {
      result.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else if (sortBy === "Critical First") {
      const severityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      result.sort((a, b) => (severityWeights[b.severity] || 0) - (severityWeights[a.severity] || 0));
    }

    setFilteredIssues(result);
  }, [issues, search, categoryFilter, statusTab, sortBy]);

  // Handle Upvote toggle
  const handleUpvote = async (issueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const res = await upvoteIssue(issueId, user.id);
    if (res.success) {
      // Live reload states
      loadData();
    }
  };

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
      case "Resolved": return "bg-green-100 text-green-700 border-green-200";
      case "In Progress": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Under Review": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryEmoji = (cat: Category) => {
    switch (cat) {
      case "Pothole": return "🕳️";
      case "Water Leakage": return "💧";
      case "Streetlight": return "💡";
      case "Waste": return "🗑️";
      case "Encroachment": return "🚧";
      default: return "❓";
    }
  };

  const handleCardClick = (issueId: string) => {
    setSelectedIssueId(issueId);
    setCurrentPage("issue-detail");
  };

  return (
    <div className="space-y-6 animate-slideup max-w-7xl mx-auto pb-12">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Community Issues</h2>
          <p className="text-xs text-slate-400">Track and upvote infrastructural grievances registered by neighbors.</p>
        </div>

        <button
          onClick={() => setCurrentPage("report")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/10 transition-all hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* 2. SEARCH & SORT CARD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by title, description, or landmark ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50"
          />
        </div>

        {/* Sorting selection */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Most Upvoted">Most Upvoted</option>
              <option value="Critical First">Severity Priority</option>
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY AND STATUS TAB FILTER ROW */}
      <div className="flex flex-col gap-3">
        {/* Category Filters Pill Box */}
        <div className="flex flex-wrap gap-2.5">
          {["All", "Pothole", "Water Leakage", "Streetlight", "Waste", "Encroachment", "Other"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200"
              }`}
            >
              {cat === "All" ? "🌐 All Wards" : `${getCategoryEmoji(cat as Category)} ${cat}`}
            </button>
          ))}
        </div>

        {/* Status Tab buttons */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          {["All", "Open", "In Progress", "Resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
                statusTab === tab
                  ? "border-orange-500 text-orange-600 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ISSUE GRID */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center space-y-4">
          <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
            <Inbox className="h-8 w-8" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h4 className="font-display font-bold text-slate-800 text-sm">No issues match criteria</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Be the first to report a new infrastructure defect in Kolhapur!</p>
          </div>
          <button
            onClick={() => setCurrentPage("report")}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
          >
            Report First Issue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredIssues.slice(0, visibleCount).map((issue) => {
            const reportedDaysAgo = Math.max(0, Math.round(
              (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ));

            const isUpvotedByMe = user ? issue.upvotes.includes(user.id) : false;

            return (
              <div
                key={issue.id}
                onClick={() => handleCardClick(issue.id)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md hover:border-orange-500/10 transition-all cursor-pointer flex flex-col justify-between group"
              >
                {/* Image panel */}
                <div className="h-44 bg-slate-100 overflow-hidden relative">
                  <img
                    src={issue.imageURL}
                    alt={issue.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e)}
                  />
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-md flex items-center space-x-1.5 text-slate-800">
                    <span>{getCategoryEmoji(issue.category)}</span>
                    <span className="uppercase tracking-wide">{issue.category}</span>
                  </div>

                  {/* Severity Badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-md ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </div>
                </div>

                {/* Info content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-slate-800 leading-snug truncate group-hover:text-orange-500 transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Ward & Landmark address */}
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px]">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{issue.address}</span>
                  </div>

                  {/* Bottom Panel with Avatar, Upvote button, comments */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={issue.reporterPhoto} 
                        alt={issue.reporterName} 
                        className="h-7 w-7 rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleUserImageError(e, issue.reporterName)}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-700 truncate">{issue.reporterName}</p>
                        <span className="text-[9px] text-slate-400 flex items-center space-x-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{reportedDaysAgo === 0 ? "Today" : `${reportedDaysAgo}d ago`}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Comments indicator */}
                      <div className="flex items-center space-x-1 text-slate-400" title="Comments">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono font-bold">{issue.comments}</span>
                      </div>

                      {/* Upvote toggle Button */}
                      <button
                        onClick={(e) => handleUpvote(issue.id, e)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                          isUpvotedByMe
                            ? "bg-orange-500 text-white shadow-orange-500/20"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <ThumbsUp className={`h-3 w-3 ${isUpvotedByMe ? "fill-white" : ""}`} />
                        <span>{issue.upvoteCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION LOAD MORE */}
      {filteredIssues.length > visibleCount && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => setVisibleCount(visibleCount + 12)}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-6 rounded-xl border border-slate-200 text-xs shadow-sm transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Load More Grievances</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
};
