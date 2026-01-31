"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";


const SAMPLE_PAPERS = [
  {
    id: 101,
    Title: "Optimizing Neural Networks for Edge Devices",
    Author: { firstname: "Amit", lastname: "Sharma" },
    submittedAt: "2025-10-15T10:00:00Z",
    Keywords: ["AI", "Edge Computing", "Optimization"],
    Status: "Under Review",
    reviewersInvited: 0,
    reviewersAccepted: 0,
    reviewersSubmitted: 0,
    isbeingtransferred: false,
    isFinal: false,
    Journal: { name: "Journal of AI Research" }
  },
  {
    id: 102,
    Title: "Sustainable Energy Harvesting in WSNs",
    Author: { firstname: "Sarah", lastname: "Jenkins" },
    submittedAt: "2025-10-20T14:30:00Z",
    Keywords: ["IoT", "Wireless Sensors", "Energy"],
    Status: "Under Review",
    reviewersInvited: 5,
    reviewersAccepted: 1, // Logic: <= 2 (Needs Reviewers)
    reviewersSubmitted: 0,
    isbeingtransferred: false,
    isFinal: false,
    Journal: { name: "IoT Today" }
  },
  {
    id: 103,
    Title: "Quantum Cryptography: A New Era",
    Author: { firstname: "Raj", lastname: "Patel" },
    submittedAt: "2025-11-01T09:15:00Z",
    Keywords: ["Quantum", "Security", "Cryptography"],
    Status: "Under Review",
    reviewersInvited: 4,
    reviewersAccepted: 2, // Logic: <= 2 (Needs Reviewers)
    reviewersSubmitted: 1,
    isbeingtransferred: false,
    isFinal: false,
    Journal: { name: "Tech Security Journal" }
  },
  {
    id: 104,
    Title: "Advancements in CRISPR Technology",
    Author: { firstname: "Emily", lastname: "Wong" },
    submittedAt: "2025-09-10T11:00:00Z",
    Keywords: ["Biotech", "Genetics", "CRISPR"],
    Status: "Under Review",
    reviewersInvited: 6,
    reviewersAccepted: 4, // Logic: >= 3 (Awaiting Decision)
    reviewersSubmitted: 2, // Progress: 2/4
    isbeingtransferred: false,
    isFinal: false,
    Journal: { name: "BioTech Weekly" }
  },
  {
    id: 105,
    Title: "Machine Learning in Financial Forecasting",
    Author: { firstname: "John", lastname: "Doe" },
    submittedAt: "2025-08-05T16:45:00Z",
    Keywords: ["Finance", "ML", "Economics"],
    Status: "Under Review",
    reviewersInvited: 5,
    reviewersAccepted: 5, // Logic: >= 3 (Awaiting Decision)
    reviewersSubmitted: 5, // Progress: 5/5 (Ready for decision)
    isbeingtransferred: false,
    isFinal: false,
    Journal: { name: "Finance & AI" }
  },
  {
    id: 106,
    Title: "Urban Planning for Smart Cities",
    Author: { firstname: "Maria", lastname: "Garcia" },
    submittedAt: "2025-07-20T08:00:00Z",
    Keywords: ["Urban Planning", "Smart City", "IoT"],
    Status: "Accepted",
    reviewersInvited: 3,
    reviewersAccepted: 3,
    reviewersSubmitted: 3,
    isbeingtransferred: false,
    isFinal: true, // Logic: Decision Made
    Journal: { name: "Urban Future" }
  },
  {
    id: 107,
    Title: "The Future of Blockchain in Supply Chain",
    Author: { firstname: "David", lastname: "Kim" },
    submittedAt: "2025-09-01T13:20:00Z",
    Keywords: ["Blockchain", "Supply Chain", "Logistics"],
    Status: "Rejected",
    reviewersInvited: 3,
    reviewersAccepted: 3,
    reviewersSubmitted: 3,
    isbeingtransferred: false,
    isFinal: true, // Logic: Decision Made
    Journal: { name: "Logistics Journal" }
  },
  {
    id: 108,
    Title: "Impact of Microplastics on Marine Life",
    Author: { firstname: "Lisa", lastname: "Ray" },
    submittedAt: "2025-10-05T10:10:00Z",
    Keywords: ["Environment", "Marine Biology", "Pollution"],
    Status: "Revision Required",
    reviewersInvited: 4,
    reviewersAccepted: 3,
    reviewersSubmitted: 3,
    isbeingtransferred: false,
    isFinal: false, // Logic: Decision Made (Revision)
    Journal: { name: "Nature & Science" }
  },
  {
    id: 109,
    Title: "Review of Solid State Battery Materials",
    Author: { firstname: "Kevin", lastname: "Lee" },
    submittedAt: "2025-11-15T09:30:00Z",
    Keywords: ["Batteries", "Energy", "Materials"],
    Status: "Under Review",
    reviewersInvited: 2,
    reviewersAccepted: 0,
    reviewersSubmitted: 0,
    isbeingtransferred: true, // Logic: Transfer Pending
    isFinal: false,
    Journal: { name: "Energy Reviews" }
  }
];

