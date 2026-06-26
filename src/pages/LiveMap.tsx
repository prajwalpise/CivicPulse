import React, { useState, useEffect, useRef } from "react";
import { getIssues } from "../services/db";
import { Issue, Category, Severity, IssueStatus } from "../types";
import { 
  Filter, 
  MapPin, 
  Compass, 
  Activity, 
  Layers, 
  TrendingUp,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import L from "leaflet";

interface LiveMapProps {
  setCurrentPage: (page: string) => void;
  setSelectedIssueId: (id: string | null) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ setCurrentPage, setSelectedIssueId }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Filter states
  const [selCategories, setSelCategories] = useState<string[]>([
    "Pothole", "Water Leakage", "Streetlight", "Waste", "Encroachment", "Other"
  ]);
  const [selSeverities, setSelSeverities] = useState<string[]>([
    "Low", "Medium", "High", "Critical"
  ]);
  const [selStatuses, setSelStatuses] = useState<string[]>([
    "Reported", "Under Review", "In Progress", "Resolved"
  ]);

  const [heatmapMode, setHeatmapMode] = useState<boolean>(false);

  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Load issues
  useEffect(() => {
    const fetchAll = async () => {
      const list = await getIssues();
      setIssues(list);
    };
    fetchAll();
  }, []);

  // Filter logic
  useEffect(() => {
    const filtered = issues.filter(i => {
      const catMatch = selCategories.includes(i.category);
      const sevMatch = selSeverities.includes(i.severity);
      const statMatch = selStatuses.includes(i.status);
      return catMatch && sevMatch && statMatch;
    });
    setFilteredIssues(filtered);
  }, [issues, selCategories, selSeverities, selStatuses]);

  // Leaflet Map Initialization and updates
  useEffect(() => {
    // 1. Initialize Leaflet Map once
    const mapContainer = L.DomUtil.get("map-full");
    if (mapContainer) {
      (mapContainer as any)._leaflet_id = null; // Clean up old map refs
    }

    const map = L.map("map-full", { zoomControl: false }).setView([16.7050, 74.2430], 13);
    mapInstanceRef.current = map;

    // Zoom controls repositioned to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Create a LayerGroup for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever filtered issues or heatmapMode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear old markers
    markersLayer.clearLayers();

    if (filteredIssues.length === 0) return;

    // Fit map bounds to show all filtered issues on load
    const bounds: any[] = [];

    filteredIssues.forEach((issue) => {
      bounds.push([issue.lat, issue.lng]);

      // Determine colors based on status or severity
      let markerColor = "bg-blue-500";
      let pulseClass = "";

      if (issue.status === "Resolved") {
        markerColor = "bg-green-500";
      } else {
        switch (issue.severity) {
          case "Critical":
            markerColor = "bg-red-500";
            pulseClass = "pulse-marker bg-red-500/30 rounded-full h-8 w-8 absolute -inset-1";
            break;
          case "High":
            markerColor = "bg-orange-500";
            break;
          case "Medium":
            markerColor = "bg-yellow-500";
            break;
          default:
            markerColor = "bg-blue-500";
            break;
        }
      }

      // Determine category Emoji
      let emoji = "❓";
      switch (issue.category) {
        case "Pothole": emoji = "🕳️"; break;
        case "Water Leakage": emoji = "💧"; break;
        case "Streetlight": emoji = "💡"; break;
        case "Waste": emoji = "🗑️"; break;
        case "Encroachment": emoji = "🚧"; break;
      }

      // 1. Build Custom HTML DivIcon
      const iconHtml = heatmapMode 
        ? `<div class="h-6 w-6 rounded-full bg-red-500/50 blur-xs flex items-center justify-center border border-red-500/30"></div>`
        : `<div class="relative flex items-center justify-center">
            <div class="${pulseClass}"></div>
            <div class="h-8 w-8 ${markerColor} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs transform hover:scale-110 transition-transform cursor-pointer">
              ${emoji}
            </div>
           </div>`;

      const markerIcon = L.divIcon({
        className: "custom-leaflet-icon",
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // 2. Add Marker with Popup to layer
      const marker = L.marker([issue.lat, issue.lng], { icon: markerIcon }).addTo(markersLayer);

      // 3. Custom Popup Layout
      const reportedDaysAgo = Math.max(0, Math.round(
        (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ));

      const popupHtml = `
        <div class="w-48 text-slate-800" style="font-family: inherit;">
          <img src="${issue.imageURL}" class="h-24 w-full object-cover rounded-t-lg" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=60';" />
          <div class="p-3.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400">${issue.category}</span>
              <span class="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 rounded">${issue.severity}</span>
            </div>
            <h4 class="font-bold text-xs truncate leading-tight">${issue.title}</h4>
            <div class="flex items-center justify-between text-[10px] text-slate-500">
              <span>${reportedDaysAgo === 0 ? "Today" : `${reportedDaysAgo} days ago`}</span>
              <span>👍 ${issue.upvoteCount} votes</span>
            </div>
            <button 
              id="pop-btn-${issue.id}" 
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded-lg text-[10px] text-center mt-1.5 cursor-pointer"
            >
              View Full Details &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Event delegation for popup button click
      marker.on("popupopen", () => {
        const btn = document.getElementById(`pop-btn-${issue.id}`);
        if (btn) {
          btn.addEventListener("click", () => {
            setSelectedIssueId(issue.id);
            setCurrentPage("issue-detail");
          });
        }
      });
    });

    // Auto-fit bounds on first load or filter shift
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [filteredIssues, heatmapMode]);

  // Handle Geolocation centering
  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
      });
    }
  };

  // Toggle checklist category filters
  const toggleCategory = (cat: string) => {
    if (selCategories.includes(cat)) {
      setSelCategories(selCategories.filter(c => c !== cat));
    } else {
      setSelCategories([...selCategories, cat]);
    }
  };

  const toggleSeverity = (sev: string) => {
    if (selSeverities.includes(sev)) {
      setSelSeverities(selSeverities.filter(s => s !== sev));
    } else {
      setSelSeverities([...selSeverities, sev]);
    }
  };

  const toggleStatus = (stat: string) => {
    if (selStatuses.includes(stat)) {
      setSelStatuses(selStatuses.filter(s => s !== stat));
    } else {
      setSelStatuses([...selStatuses, stat]);
    }
  };

  // Stats calculation for visible area
  const criticalCount = filteredIssues.filter(i => i.severity === "Critical" && i.status !== "Resolved").length;
  const resolvedCount = filteredIssues.filter(i => i.status === "Resolved").length;

  return (
    <div className="relative h-[calc(100vh-120px)] rounded-3xl overflow-hidden border border-slate-200/60 shadow-lg flex">
      
      {/* 1. FILTER SIDEBAR (COLLAPSIBLE) */}
      <div 
        className={`absolute sm:relative top-0 left-0 h-full bg-white border-r border-slate-200 z-20 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Filter className="h-4 w-4 text-orange-500" />
            <span>Map Filter Panel</span>
          </span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters checklist */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs custom-scrollbar">
          {/* Categories */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Categories</h4>
            <div className="space-y-1.5">
              {["Pothole", "Water Leakage", "Streetlight", "Waste", "Encroachment", "Other"].map((cat) => (
                <label key={cat} className="flex items-center space-x-2.5 text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Severity</h4>
            <div className="space-y-1.5">
              {["Critical", "High", "Medium", "Low"].map((sev) => (
                <label key={sev} className="flex items-center space-x-2.5 text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selSeverities.includes(sev)}
                    onChange={() => toggleSeverity(sev)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span>{sev}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Statuses</h4>
            <div className="space-y-1.5">
              {["Reported", "Under Review", "In Progress", "Resolved"].map((stat) => (
                <label key={stat} className="flex items-center space-x-2.5 text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selStatuses.includes(stat)}
                    onChange={() => toggleStatus(stat)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span>{stat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLLAPSE/EXPAND TOGGLE ARROW */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-20 left-4 sm:relative sm:top-1/2 sm:-translate-y-1/2 sm:-left-3 bg-white h-8 w-8 rounded-full shadow-lg border border-slate-200 z-20 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors hover:scale-105"
      >
        {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* 2. MAP SPACE CONTAINER */}
      <div className="flex-1 h-full relative">
        <div id="map-full" className="h-full w-full z-10"></div>

        {/* 3. FLOATING SUMMARY STATS (TOP RIGHT) */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-lg z-20 space-y-2 max-w-xs animate-slideup hidden sm:block">
          <div className="flex items-center space-x-2 text-slate-800 font-display font-bold text-xs">
            <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
            <span>Map Area Density</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-800">{filteredIssues.length}</span>
              <span className="text-slate-400">Cases</span>
            </div>
            <div className="bg-green-50 p-1.5 rounded-lg border border-green-100 text-green-700">
              <span className="block font-bold">{resolvedCount}</span>
              <span className="text-green-500">Solved</span>
            </div>
            <div className="bg-red-50 p-1.5 rounded-lg border border-red-100 text-red-700">
              <span className="block font-bold">{criticalCount}</span>
              <span className="text-red-500">Crit.</span>
            </div>
          </div>
        </div>

        {/* 4. FLOATING LAYERS & LOCATE BUTTONS (BOTTOM LEFT) */}
        <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
          {/* Locate me button */}
          <button
            onClick={handleLocateMe}
            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 p-3 rounded-full shadow-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center hover:scale-105"
            title="Locate Me"
          >
            <Compass className="h-5 w-5" />
          </button>

          {/* Pin vs Heatmap view toggle */}
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`p-3 rounded-full shadow-xl border transition-all active:scale-95 flex items-center justify-center hover:scale-105 ${
              heatmapMode 
                ? "bg-slate-900 text-white border-slate-800" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle Pin/Heatmap layer"
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
