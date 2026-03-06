"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions ---
const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  const s = status ? status.toLowerCase() : "";
  
  if (s.includes("accepted")) {
    badgeClasses += "bg-green-100 text-green-700";
  } else if (s.includes("rejected") || s.includes("declined")) {
    badgeClasses += "bg-red-100 text-red-700";
  } else if (s.includes("revision required") || s.includes("sent back")) {
    badgeClasses += "bg-orange-100 text-orange-700";
  } else if (s.includes("pending")) {
    badgeClasses += "bg-red-100 text-red-700";
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

// --- CORE LOGIC: Determine which tab a paper belongs to ---
const getTabCategory = (paper) => {
  const revs = paper.Revisions || [];
  
  if (revs.length > 0) {
    // If it has revisions, route based on the LATEST revision's status
    const revStatus = revs[0].Status;
    if (revStatus === "Accepted") return "Accepted"; 
    if (revStatus === "Rejected" || revStatus === "Declined") return "Declined Revisions";
    if (revStatus === "Pending Submission") return "Pending Revision Submission";
    if (revStatus === "Under Review") return "Revisions Under Review";
    return revStatus; 
  }
  
  // If no revisions, route based on the base paper's status
  return paper.Status; 
};


// --- Stats Component ---
const StatsGrid = ({ papers }) => {
  const total = papers.length;

  const accepted = papers.filter(p => getTabCategory(p) === "Accepted").length;
  const rejected = papers.filter(p => getTabCategory(p) === "Rejected").length;
  const pending = papers.filter(p => getTabCategory(p) === "Pending Submission").length;
  const underReview = papers.filter(p => getTabCategory(p) === "Under Review").length;
  
  const revisions = papers.filter(p => 
    ["Revision Required", "Pending Revision Submission", "Revisions Under Review", "Declined Revisions"].includes(getTabCategory(p))
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Total Submissions</h3>
        <p className="text-3xl font-bold text-[#059669]">{total}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Accepted</h3>
        <p className="text-3xl font-bold text-[#059669]">{accepted}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Under Review</h3>
        <p className="text-3xl font-bold text-[#f59e0b]">{underReview}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Revisions</h3>
        <p className="text-3xl font-bold text-[#f59e0b]">{revisions}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Rejected</h3>
        <p className="text-3xl font-bold text-red-700">{rejected}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Pending</h3>
        <p className="text-3xl font-bold text-red-700">{pending}</p>
      </div>
    </div>
  );
};

// --- Paper List Component ---
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

// --- Updated Paper List Component with Dual Status Support ---
const PaperList = ({ papers, isRevisionTab }) => {
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50; 

  const navigate = useNavigate();

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
      effectiveStatus: paper.Revisions?.[0]?.Status || paper.Status, 
    }));

    const filtered = processedPapers.filter((paper) => {
      const lowerSearch = searchTerm.toLowerCase();
      const keywordsString = Array.isArray(paper.Keywords) ? paper.Keywords.join(" ").toLowerCase() : "";
      const journalName = paper.Journal?.name || "";
      
      return (
        paper.Title?.toLowerCase().includes(lowerSearch) ||
        paper.id?.toString().includes(lowerSearch) ||
        journalName.toLowerCase().includes(lowerSearch) ||
        paper.effectiveStatus?.toLowerCase().includes(lowerSearch) ||
        keywordsString.includes(lowerSearch)
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

  if (!papers || papers.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">No submissions match your search.</p>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search submissions (Title, ID, Journal, Status...)"
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
                Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("Title")}>
                Name {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("submittedAt")}>
                Submitted On {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                Keywords
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
                    {paper.id}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-[#1f2937]">{paper.Title}</p>
                      <p className="text-xs text-[#6b7280]">{paper.Journal?.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#1f2937]">
                    {formatDate(paper.submittedAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(paper.Keywords || []).map((keyword, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {/* DUAL STATUS DISPLAY LOGIC */}
                    {paper.Revisions && paper.Revisions.length > 0 && !isRevisionTab ? (
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full leading-tight bg-orange-100 text-orange-700 whitespace-nowrap">
                                Revised Paper
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Status: </span>
                                {getStatusBadge(paper.Revisions[0].Status)}
                            </div>
                        </div>
                    ) : (
                        getStatusBadge(paper.effectiveStatus)
                    )}
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

// --- Reusable Author Card ---
const CompactAuthorCard = ({ author }) => {
  if (!author) return null;
  return (
    <div className="p-3 border rounded-md bg-white">
      <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
      <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
    </div>
  );
};

// --- Utility to reorder array ---
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// --- Main Component ---
export default function JournalPortal() {
  const { user, setUser, setloginStatus } = useUserData();
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // --- UI State ---
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); 
  const [activeSubTab, setActiveSubTab] = useState("rev_required"); 

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authors, setAuthors] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]); 
  
  // --- Invite Form State ---
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrg, setInviteOrg] = useState("");
  const [inviteCountry, setInviteCountry] = useState("");
  const countries = ["United States", "India", "Germany", "France", "Japan", "China", "Brazil"]; 

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const newSubmission = () => {
    setTitle("");
    setAbstract("");
    setKeywords("");
    setPdfFile(null);
    setAdditionalFiles([]);
    setShowInviteForm(false);
    setInviteFirstName("");
    setInviteLastName("");
    setInviteEmail("");

    if (user && user.id) {
      setAuthors([user]);
    } else {
      setAuthors([]);
    }
    setShowSubmissionForm(true);
  };

  const addAuthorById = (userId) => {
    const userObj = allUsers.find(u => u.id === parseInt(userId, 10));
    if (userObj && !authors.some(a => a.id === userObj.id)) {
      setAuthors(prev => [...prev, userObj]);
    }
  };

  const handleRemoveAuthor = (index) => {
    if (authors.length > 1) setAuthors(prev => prev.filter((_, idx) => idx !== index));
    else alert("At least one author is required.");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setAuthors(reorder(authors, result.source.index, result.destination.index));
  };

  const handleInviteAuthor = async (e) => {
    e?.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return alert("Fill required fields");
    
    const mockNewUser = { id: Date.now(), firstname: inviteFirstName, lastname: inviteLastName, email: inviteEmail, organisation: inviteOrg };
    setAuthors(prev => [...prev, mockNewUser]);
    setShowInviteForm(false);
  };

  const handleAddAdditionalFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdditionalFiles(prev => [...prev, file]);
      e.target.value = null; 
    }
  };

  const handleRemoveAdditionalFile = (indexToRemove) => {
    setAdditionalFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePaperSubmit = async (event) => {
    event.preventDefault();
    if (!pdfFile) return alert("Please upload a PDF");
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('keywords', JSON.stringify(keywords.split(',')));
    formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
    formData.append('pdfFile', pdfFile);

    if (additionalFiles && additionalFiles.length > 0) {
      additionalFiles.forEach((file) => {
        formData.append('additionalFiles', file); 
      });
    }

    try {
      const response = await fetch('http://localhost:3001/journal/savepaper', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Paper Saved Successfully!');
        setShowSubmissionForm(false);
        getPapers(); 
      } else {
        alert("Failed to save paper");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving paper");
    }
  };

  const getPapers = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`http://localhost:3001/journal/papers?authorId=${user.id}`);
        const data = await response.json();
        setPapers(data.papers || []);
      } catch (err) { setPapers([]); }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
        try {
            const userRes = await fetch('http://localhost:3001/users/emails');
            const userData = await userRes.json();
            setAllUsers(userData.users || []);
        } catch(e) { console.error(e); }
    };
    fetchData();
    getPapers();
  }, [user]);

  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    const ROLE_CONFIG = {
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

  // --- Derived Paper Lists by Tab Category ---
  const pendingPapers = papers.filter(p => getTabCategory(p) === "Pending Submission");
  const sentBackPapers = papers.filter(p => getTabCategory(p) === "Sent Back To Author");
  const underReviewPapers = papers.filter(p => getTabCategory(p) === "Under Review");
  const acceptedPapers = papers.filter(p => getTabCategory(p) === "Accepted");
  const rejectedPapers = papers.filter(p => getTabCategory(p) === "Rejected");

  // Revisions Sub-Tabs
  const revRequiredPapers = papers.filter(p => getTabCategory(p) === "Revision Required");
  const revPendingPapers = papers.filter(p => getTabCategory(p) === "Pending Revision Submission");
  const revUnderReviewPapers = papers.filter(p => getTabCategory(p) === "Revisions Under Review");
  const revDeclinedPapers = papers.filter(p => getTabCategory(p) === "Declined Revisions");
  
  const allRevisionsPapers = [...revRequiredPapers, ...revPendingPapers, ...revUnderReviewPapers, ...revDeclinedPapers];

  const TabButton = ({ id, label, count }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === id 
            ? "border-[#059669] text-[#059669]" 
            : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
        }`}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {count}
            </span>
        )}
    </button>
  );

  const SubTabButton = ({ id, label, count }) => (
    <button
        onClick={() => setActiveSubTab(id)}
        className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeSubTab === id 
            ? "border-[#059669] text-[#059669]" 
            : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
        }`}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSubTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {count}
            </span>
        )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#1f2937]">Submission Portal</h2>
            <button 
                onClick={newSubmission}
                className="px-4 py-2 bg-[#059669] text-white font-medium rounded-lg hover:bg-[#047857] transition-colors shadow-sm"
            >
                + New Submission
            </button>
        </div>

        {/* MAIN TABS */}
        <div className="border-b border-[#e5e7eb] flex flex-wrap gap-6 mb-6">
           <TabButton id="all" label="All Submissions" count={papers.length} />
           <div className="w-px bg-gray-300 h-6 my-auto mx-2"></div> 
           <TabButton id="pending" label="Pending Submission" count={pendingPapers.length} />
           <TabButton id="sent_back" label="Sent Back To Author" count={sentBackPapers.length} />
           <TabButton id="under_review" label="Under Review" count={underReviewPapers.length} />
           <TabButton id="revisions" label="Revisions" count={allRevisionsPapers.length} />
           <TabButton id="accepted" label="Accepted" count={acceptedPapers.length} />
           <TabButton id="rejected" label="Rejected" count={rejectedPapers.length} />
        </div>

        {/* SUB TABS */}
        {activeTab === "revisions" && (
            <div className="border-b border-[#e5e7eb] flex flex-wrap gap-6 mb-6 ml-4">
               <SubTabButton id="rev_required" label="Revision Required" count={revRequiredPapers.length} />
               <SubTabButton id="rev_pending" label="Pending Revision Submission" count={revPendingPapers.length} />
               <SubTabButton id="rev_under_review" label="Revisions Under Review" count={revUnderReviewPapers.length} />
               <SubTabButton id="rev_declined" label="Declined Revisions" count={revDeclinedPapers.length} />
            </div>
        )}

        <StatsGrid papers={papers} />

        {/* DYNAMIC LISTS */}
        <div className="mt-6">
            {activeTab === "all" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-[#1f2937] mb-4">All Manuscripts</h3>
                    {/* Pass isRevisionTab as false because this is the 'All' tab */}
                    <PaperList papers={papers} isRevisionTab={false} />
                </div>
            )}

            {activeTab === "pending" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Drafts & Pending Submissions</h3>
                     <PaperList papers={pendingPapers} isRevisionTab={false} />
                </div>
            )}

            {activeTab === "sent_back" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Sent Back To Author</h3>
                     <PaperList papers={sentBackPapers} isRevisionTab={false} />
                </div>
            )}

            {activeTab === "under_review" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Papers Under Review</h3>
                     <PaperList papers={underReviewPapers} isRevisionTab={false} />
                </div>
            )}

            {/* Revision Sub-Tabs Views - Pass isRevisionTab as TRUE */}
            {activeTab === "revisions" && activeSubTab === "rev_required" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Revision Required</h3>
                     <PaperList papers={revRequiredPapers} isRevisionTab={true} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_pending" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Pending Revision Submission</h3>
                     <PaperList papers={revPendingPapers} isRevisionTab={true} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_under_review" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Revisions Under Review</h3>
                     <PaperList papers={revUnderReviewPapers} isRevisionTab={true} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_declined" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Declined Revisions</h3>
                     <PaperList papers={revDeclinedPapers} isRevisionTab={true} />
                </div>
            )}

            {activeTab === "accepted" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Published / Accepted Papers</h3>
                     <PaperList papers={acceptedPapers} isRevisionTab={false} />
                </div>
            )}

            {activeTab === "rejected" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Rejected Submissions</h3>
                     <PaperList papers={rejectedPapers} isRevisionTab={false} />
                </div>
            )}
        </div>
      </main>

      {/* --- SUBMISSION MODAL --- */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#1f2937]">New Manuscript Submission</h3>
                <button onClick={() => setShowSubmissionForm(false)} className="text-[#6b7280] hover:text-[#1f2937]">✕</button>
             </div>

             <form className="space-y-4" onSubmit={handlePaperSubmit}>
               <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                  <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={4}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords (comma-separated)</label>
                  <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} required
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors (drag to reorder)</label>
                  <div className="space-y-2">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="authors-droppable-new">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {authors.map((author, index) => (
                              <Draggable key={author?.id ?? `new-author-${index}`} draggableId={String(author?.id ?? `new-author-${index}`)} index={index}>
                                {(prov) => (
                                  <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                    <div {...prov.dragHandleProps} className="cursor-grab select-none text-[#6b7280]">☰</div>
                                    <div className="flex-1"><CompactAuthorCard author={author} /></div>
                                    <button type="button" onClick={() => handleRemoveAuthor(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {!showInviteForm && (
                      <div className="flex gap-2 items-center mt-2">
                        <select defaultValue="" onChange={(e) => { addAuthorById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                          <option value="" disabled>-- Add another author by email --</option>
                          {allUsers.filter(u => u && u.id && !authors.some(a => a && a.id === u.id)).map(u => (<option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>))}
                        </select>
                        <button type="button" onClick={() => setShowInviteForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                      </div>
                    )}

                    {showInviteForm && (
                      <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                          <h4 className="font-medium text-[#1f2937]">Invite New Author</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="First Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                            <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Last Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                          </div>
                          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email Address*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                          <input type="text" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} placeholder="Organisation" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                          <select value={inviteCountry} onChange={e => setInviteCountry(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb]">
                            <option value="">Select Country</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="flex gap-3">
                            <button type="button" onClick={handleInviteAuthor} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90">Add User</button>
                            <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                          </div>
                      </div>
                    )}
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">Upload Manuscript (PDF)</label>
                  <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" required 
                    className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20" />
               </div>

               {pdfFile && (
                 <div className="pt-4 mt-2 border-t border-[#e5e7eb] transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Add Additional Documents (Merge Order)</label>
                    <p className="text-xs text-[#6b7280] mb-3">Please upload supporting documents one by one in the exact order you want them merged with the main paper.</p>
                    
                    {additionalFiles.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {additionalFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 text-sm border border-[#e5e7eb] rounded-md bg-white shadow-sm">
                            <span className="font-medium text-[#1f2937] truncate flex-1">
                              <span className="text-[#059669] mr-2 font-bold">{i + 1}.</span> {file.name}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveAdditionalFile(i)} 
                              className="ml-3 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input 
                      type="file" 
                      onChange={handleAddAdditionalFile}
                      className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#3b82f6]/10 file:text-[#3b82f6] hover:file:bg-[#3b82f6]/20 cursor-pointer" 
                    />
                 </div>
               )}

               <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                 <button type="submit" disabled={!pdfFile} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    Compile And Save Paper
                 </button>
                 <button type="button" onClick={() => setShowSubmissionForm(false)} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">
                    Cancel
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}