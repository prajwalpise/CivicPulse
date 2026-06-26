import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  getIssueById, 
  getComments, 
  addComment, 
  upvoteIssue, 
  updateIssueStatus, 
  subscribeToLocalChange,
  getIssues
} from "../services/db";
import { Issue, Comment, Category, Severity, IssueStatus } from "../types";
import { handleImageError, handleUserImageError } from "../utils/imageUtils";
import { 
  ArrowLeft, 
  Sparkles, 
  MapPin, 
  ThumbsUp, 
  Share2, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Send
} from "lucide-react";
import L from "leaflet";

interface IssueDetailProps {
  issueId: string;
  setCurrentPage: (page: string) => void;
  setSelectedIssueId: (id: string | null) => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issueId, setCurrentPage, setSelectedIssueId }) => {
  const { user, setShowLoginModal } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Expands
  const [aiExpanded, setAiExpanded] = useState<boolean>(true);
  const [letterExpanded, setLetterExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Similar issues
  const [similarIssues, setSimilarIssues] = useState<Issue[]>([]);

  // Municipal officer simulation
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<IssueStatus>("Under Review");
  const [statusNote, setStatusNote] = useState<string>("");

  const mapContainerRef = useRef<any>(null);

  const loadData = async () => {
    setLoading(true);
    const item = await getIssueById(issueId);
    if (item) {
      setIssue(item);
      const cList = await getComments(issueId);
      setComments(cList);
      
      // Load similar issues
      const all = await getIssues();
      const matched = all.filter(x => x.category === item.category && x.id !== item.id).slice(0, 3);
      setSimilarIssues(matched);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to updates for real-time reactivity
    const unsubComments = subscribeToLocalChange("comments", () => {
      loadData();
    });
    const unsubIssues = subscribeToLocalChange("issues", () => {
      loadData();
    });

    return () => {
      unsubComments();
      unsubIssues();
    };
  }, [issueId]);

  // Leaflet Map initialization for Sidebar exact location
  useEffect(() => {
    if (loading || !issue) return;

    const timer = setTimeout(() => {
      const container = L.DomUtil.get("map-detail-side");
      if (container) {
        (container as any)._leaflet_id = null;
      }

      const map = L.map("map-detail-side", { zoomControl: false, attributionControl: false }).setView([issue.lat, issue.lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      // Simple orange marker
      const icon = L.divIcon({
        className: "relative flex items-center justify-center",
        html: '<div class="h-5 w-5 bg-orange-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>',
        iconSize: [20, 20]
      });

      L.marker([issue.lat, issue.lng], { icon }).addTo(map);
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, issue]);

  // Copy Letter helper
  const handleCopyLetter = () => {
    if (issue?.aiAnalysis?.complaintLetter) {
      navigator.clipboard.writeText(issue.aiAnalysis.complaintLetter);
      setCopied(true);
      showToast("Complaint letter copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Upvote toggle
  const handleUpvote = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!issue) return;
    const res = await upvoteIssue(issue.id, user.id);
    if (res.success) {
      loadData();
      showToast(res.upvoted ? "Upvoted! +1 XP awarded." : "Upvote removed.");
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!newCommentText.trim() || !issue) return;
    
    await addComment(issue.id, user.id, user.name, user.photoURL, newCommentText.trim());
    setNewCommentText("");
    loadData();
    showToast("Comment added! +2 XP earned.");
  };

  // Change status (Supervisor simulation)
  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!issue) return;
    await updateIssueStatus(issue.id, newStatus, statusNote.trim() || `Status updated to ${newStatus}`);
    setStatusNote("");
    setShowAdminPanel(false);
    loadData();
    showToast(`Status updated successfully to: ${newStatus}`);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast("Share link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6 text-center py-20">
        <LoaderSpinner />
        <p className="text-sm text-slate-400">Loading issue details from secure ledger...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-7xl mx-auto p-4 text-center py-12">
        <p className="text-red-500 font-semibold">Issue not found or deleted.</p>
        <button onClick={() => setCurrentPage("issues")} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs">
          Return to Feed
        </button>
      </div>
    );
  }

  // Calculate timelines
  const createdDate = new Date(issue.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

  const getStatusStepState = (stepIndex: number) => {
    const statuses: IssueStatus[] = ["Reported", "Under Review", "In Progress", "Resolved"];
    const currentIdx = statuses.indexOf(issue.status);
    
    if (stepIndex < currentIdx) return "completed";
    if (stepIndex === currentIdx) return "active";
    return "pending";
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slideup pb-12 relative">
      
      {/* Toast Alert overlay */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 z-50 text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedIssueId(null);
            setCurrentPage("issues");
          }}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>

        {/* Municipal supervisor trigger */}
        <button
          onClick={() => setShowAdminPanel(!showAdminPanel)}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl border border-slate-700 shadow-sm transition-all"
        >
          {showAdminPanel ? "Close Actions" : "🔧 Change Status (Simulate Admin)"}
        </button>
      </div>

      {/* ADMIN STATUS CHANGE DRAWER */}
      {showAdminPanel && (
        <form onSubmit={handleStatusChangeSubmit} className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-4 animate-slideup z-10 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-display font-bold text-sm text-white flex items-center space-x-2">
              <span>🔧 Municipal Operations Panel</span>
            </h4>
            <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-mono font-bold">WARD CLERK AGENT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Transition Status to</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Operational Supervisor Note</label>
              <input
                type="text"
                placeholder="e.g. Crew assigned, hot asphalt mixer arriving Thursday..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-colors"
          >
            Update Secure Status & Alert Reporter
          </button>
        </form>
      )}

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPREHENSIVE DETAIL COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Visual Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
            <div className="relative h-96 bg-slate-100">
              <img 
                src={issue.imageURL} 
                alt={issue.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e)}
              />
              <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-md flex items-center space-x-2">
                <span>{getCategoryEmoji(issue.category)}</span>
                <span className="uppercase tracking-wide">{issue.category}</span>
              </div>
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-xl text-xs font-bold shadow-md">
                Severity: {issue.severity}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Meta information row */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center space-x-3">
                  <img 
                    src={issue.reporterPhoto} 
                    alt={issue.reporterName} 
                    className="h-10 w-10 rounded-full object-cover border-2 border-slate-200" 
                    referrerPolicy="no-referrer"
                    onError={(e) => handleUserImageError(e, issue.reporterName)}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{issue.reporterName}</p>
                    <p className="text-[10px] text-slate-400">Reporter Hero</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-500 text-xs font-mono">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{createdDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate max-w-[150px]">{issue.ward}</span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900 leading-snug">
                  {issue.title}
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {issue.description}
                </p>
              </div>

              {/* AI ANALYSIS SECTION */}
              {issue.aiAnalysis && (
                <div className="bg-orange-50/20 border border-orange-100/60 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setAiExpanded(!aiExpanded)}
                    className="w-full p-4 flex items-center justify-between bg-orange-50/30 text-slate-800 font-display font-bold text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                      <span>🤖 Agentic AI Resolution Analysis</span>
                    </div>
                    {aiExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>

                  {aiExpanded && (
                    <div className="p-6 space-y-6 text-xs divide-y divide-orange-100/40">
                      {/* Analysis Meta */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 text-slate-700">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Suggested Dept</span>
                          <p className="font-semibold text-slate-800">{issue.aiAnalysis.suggestedDept}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Confidence Score</span>
                          <p className="font-mono font-semibold text-slate-800">{issue.aiAnalysis.confidence}%</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Resolution Timeline</span>
                          <p className="font-semibold text-orange-600">{issue.aiAnalysis.estimatedResolutionDays} Days Estimated</p>
                        </div>
                      </div>

                      {/* Resolution steps */}
                      <div className="pt-4 space-y-3">
                        <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">Suggested Resolution Protocol</h4>
                        <div className="space-y-1 text-slate-600 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                          {issue.aiAnalysis.resolutionSteps}
                        </div>
                      </div>

                      {/* Expandable complaint Letter */}
                      <div className="pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">Formal Petition Draft</h4>
                          <button
                            onClick={() => setLetterExpanded(!letterExpanded)}
                            className="text-orange-600 hover:text-orange-700 font-bold"
                          >
                            {letterExpanded ? "Hide Draft" : "Show Draft &rarr;"}
                          </button>
                        </div>

                        {letterExpanded && (
                          <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 space-y-3">
                            <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                              {issue.aiAnalysis.complaintLetter}
                            </pre>
                            <button
                              onClick={handleCopyLetter}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>{copied ? "Copied!" : "Copy Petition Letter"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STATUS STEPPER STEPS */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-slate-800 text-sm">Grievance Status Timeline</h3>

            <div className="relative pl-6 space-y-6">
              {/* Vertical timeline connector */}
              <div className="absolute top-3 left-2.5 bottom-3 w-0.5 bg-slate-100"></div>

              {/* STEP 1: Reported */}
              <div className="relative flex items-start space-x-4 text-xs">
                {/* Checkpoint marker */}
                <div className={`absolute -left-[22px] h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                  getStatusStepState(0) === "completed" || getStatusStepState(0) === "active"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200"
                }`}>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">Report Registered</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {issue.statusHistory?.[0] ? new Date(issue.statusHistory[0].timestamp).toLocaleDateString("en-IN") : ""}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5">{issue.statusHistory?.[0]?.note || "Issue successfully logged in secure ledger."}</p>
                </div>
              </div>

              {/* STEP 2: Under Review */}
              <div className="relative flex items-start space-x-4 text-xs">
                <div className={`absolute -left-[22px] h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                  getStatusStepState(1) === "completed"
                    ? "border-green-500 bg-green-50"
                    : getStatusStepState(1) === "active"
                      ? "border-yellow-500 bg-yellow-50 animate-pulse"
                      : "border-slate-200"
                }`}>
                  <div className={`h-2 w-2 rounded-full ${getStatusStepState(1) === "completed" ? "bg-green-500" : getStatusStepState(1) === "active" ? "bg-yellow-500" : "bg-slate-200"}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-bold ${getStatusStepState(1) === "pending" ? "text-slate-300" : "text-slate-800"}`}>Wards Inspector Verification</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {issue.statusHistory?.find(h => h.status === "Under Review") 
                        ? new Date(issue.statusHistory.find(h => h.status === "Under Review")!.timestamp).toLocaleDateString("en-IN") 
                        : "Pending"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    {issue.statusHistory?.find(h => h.status === "Under Review")?.note || "Awaiting engineer site assignment & verification."}
                  </p>
                </div>
              </div>

              {/* STEP 3: In Progress */}
              <div className="relative flex items-start space-x-4 text-xs">
                <div className={`absolute -left-[22px] h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                  getStatusStepState(2) === "completed"
                    ? "border-green-500 bg-green-50"
                    : getStatusStepState(2) === "active"
                      ? "border-orange-500 bg-orange-50 animate-pulse"
                      : "border-slate-200"
                }`}>
                  <div className={`h-2 w-2 rounded-full ${getStatusStepState(2) === "completed" ? "bg-green-500" : getStatusStepState(2) === "active" ? "bg-orange-500" : "bg-slate-200"}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-bold ${getStatusStepState(2) === "pending" ? "text-slate-300" : "text-slate-800"}`}>Repairs Underway</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {issue.statusHistory?.find(h => h.status === "In Progress") 
                        ? new Date(issue.statusHistory.find(h => h.status === "In Progress")!.timestamp).toLocaleDateString("en-IN") 
                        : "Pending"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    {issue.statusHistory?.find(h => h.status === "In Progress")?.note || "Repair contractors and materials assigned to spot."}
                  </p>
                </div>
              </div>

              {/* STEP 4: Resolved */}
              <div className="relative flex items-start space-x-4 text-xs">
                <div className={`absolute -left-[22px] h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 bg-white ${
                  getStatusStepState(3) === "completed"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200"
                }`}>
                  <div className={`h-2 w-2 rounded-full ${getStatusStepState(3) === "completed" ? "bg-green-500" : "bg-slate-200"}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-bold ${getStatusStepState(3) === "pending" ? "text-slate-300" : "text-green-600"}`}>Grievance Resolved</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString("en-IN") : "Pending"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    {issue.statusHistory?.find(h => h.status === "Resolved")?.note || "Verification checks by municipal team & citizens."}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* COMMENTS PANEL */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
              <MessageSquare className="h-4.5 w-4.5 text-orange-500" />
              <span>Neighbor Comments ({comments.length})</span>
            </h3>

            {/* Comment write-box */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <img 
                  src={user.photoURL} 
                  className="h-8 w-8 rounded-full border border-slate-200 shrink-0 mt-0.5" 
                  referrerPolicy="no-referrer"
                  onError={(e) => handleUserImageError(e, user.name)}
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Contribute local insight or update status confirmation..."
                    className="w-full pl-4 pr-12 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1.5 p-1 text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <p className="text-xs text-slate-500">Sign in to leave comments and earn +2 XP.</p>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  Sign In Now &rarr;
                </button>
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-4 divide-y divide-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No discussions yet. Be the first!</p>
              ) : (
                comments.map((c, idx) => (
                  <div key={c.id} className={`flex gap-3 text-xs pt-4 ${idx === 0 ? "pt-0 border-t-0" : ""}`}>
                    <img 
                      src={c.userPhoto} 
                      className="h-8 w-8 rounded-full border border-slate-100 shrink-0" 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleUserImageError(e, c.userName)}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{c.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT ACTIONABLE SIDEBAR COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Support / Upvote card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm text-center space-y-4">
            <h4 className="font-display font-bold text-slate-800 text-sm">Grievance Validation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Upvote to declare that this issue is genuine and demands high administrative focus.</p>

            <button
              onClick={handleUpvote}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                user && issue.upvotes.includes(user.id)
                  ? "bg-orange-500 text-white shadow-orange-500/20"
                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-950/20"
              }`}
            >
              <ThumbsUp className={`h-4.5 w-4.5 ${user && issue.upvotes.includes(user.id) ? "fill-white" : ""}`} />
              <span>👍 Support this Issue ({issue.upvoteCount})</span>
            </button>

            <button
              onClick={handleShare}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Concern URL</span>
            </button>
          </div>

          {/* Leaflet Static Mini Map card */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <h4 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
              <MapPin className="h-4.5 w-4.5 text-orange-500" />
              <span>Grievance Location</span>
            </h4>
            <p className="text-[10px] text-slate-400 truncate">{issue.address}</p>
            <div id="map-detail-side" className="h-40 w-full rounded-xl z-10"></div>
          </div>

          {/* Similar Neighbor issues */}
          {similarIssues.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              <h4 className="font-display font-bold text-slate-800 text-sm">Related Local Issues</h4>
              <div className="space-y-3.5">
                {similarIssues.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => {
                      setSelectedIssueId(sim.id);
                    }}
                    className="w-full flex items-start space-x-3 text-left hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors"
                  >
                    <img 
                      src={sim.imageURL} 
                      className="h-11 w-11 rounded-lg object-cover border shrink-0" 
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{sim.title}</p>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{sim.ward}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

const LoaderSpinner = () => (
  <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
);