// --- Helper Functions ---
const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  const s = status ? status.toLowerCase() : "";
  
  if (s.includes("accept")) {
    badgeClasses += "bg-green-100 text-green-700";
  } else if (s.includes("reject")) {
    badgeClasses += "bg-red-100 text-red-700";
  } else if (s=="revision required") {
    badgeClasses += "bg-yellow-100 text-yellow-700";
  } else if (s.includes("pending")) {
    badgeClasses += "bg-gray-100 text-gray-700";
  } else {
    // Under Review
    badgeClasses += "bg-yellow-100 text-yellow-700";
  }
  return <span className={badgeClasses}>{status}</span>;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// --- Stats Component ---
const StatsGrid = ({ papers }) => {
  const total = papers.length;
  
  const unassigned = papers.filter(p => 
    !p.isFinal && 
    !p.isbeingtransferred &&
    p.Status !== "Pending Submission" && 
    (!p.reviewersInvited || p.reviewersInvited === 0)
  ).length;

  const lowReviewers = papers.filter(p => 
    !p.isFinal && 
    !p.isbeingtransferred &&
    p.Status !== "Pending Submission" && 
    (p.reviewersAccepted || 0) <= 2
  ).length;

  const awaitingDecisions = papers.filter(p => 
    !p.isFinal && 
    !p.isbeingtransferred &&
    p.Status !== "Pending Submission" && 
    (p.reviewersAccepted || 0) >= 3
  ).length;

  const decisionsMade = papers.filter(p => 
    p.Status === "Accepted" || 
    p.Status === "Rejected" || 
    p.Status.includes("Revision") || 
    p.Status.includes("Changes")
  ).length;

  // New Stat: Transfers
  const transfersPending = papers.filter(p => p.isbeingtransferred === true).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">Total Received</h3>
        <p className="text-2xl font-bold text-[#1f2937] mt-1">{total}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">Unassigned</h3>
        <p className="text-2xl font-bold text-red-600 mt-1">{unassigned}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">Needs Reviewers</h3>
        <p className="text-2xl font-bold text-[#f59e0b] mt-1">{lowReviewers}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">In Review</h3>
        <p className="text-2xl font-bold text-purple-600 mt-1">{awaitingDecisions}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">Decisions Made</h3>
        <p className="text-2xl font-bold text-blue-600 mt-1">{decisionsMade}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
        <h3 className="text-xs font-medium text-[#6b7280] uppercase">Transfers Pending</h3>
        <p className="text-2xl font-bold text-teal-600 mt-1">{transfersPending}</p>
      </div>
    </div>
  );
};

