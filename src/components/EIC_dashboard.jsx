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
    "Global Admin": { label: "Admin Portal", path: "/admin" }
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

  const [activeTab, setActiveTab] = useState("triage");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sort States (Defaulted to Submitted Date, Descending)
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");

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

  // --- DERIVED DATA LOGIC ---
  const triagePapers = papers.filter(p => p.Status === "Under Review" && (!p.Editors || p.Editors.length === 0));
  const decisionPapers = papers.filter(p => p.Status === "Under Review" && p.Editors?.some(e => e.status === "Completed"));
  const inReviewPapers = papers.filter(p => p.Status === "Under Review" && p.Editors?.length > 0 && !p.Editors.some(e => e.status === "Completed"));
  const completedPapers = papers.filter(p => p.Status !== "Under Review");

  // --- Sorting Handler ---
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc"); // Default to ascending when switching columns
    }
  };

  // --- Filter and Sort Logic ---
  const processedPapers = useMemo(() => {
    let list = [];
    if (activeTab === "triage") list = triagePapers;
    else if (activeTab === "in_review") list = inReviewPapers;
    else if (activeTab === "decisions") list = decisionPapers;
    else if (activeTab === "completed") list = completedPapers;
    else list = papers;

    // Filter by search term
    let filtered = list.filter(p => 
      p.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered list
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

        {/* TABS */}
        <div className="border-b border-[#e5e7eb] flex gap-6 mb-6">
           {['triage', 'in_review', 'decisions', 'completed', 'all'].map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`pb-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"}`}
               >
                 {tab.replace('_', ' ')}
               </button>
           ))}
        </div>

        {/* LIST VIEW */}
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
                          {/* New Revision Badge rendering correctly under the title */}
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
                              <span className="text-sm text-gray-400 italic">Unassigned (Triage)</span>
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
      </main>
    </div>
  );
}