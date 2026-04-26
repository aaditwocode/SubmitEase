"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- EXACT PORTAL HEADER ---
const Header = ({ user, handleLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/journal" },
      "Journal Editor": { label: "Editor", path: "/journal/editor" },
      "Journal Reviewer": { label: "Reviewer", path: "/journal/ManageReviews" },
      "Editor-in-Chief": { label: "Editor-In-Chief", path: "/eic/dashboard" },
    };

  const availablePortals = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) return [];
    return user.role
      .map(roleString => ROLE_CONFIG[roleString])
      .filter(Boolean);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className="group flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors bg-white"
            >
              Switch Portal
              <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
                {availablePortals.length > 0 && (<div className="border-gray-100 my-1"></div>)}
                {availablePortals.length > 0 && (
                  <>
                    <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roles</h6>
                    {availablePortals.map((option, index) => (
                      <button key={index} onClick={() => { navigate(option.path); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]">
                        {option.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
          <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
        </div>
      </div>
    </header>
  );
};

// --- Helper Functions ---
const getStatusBadge = (status, isOverdue) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  
  if (isOverdue) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full leading-tight bg-red-100 text-red-700 animate-pulse border border-red-200">⚠️ Overdue</span>;
  }

  switch (status) {
    case "Under Review": badgeClasses += "bg-yellow-50 text-yellow-700 border border-yellow-200"; break;
    case "Accepted": badgeClasses += "bg-green-50 text-green-700 border border-green-200"; break;
    case "Rejected": 
    case "Desk Rejected": badgeClasses += "bg-red-50 text-red-700 border border-red-200"; break;
    default: badgeClasses += "bg-gray-100 text-gray-700 border border-gray-200";
  }
  return <span className={badgeClasses}>{status}</span>;
};

// --- MAIN COMPONENT ---
export default function JournalEICDashboard() {
  const { user, setUser, setloginStatus } = useUserData();
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sort States
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // --- NEW: State for expanded editor accordion ---
  const [expandedEditorId, setExpandedEditorId] = useState(null);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- Data Fetching ---
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/journal/eic/dashboard-data');
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- DERIVED DATA LOGIC (For Main Papers) ---
  const triagePapers = papers.filter(p => p.Status === "Under Review" && (!p.Editors || p.Editors.length === 0));
  const decisionPapers = papers.filter(p => p.Status === "Under Review" && p.Editors?.some(e => e.status === "Completed"));
  const inReviewPapers = papers.filter(p => p.Status === "Under Review" && p.Editors?.length > 0 && !p.Editors.some(e => e.status === "Completed"));
  const completedPapers = papers.filter(p => p.Status !== "Under Review");

  // --- DERIVED DATA LOGIC (For Editor Stats) ---
  const editorStats = useMemo(() => {
    const statsMap = {};

    papers.forEach(paper => {
      if (!paper.Editors || paper.Editors.length === 0) return;
      
      const editorRecord = paper.Editors[0];
      const editorInfo = editorRecord.Editor;
      if (!editorInfo) return;

      const eId = editorInfo.id || editorRecord.EditorId;

      if (!statsMap[eId]) {
        statsMap[eId] = {
          id: eId,
          name: `${editorInfo.firstname} ${editorInfo.lastname}`,
          email: editorInfo.email,
          assignedCount: 0,
          underReviewCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          revisionCount: 0,
          finalizedCount: 0, 
          matchCount: 0 
        };
      }

      const stats = statsMap[eId];
      stats.assignedCount++;

      const pStatus = paper.Status || "";
      const eRec = editorRecord.Recommendation || "";

      if (pStatus === "Under Review") {
        stats.underReviewCount++;
      } else if (pStatus === "Accepted") {
        stats.acceptedCount++;
        stats.finalizedCount++;
        if (eRec.includes("Accept")) stats.matchCount++;
      } else if (pStatus === "Rejected" || pStatus === "Desk Rejected") {
        stats.rejectedCount++;
        stats.finalizedCount++;
        if (eRec.includes("Reject")) stats.matchCount++;
      } else if (pStatus.includes("Revision")) {
        stats.revisionCount++;
        stats.finalizedCount++;
        if (eRec.includes("Revision")) stats.matchCount++;
      }
    });

    return Object.values(statsMap).map(editor => {
      editor.matchPercentage = editor.finalizedCount > 0 
        ? Math.round((editor.matchCount / editor.finalizedCount) * 100) 
        : null;
      return editor;
    });
  }, [papers]);

  // --- Sorting Handler ---
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // --- Filter and Sort Logic (For Papers Table) ---
  const processedPapers = useMemo(() => {
    let list = [];
    if (activeTab === "triage") list = triagePapers;
    else if (activeTab === "in_review") list = inReviewPapers;
    else if (activeTab === "decisions") list = decisionPapers;
    else if (activeTab === "completed") list = completedPapers;
    else list = papers;

    let filtered = list.filter(p => 
      p.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortBy] || ""; 
      let bVal = b[sortBy] || "";

      if (sortBy === "submittedAt") {
        aVal = new Date(a.submittedAt).getTime();
        bVal = new Date(b.submittedAt).getTime();
      } else if (sortBy === "editor") {
        aVal = a.Editors?.length > 0 ? a.Editors[0].Editor.firstname : "";
        bVal = b.Editors?.length > 0 ? b.Editors[0].Editor.firstname : "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [activeTab, papers, searchTerm, sortBy, sortOrder]);


  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} handleLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1f2937]">Editor-in-Chief Dashboard</h2>
            <p className="text-sm text-[#6b7280] mt-1">Manage pipeline, oversee editor assignments, and render final publication decisions.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-medium text-[#6b7280]">Awaiting Triage</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">{triagePapers.length}</p>
          </div>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-medium text-[#6b7280]">Under Review</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{inReviewPapers.length}</p>
          </div>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-medium text-[#6b7280]">Decisions Needed</h3>
            <p className="text-3xl font-bold text-purple-600 mt-1">{decisionPapers.length}</p>
          </div>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-medium text-[#6b7280]">Processed / Finalized</h3>
            <p className="text-3xl font-bold text-[#059669] mt-1">{completedPapers.length}</p>
          </div>
        </div>

        {/* RE-ORDERED TABS */}
        <div className="border-b border-[#e5e7eb] flex gap-6 mb-6 overflow-x-auto">
           {['all', 'triage', 'in_review', 'decisions', 'completed', 'editor_stats'].map(tab => (
               <button
                 key={tab}
                 onClick={() => {
                     setActiveTab(tab);
                     setExpandedEditorId(null); // Reset accordion on tab switch
                 }}
                 className={`pb-2 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition-colors ${activeTab === tab ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"}`}
               >
                 {tab.replace('_', ' ')}
               </button>
           ))}
        </div>

        {/* CONDITIONAL RENDERING: Papers List vs Editor Stats */}
        {activeTab === 'editor_stats' ? (
          /* --- EDITOR STATS VIEW --- */
          <div className="bg-[#f9fafb] rounded-lg shadow-sm border border-[#e5e7eb] flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <h3 className="font-bold text-[#1f2937]">Associate Editor Performance Overview</h3>
              <p className="text-xs text-[#6b7280] mt-1">Review editor workload, their recommendation agreement rate, and click any row to view their assigned manuscripts.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white">
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider">Editor Name</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center">Assigned</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center">Under Review</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center">Accepted</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center">Revisions</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center">Rejected</th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-center" title="How often the editor's recommendation matches the final paper status">Agreement %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {editorStats.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-[#6b7280] bg-white">No editor data available.</td></tr>
                  ) : (
                    editorStats.map(stat => {
                      const isExpanded = expandedEditorId === stat.id;
                      // Filter papers belonging to this specific editor
                      const editorPapers = papers.filter(p => p.Editors && p.Editors.some(e => (e.Editor?.id || e.EditorId) === stat.id));

                      return (
                        <React.Fragment key={stat.id}>
                          {/* --- Main Editor Row --- */}
                          <tr 
                            onClick={() => setExpandedEditorId(isExpanded ? null : stat.id)} 
                            className={`cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50' : 'bg-white hover:bg-[#f3f4f6]/50'}`}
                          >
                            <td className="py-4 px-4 flex items-center gap-3">
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-[#059669]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-[#1f2937]">{stat.name}</p>
                                <p className="text-xs text-[#6b7280]">{stat.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-sm font-bold text-gray-700">{stat.assignedCount}</td>
                            <td className="py-4 px-4 text-center text-sm text-yellow-600 font-medium">{stat.underReviewCount}</td>
                            <td className="py-4 px-4 text-center text-sm text-green-600 font-medium">{stat.acceptedCount}</td>
                            <td className="py-4 px-4 text-center text-sm text-orange-600 font-medium">{stat.revisionCount}</td>
                            <td className="py-4 px-4 text-center text-sm text-red-600 font-medium">{stat.rejectedCount}</td>
                            <td className="py-4 px-4 text-center">
                              {stat.matchPercentage !== null ? (
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${stat.matchPercentage >= 80 ? 'bg-green-100 text-green-800' : stat.matchPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {stat.matchPercentage}%
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">N/A</span>
                              )}
                            </td>
                          </tr>

                          {/* --- Expanded Sub-Table for Editor's Papers --- */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" className="p-0 bg-gray-50 border-b border-gray-200 shadow-inner">
                                <div className="p-6">
                                  <h4 className="text-sm font-bold text-[#1f2937] mb-3">Manuscripts Managed by {stat.name}</h4>
                                  <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden">
                                    <table className="w-full text-left">
                                      <thead className="bg-gray-50 border-b border-[#e5e7eb]">
                                        <tr>
                                          <th className="py-2 px-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider">Paper ID</th>
                                          <th className="py-2 px-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider">Title</th>
                                          <th className="py-2 px-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider">Submitted</th>
                                          <th className="py-2 px-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
                                          <th className="py-2 px-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#e5e7eb]">
                                        {editorPapers.length === 0 ? (
                                          <tr><td colSpan="5" className="py-4 text-center text-xs text-gray-500">No active papers found.</td></tr>
                                        ) : (
                                          editorPapers.map(paper => {
                                            // Find specific recommendation for this editor in case there are multiple
                                            const thisEditorRecord = paper.Editors?.find(e => (e.Editor?.id || e.EditorId) === stat.id);

                                            return (
                                              <tr key={paper.id} className="hover:bg-[#f3f4f6]/50">
                                                <td className="py-3 px-3 text-xs font-medium text-[#1f2937]">{paper.id}</td>
                                                <td className="py-3 px-3">
                                                  <p className="text-xs font-medium text-[#1f2937] line-clamp-1">{paper.Title}</p>
                                                </td>
                                                <td className="py-3 px-3 text-xs text-[#6b7280]">
                                                  {new Date(paper.submittedAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                  {getStatusBadge(paper.Status, paper.isOverdue)}
                                                  {thisEditorRecord?.Recommendation && (
                                                    <p className="text-[10px] font-bold text-purple-700 mt-1">Rec: {thisEditorRecord.Recommendation}</p>
                                                  )}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                  <button 
                                                    onClick={() => navigate(`/journal/editor/paper/${paper.id}`)} 
                                                    className="px-3 py-1 bg-white border border-[#059669] text-[#059669] font-medium rounded text-xs hover:bg-emerald-50 transition-colors"
                                                  >
                                                    View
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* --- STANDARD PAPERS VIEW --- */
          <div className="bg-[#f9fafb] rounded-lg shadow-sm border border-[#e5e7eb] flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <input 
                type="text" 
                placeholder="Search manuscripts by ID or Title..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full md:w-1/3 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white text-sm" 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white">
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("id")}>
                      Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("Title")}>
                      Manuscript Title {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("submittedAt")}>
                      Submitted Date {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("Status")}>
                      System Status {sortBy === "Status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("editor")}>
                      Assigned Editor {sortBy === "editor" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {isLoading ? (
                    <tr><td colSpan="6" className="text-center py-8 text-[#6b7280] bg-white">Loading manuscripts...</td></tr>
                  ) : processedPapers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-[#6b7280] bg-white">No manuscripts found in this category.</td></tr>
                  ) : (
                    processedPapers.map(paper => {
                      const currentEditor = paper.Editors && paper.Editors.length > 0 ? paper.Editors[0] : null;

                      return (
                        <tr key={paper.id} className="hover:bg-[#f3f4f6]/50 transition-colors bg-white">
                          <td className="py-4 px-4 text-sm font-medium text-[#1f2937]">
                            {paper.id}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-[#1f2937] line-clamp-2">{paper.Title}</p>
                            {paper.isRevision && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                Revision Paper
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#6b7280] whitespace-nowrap">
                            {new Date(paper.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getStatusBadge(paper.Status, paper.isOverdue)}
                            {currentEditor && currentEditor.Recommendation && (
                                <p className="text-xs font-bold text-purple-700 mt-2">Rec: {currentEditor.Recommendation}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {currentEditor ? (
                                <div>
                                    <p className="text-sm font-medium text-[#1f2937]">{currentEditor.Editor.firstname} {currentEditor.Editor.lastname}</p>
                                    <p className="text-xs text-[#6b7280] mt-0.5">Status: {currentEditor.status || "Active"}</p>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => navigate(`/journal/editor/paper/${paper.id}`)} 
                              className="px-4 py-2 bg-[#059669] text-white font-medium rounded-md text-xs hover:bg-[#047857] transition-colors shadow-sm"
                            >
                              Manage Paper
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}