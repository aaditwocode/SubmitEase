"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    const revStatus = revs[0].Status;
    if (revStatus === "Accepted") return "Accepted"; 
    if (revStatus === "Rejected" || revStatus === "Declined") return "Declined Revisions";
    if (revStatus === "Pending Submission") return "Pending Revision Submission";
    if (revStatus === "Under Review") return "Revisions Under Review";
    return revStatus; 
  }
  
  return paper.Status; 
};

// --- CORE LOGIC: Calculate Progress (Using Strictly Backend Variables) ---
const calculateProgress = (paper) => {
  const rawStatus = paper.effectiveStatus || paper.Status || "";
  const status = rawStatus.toLowerCase();

  if (status === "pending submission") {
    return <span className="text-xs font-medium text-gray-500 italic">Pending Submission</span>;
  }

  if (status === "accepted" || status === "rejected" || status === "revision required") {
    return <span className="text-xs font-semibold text-green-600">✅ Completed</span>;
  }

  if (status === "under review" || status === "awaiting final decision") {
    const hasEditor = paper.hasEditor !== undefined ? paper.hasEditor : false;
    const totalReviews = paper.reviewersInvited !== undefined ? paper.reviewersInvited : 0;
    const completedReviews = paper.reviewersSubmitted !== undefined ? paper.reviewersSubmitted : 0;
    const editorDecisionMade = paper.editorDecisionMade !== undefined ? paper.editorDecisionMade : false;

    return (
      <div className="flex flex-col text-xs text-gray-600 gap-1 mt-1">
        <span className="flex items-center gap-1 font-medium">
          {hasEditor ? "🧑‍🏫 Editor Assigned" : "⏳ Awaiting Editor"}
        </span>
        {hasEditor && (
          <>
            <span className="flex items-center gap-1">
              📝 {completedReviews}/{totalReviews} Reviews Completed
            </span>
            <span className="flex items-center gap-1">
              {editorDecisionMade ? "⚖️ Editor Decision Made" : "⏳ Awaiting Editor Decision"}
            </span>
          </>
        )}
      </div>
    );
  }

  return <span className="text-xs text-gray-400">Processing</span>;
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

// --- Updated Paper List Component with Progress Column ---
const PaperList = ({ papers, isRevisionTab, journalid }) => {
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
    const processedPapers = (papers || []).map((paper) => {
      // NEW: Extract the latest revision if it exists
      const latestRev = paper.Revisions?.[0];
      
      return {
        ...paper,
        effectiveStatus: latestRev?.Status || paper.Status, 
        effectiveTitle: latestRev?.Title || paper.Title,         // Uses Revision Title
        effectiveKeywords: latestRev?.Keywords || paper.Keywords // Uses Revision Keywords
      };
    });

    const filtered = processedPapers.filter((paper) => {
      const lowerSearch = searchTerm.toLowerCase();
      const keywordsString = Array.isArray(paper.effectiveKeywords) ? paper.effectiveKeywords.join(" ").toLowerCase() : "";
      
      return (
        paper.effectiveTitle?.toLowerCase().includes(lowerSearch) ||
        paper.id?.toString().includes(lowerSearch) || // Original ID remains searchable
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
          placeholder="Search submissions (Title, ID, Status, Keywords...)"
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
                Progress
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
                  {/* Shows Original ID */}
                  <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">
                    {paper.id} 
                  </td>
                  
                  {/* Shows Latest Revision Title */}
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-[#1f2937]">{paper.effectiveTitle}</p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4 text-sm text-[#1f2937]">
                    {formatDate(paper.submittedAt)}
                  </td>
                  
                  {/* Shows Latest Revision Keywords */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(paper.effectiveKeywords || []).map((keyword, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Shows "Revised Paper" Badge + Latest Status */}
                  <td className="py-3 px-4">
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
                      {/* PROGRESS DISPLAY */}
                      {calculateProgress(paper)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/journal/${journalid}/author/paper/${paper.id}`)}
                      className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
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
  const { journalid } = useParams();

  const [papers, setPapers] = useState([]);
  const [journalUsers, setJournalUsers] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [currentJournalName, setCurrentJournalName] = useState("");

  // --- UI State ---
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); 
  const [activeSubTab, setActiveSubTab] = useState("rev_required"); 

  // --- Author Modal State ---
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [authorModalTab, setAuthorModalTab] = useState("journal"); // 'journal', 'platform', 'new'
  const [authorSearchTerm, setAuthorSearchTerm] = useState("");

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authors, setAuthors] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]); 
  
  // --- Invite Form State ---
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

  const getPapers = async () => {
    if (user?.id && journalid) {
      try {
        const response = await fetch(`http://localhost:3001/journal/papers?authorId=${user.id}&journalId=${journalid}`);
        const data = await response.json();
        setPapers(data.papers || []);
      } catch (err) { setPapers([]); }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
        if (!journalid) return;

        // Fetch Tab 1: Users associated with THIS journal
        try {
            // Updated to fetch from the journal-scoped endpoint as requested
            const journalUsersRes = await fetch(`http://localhost:3001/journal/users?journalId=${journalid}`);
            if (journalUsersRes.ok) {
                const data = await journalUsersRes.json();
                setJournalUsers(data.users || []);
            }
        } catch(e) { console.error("Error fetching journal users", e); }

        // Fetch Tab 2: ALL Platform Users (for the Register Other Users tab)
        try {
            // Updated to fetch from the global platform users endpoint
            const platformUsersRes = await fetch(`http://localhost:3001/users/emails`); 
            if (platformUsersRes.ok) {
                const data = await platformUsersRes.json();
                setPlatformUsers(data.users || []);
            }
        } catch(e) { console.error("Error fetching platform users", e); }

        // Find current journal name from user context
        if (user && user.activeJournals) {
            const matchingJournal = user.activeJournals.find(j => j.journalId === parseInt(journalid, 10));
            if (matchingJournal) {
                setCurrentJournalName(matchingJournal.journalName);
            }
        }
    };

    fetchUserData();
    getPapers();
  }, [user, journalid]);

  // --- Filtering Logic for Unified Modal ---
  const modalUsersToDisplay = useMemo(() => {
      let list = authorModalTab === 'journal' ? journalUsers : platformUsers;
      
      // Filter out people already added as authors
      list = list.filter(u => u && u.id && !authors.some(a => a && a.id === u.id));

      // If viewing the 'Register Other Users' tab, exclude those already in the journal
      if (authorModalTab === 'platform') {
          list = list.filter(u => !journalUsers.some(ju => ju.id === u.id));
      }

      // Apply text search filter
      if (authorSearchTerm.trim()) {
          const lowerTerm = authorSearchTerm.toLowerCase();
          list = list.filter(u => 
              u.firstname?.toLowerCase().includes(lowerTerm) ||
              u.lastname?.toLowerCase().includes(lowerTerm) ||
              u.email?.toLowerCase().includes(lowerTerm) ||
              u.organisation?.toLowerCase().includes(lowerTerm) ||
              (u.expertise && u.expertise.some(exp => exp.toLowerCase().includes(lowerTerm)))
          );
      }

      return list;
  }, [authorModalTab, journalUsers, platformUsers, authors, authorSearchTerm]);

  const newSubmission = () => {
    setTitle("");
    setAbstract("");
    setKeywords("");
    setPdfFile(null);
    setAdditionalFiles([]);
    setShowAuthorModal(false);
    setAuthorSearchTerm("");

    if (user && user.id) {
      setAuthors([user]);
    } else {
      setAuthors([]);
    }
    setShowSubmissionForm(true);
  };

  // --- AUTHOR MODAL SUBMIT LOGIC ---
  const handleAddJournalUser = (userId) => {
    const userObj = journalUsers.find(u => u.id === userId);
    if (userObj && !authors.some(a => a.id === userObj.id)) {
      setAuthors(prev => [...prev, userObj]);
    }
    setShowAuthorModal(false);
    setAuthorSearchTerm("");
  };

  const handleRegisterAndAddPlatformUser = async (userId) => {
    try {
        const res = await fetch('http://localhost:3001/journals/register-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId, 10), journalId: parseInt(journalid, 10) })
        });
        if (res.ok) {
            const userObj = platformUsers.find(u => u.id === userId);
            if (userObj && !authors.some(a => a.id === userObj.id)) {
                setAuthors(prev => [...prev, userObj]);
            }
            setShowAuthorModal(false);
            setAuthorSearchTerm("");
        } else {
            alert("Failed to register user to journal.");
        }
    } catch (e) {
        console.error(e);
        alert("Network error while registering user.");
    }
  };

  const handleInviteNewAuthor = (e) => {
    e?.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) return alert("Fill required fields");
    
    const mockNewUser = { id: Date.now(), firstname: inviteFirstName, lastname: inviteLastName, email: inviteEmail, organisation: inviteOrg };
    setAuthors(prev => [...prev, mockNewUser]);
    setShowAuthorModal(false);
    
    // Clear form
    setInviteFirstName("");
    setInviteLastName("");
    setInviteEmail("");
    setInviteOrg("");
  };

  const handleRemoveAuthor = (index) => {
    if (authors.length > 1) setAuthors(prev => prev.filter((_, idx) => idx !== index));
    else alert("At least one author is required.");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setAuthors(reorder(authors, result.source.index, result.destination.index));
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
    if (!journalid) return alert("Journal ID is missing");
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('journalId', journalid);
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

  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: `/journal/${journalid}/author` },
      "Journal Editor": { label: "Editor", path: `/journal/${journalid}/editor` },
      "Journal Reviewer": { label: "Reviewer", path: `/journal/${journalid}/reviewer` },
      "Editor-in-Chief": { label: "Editor-In-Chief", path: `/journal/${journalid}/eic` },
      "Journal Host": { label: "Journal Host", path: `/journal/${journalid}/journalhost` }
    };
  
    const availablePortals = useMemo(() => {
      if (!user || !user.activeJournals) return [];
      const currentJournal = user.activeJournals.find((j) => j.journalId === parseInt(journalid, 10));
      const rolesForThisJournal = currentJournal?.roles || [];
      
      return rolesForThisJournal
        .map(roleString => ROLE_CONFIG[roleString])
        .filter(Boolean);
    }, [user, journalid]);
  
    return (
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
              {currentJournalName && (
                  <>
                      <span className="text-gray-300 mx-1">|</span>
                      <span className="text-sm font-semibold text-[#059669] truncate max-w-[200px] md:max-w-md">{currentJournalName}</span>
                  </>
              )}
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
                  {availablePortals.length > 0 ? (
                    <>
                      <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roles</h6>
                      {availablePortals.map((option, index) => (
                        <button key={index} onMouseDown={() => { navigate(option.path); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]">
                          {option.label}
                        </button>
                      ))}
                    </>
                  ) : (
                      <p className="px-4 py-2 text-sm text-gray-500 italic">No portal access assigned.</p>
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

  const pendingPapers = papers.filter(p => getTabCategory(p) === "Pending Submission");
  const sentBackPapers = papers.filter(p => getTabCategory(p) === "Sent Back To Author");
  const underReviewPapers = papers.filter(p => getTabCategory(p) === "Under Review");
  const acceptedPapers = papers.filter(p => getTabCategory(p) === "Accepted");
  const rejectedPapers = papers.filter(p => getTabCategory(p) === "Rejected");

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
                    <PaperList papers={papers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}

            {activeTab === "pending" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Drafts & Pending Submissions</h3>
                     <PaperList papers={pendingPapers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}

            {activeTab === "sent_back" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Sent Back To Author</h3>
                     <PaperList papers={sentBackPapers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}

            {activeTab === "under_review" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Papers Under Review</h3>
                     <PaperList papers={underReviewPapers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}

            {/* Revision Sub-Tabs Views */}
            {activeTab === "revisions" && activeSubTab === "rev_required" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Revision Required</h3>
                     <PaperList papers={revRequiredPapers} isRevisionTab={true} journalid={journalid} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_pending" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Pending Revision Submission</h3>
                     <PaperList papers={revPendingPapers} isRevisionTab={true} journalid={journalid} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_under_review" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Revisions Under Review</h3>
                     <PaperList papers={revUnderReviewPapers} isRevisionTab={true} journalid={journalid} />
                </div>
            )}
            
            {activeTab === "revisions" && activeSubTab === "rev_declined" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Declined Revisions</h3>
                     <PaperList papers={revDeclinedPapers} isRevisionTab={true} journalid={journalid} />
                </div>
            )}

            {activeTab === "accepted" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Published / Accepted Papers</h3>
                     <PaperList papers={acceptedPapers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}

            {activeTab === "rejected" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                     <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Rejected Submissions</h3>
                     <PaperList papers={rejectedPapers} isRevisionTab={false} journalid={journalid} />
                </div>
            )}
        </div>
      </main>

      {/* --- SUBMISSION MODAL --- */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
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
                  <label className="block text-sm font-medium text-[#1f2937] mb-2 flex justify-between items-center">
                    <span>Authors (drag to reorder)</span>
                    <button type="button" onClick={() => setShowAuthorModal(true)} className="text-sm px-3 py-1 bg-[#059669]/10 text-[#059669] font-medium rounded-md hover:bg-[#059669]/20 transition-colors">
                      + Add / Invite Author
                    </button>
                  </label>

                  <div className="space-y-2">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="authors-droppable-new">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {authors.map((author, index) => (
                              <Draggable key={author?.id ?? `new-author-${index}`} draggableId={String(author?.id ?? `new-author-${index}`)} index={index}>
                                {(prov) => (
                                  <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white shadow-sm">
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

      {/* --- UNIFIED USER SELECTION MODAL --- */}
      {showAuthorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <h3 className="text-lg font-bold text-[#1f2937]">Add Co-Author</h3>
                    <button onClick={() => setShowAuthorModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>

                <div className="flex border-b border-[#e5e7eb] px-5 pt-3 bg-white">
                    <button 
                        className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'journal' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => { setAuthorModalTab('journal'); setAuthorSearchTerm(''); }}
                    >
                        Registered Journal Users
                    </button>
                    <button 
                        className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'platform' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => { setAuthorModalTab('platform'); setAuthorSearchTerm(''); }}
                    >
                        Register Other Users To Journal
                    </button>
                    <button 
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'new' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => setAuthorModalTab('new')}
                    >
                        Invite Brand New User
                    </button>
                </div>

                <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                    {authorModalTab === 'new' ? (
                        <form onSubmit={handleInviteNewAuthor} className="space-y-4 max-w-md mx-auto mt-4">
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                <p className="text-sm text-gray-600 mb-2">We will create a temporary account, assign them the <strong>Author</strong> role, attach them to this paper, and automatically email them login instructions.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="First Name *" required value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                    <input type="text" placeholder="Last Name *" required value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                </div>
                                <input type="email" placeholder="Email Address *" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                <input type="text" placeholder="Organisation" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                <select value={inviteCountry} onChange={e => setInviteCountry(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-sm">
                                    <option value="">Select Country</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button type="submit" className="w-full mt-2 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                    Invite & Add Author
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder={`Search by name, email, organisation, or expertise...`}
                                    value={authorSearchTerm}
                                    onChange={(e) => setAuthorSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white shadow-sm"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {authorModalTab === 'platform' && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                    <p className="text-xs text-yellow-800 font-medium">These users are registered on SubmitEase but are not associated with this journal. Selecting them will register them to the journal and assign them to this paper.</p>
                                </div>
                            )}

                            <div className="space-y-3 mt-4">
                                {modalUsersToDisplay.length === 0 ? (
                                    <div className="text-center py-8 bg-white rounded-md border border-gray-200">
                                        <p className="text-sm text-gray-500 italic">No users found matching your search.</p>
                                    </div>
                                ) : (
                                    modalUsersToDisplay.map(u => (
                                        <div key={u.id} className="p-4 border border-[#e5e7eb] rounded-md hover:border-[#059669] flex justify-between items-center bg-white shadow-sm transition-colors group">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-[#1f2937]">{u.firstname} {u.lastname}</p>
                                                    <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{u.email}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:gap-6 mt-2">
                                                    <p className="text-xs text-[#059669] font-medium"><span className="text-gray-500">Org:</span> {u.organisation || 'Not Specified'}</p>
                                                    <p className="text-xs text-[#059669] font-medium truncate" title={u.expertise?.length ? u.expertise.join(', ') : ''}><span className="text-gray-500">Expertise:</span> {u.expertise?.length ? u.expertise.join(', ') : 'Not Specified'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => authorModalTab === 'platform' ? handleRegisterAndAddPlatformUser(u.id) : handleAddJournalUser(u.id)} 
                                                className="ml-2 px-5 py-2 bg-emerald-50 text-[#059669] border border-[#059669] font-bold text-xs rounded hover:bg-[#059669] hover:text-white transition-colors whitespace-nowrap"
                                            >
                                                {authorModalTab === 'platform' ? `Register & Add` : `Add Co-Author`}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}