// --- Pagination Component ---
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">Previous</button>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">Next</button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// --- Paper List Component ---
const PaperList = ({ papers, showProgress = false, isTransferView = false }) => {
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, papers]);

  const sortedAndFilteredPapers = useMemo(() => {
    const processedPapers = (papers || []).map((paper) => ({
      ...paper,
      effectiveStatus:
        paper.Status
    }));

    const filtered = processedPapers.filter((paper) => {
      const lowerSearch = searchTerm.toLowerCase();
      const keywordsString = Array.isArray(paper.Keywords) ? paper.Keywords.join(" ").toLowerCase() : "";
      const journalName = paper.Journal?.name || "";
      const authorName = paper.Author ? `${paper.Author.firstname} ${paper.Author.lastname}`.toLowerCase() : "";
      
      return (
        paper.Title?.toLowerCase().includes(lowerSearch) ||
        paper.id?.toString().includes(lowerSearch) ||
        journalName.toLowerCase().includes(lowerSearch) ||
        paper.effectiveStatus?.toLowerCase().includes(lowerSearch) ||
        keywordsString.includes(lowerSearch) ||
        authorName.includes(lowerSearch)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = sortBy === "Status" ? a.effectiveStatus : a[sortBy];
      const bValue = sortBy === "Status" ? b.effectiveStatus : b[sortBy];

      if (sortBy === "submittedAt") {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        if (dateA < dateB) return sortOrder === "asc" ? -1 : 1;
        if (dateA > dateB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      if (sortBy === "id") {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [papers, sortBy, sortOrder, searchTerm]);

  const totalPages = Math.ceil(sortedAndFilteredPapers.length / ITEMS_PER_PAGE);
  const currentPapers = sortedAndFilteredPapers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper to render progress bar
  const renderProgressBar = (submitted, accepted) => {
    const safeAccepted = accepted || 1; 
    const percentage = Math.min(Math.round((submitted / safeAccepted) * 100), 100);
    
    return (
        <div className="w-full mt-1">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Progress</span>
                <span>{submitted}/{accepted} Submitted</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className="bg-[#059669] h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
  };

  if (!papers || papers.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">No submissions match this criteria.</p>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search papers (Title, Author, ID, Keywords...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("id")}>
                ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("Title")}>
                Paper Details {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              {/* Reviewer Stats Column */}
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap w-48">
                {isTransferView ? "Transfer Status" : (showProgress ? "Review Progress" : "Reviewers")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("submittedAt")}>
                Date {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("Status")}>
                Status {sortBy === "Status" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPapers.length > 0 ? (
              currentPapers.map((paper) => (
                <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">
                    #{paper.id}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-[#1f2937]">{paper.Title}</p>
                      <p className="text-xs text-[#6b7280]">
                         {paper.Author ? `By: ${paper.Author.firstname} ${paper.Author.lastname}` : 'Unknown Author'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {isTransferView ? (
                        <div className="flex items-center gap-2">
                             <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                            </span>
                            <span className="text-xs font-medium text-teal-700">Waiting for Acceptance</span>
                        </div>
                    ) : showProgress ? (
                        renderProgressBar(paper.reviewersSubmitted || 0, paper.reviewersAccepted || 0)
                    ) : (
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-medium text-gray-700">
                                Invited: <span className={paper.reviewersInvited > 0 ? "text-[#059669]" : "text-gray-400"}>{paper.reviewersInvited || 0}</span>
                            </div>
                            <div className="text-xs font-medium text-gray-700">
                                Accepted: <span className={(paper.reviewersAccepted || 0) <= 2 ? "text-red-600 font-bold" : "text-[#059669]"}>{paper.reviewersAccepted || 0}</span>
                            </div>
                        </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#1f2937]">
                    {formatDate(paper.submittedAt)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(paper.effectiveStatus)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/journal/paper/${paper.id}`)}
                      className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-4">
                  No submissions match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
};

// --- Main Component ---
export default function EditorPortal() {
  const { user, setUser, setloginStatus } = useUserData();
  const navigate = useNavigate();

  // --- Data state ---
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState("all_papers"); 

  // --- Handlers ---
  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- Data Fetching ---
  const getAllPapers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/journal/editor/papers`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ editorId: user.id }),
      }); 
      const data = await response.json();
      setPapers(data.papers || []);
    } catch (err) { 
        console.error("Error fetching papers:", err);
        setPapers(SAMPLE_PAPERS); // Fallback to sample data
    }
  };

  useEffect(() => {
    getAllPapers();
  }, []);

  // --- Filter Logic ---
  const unassignedPapers = useMemo(() => {
    // 0 Invited & NOT being transferred
    return papers.filter(p => !p.isFinal && !p.isbeingtransferred && p.Status !== "Pending Submission" && (!p.reviewersInvited || p.reviewersInvited === 0) && (!p.reviewersAccepted || p.reviewersAccepted === 0));
  }, [papers]);

  const needsReviewersPapers = useMemo(() => {
    // Accepted Reviewers <= 2 (excluding final/drafts/transfers)
    return papers.filter(p => 
      !p.isbeingtransferred &&
      p.Status !== "Pending Submission" && 
      p.Status === "Under Review" &&
      (p.reviewersAccepted || 0) <= 2 &&
      (p.reviewersAccepted || 0) > 0
    );
  }, [papers]);

  const robustReviewPapers = useMemo(() => {
    // Accepted Reviewers >= 3 AND Status is Under Review (not final/transfers)
    return papers.filter(p => 
      !p.isbeingtransferred &&
      p.Status !== "Pending Submission" && 
      (p.reviewersAccepted || 0) >= 3 &&
      p.Status === "Under Review"
    );
  }, [papers]);

  const decidedPapers = useMemo(() => {
    // Accepted, Rejected, or Revision Required
    return papers.filter(p => 
      p.Status === "Accepted" || 
      p.Status === "Rejected" || 
      p.Status === "Revision Required"
    );
  }, [papers]);

  const transferPendingPapers = useMemo(() => {
    // Being transferred is TRUE
    return papers.filter(p => p.isbeingtransferred === true);
  }, [papers]);

  // --- Header Component ---
  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    const ROLE_CONFIG = {
      "Editor": { label: "Editor", path: "/journal/editor" },
      "Author": { label: "Author", path: "/journal" },
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

  // --- Tab Button Component ---
  const TabButton = ({ id, label, count, colorClass }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
            activeTab === id 
            ? "border-[#059669] text-[#059669]" 
            : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
        }`}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${colorClass || (activeTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}`}>
                {count}
            </span>
        )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- TITLE --- */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#1f2937]">Editor Dashboard</h2>
        </div>

        {/* --- TABS --- */}
        <div className="border-b border-[#e5e7eb] flex flex-wrap gap-6 mb-6">
           <TabButton id="all_papers" label="All Papers" count={papers.length} />
           <div className="w-px bg-gray-300 h-6 my-auto mx-2"></div> 
           <TabButton 
              id="unassigned" 
              label="Unassigned" 
              count={unassignedPapers.length} 
              colorClass={activeTab === "unassigned" ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"}
           />

           <TabButton 
              id="needs_reviewers" 
              label="Needs Reviewers" 
              count={needsReviewersPapers.length} 
              colorClass={activeTab === "needs_reviewers" ? "bg-orange-100 text-orange-700" : "bg-orange-50 text-orange-600"}
           />

           <TabButton 
              id="awaiting_decision" 
              label="Awaiting Decisions" 
              count={robustReviewPapers.length} 
              colorClass={activeTab === "awaiting_decision" ? "bg-purple-100 text-purple-700" : "bg-purple-50 text-purple-600"}
           />

           <TabButton 
              id="decisions" 
              label="Decisions Made" 
              count={decidedPapers.length} 
              colorClass={activeTab === "decisions" ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-600"}
           />

           {/* New Transfer Tab */}
           <TabButton 
              id="transfers" 
              label="Transfers Pending" 
              count={transferPendingPapers.length} 
              colorClass={activeTab === "transfers" ? "bg-teal-100 text-teal-700" : "bg-teal-50 text-teal-600"}
           />
        </div>

        {/* --- STATS DASHBOARD --- */}
        <StatsGrid papers={papers} />

        {/* --- CONTENT --- */}
        <div className="mt-6">
            {activeTab === "all_papers" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-[#1f2937] mb-4">All Manuscripts</h3>
                    <PaperList papers={papers} />
                </div>
            )}

            {activeTab === "unassigned" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <h3 className="text-xl font-semibold text-[#1f2937]">Papers Needing Invitations (0 Invited)</h3>
                    </div>
                    <PaperList papers={unassignedPapers} />
                </div>
            )}

            {activeTab === "needs_reviewers" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <h3 className="text-xl font-semibold text-[#1f2937]">Papers Low on Accepted Reviewers (≤ 2)</h3>
                    </div>
                    <PaperList papers={needsReviewersPapers} />
                </div>
            )}

            {activeTab === "awaiting_decision" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <h3 className="text-xl font-semibold text-[#1f2937]">Reviews in Progress (≥ 3 Reviewers)</h3>
                    </div>
                    <PaperList papers={robustReviewPapers} showProgress={true} />
                </div>
            )}

            {activeTab === "decisions" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h3 className="text-xl font-semibold text-[#1f2937]">Decided Papers (Accepted, Rejected, Revisions)</h3>
                    </div>
                    <PaperList papers={decidedPapers} />
                </div>
            )}

            {activeTab === "transfers" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <h3 className="text-xl font-semibold text-[#1f2937]">Pending Editor Transfers</h3>
                    </div>
                    {/* Render with isTransferView=true to show specific status UI */}
                    <PaperList papers={transferPendingPapers} isTransferView={true} />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}