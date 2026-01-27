"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions ---
const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  const s = status ? status.toLowerCase() : "";
  
  if (s.includes("accept") || s.includes("approved")) {
    badgeClasses += "bg-green-100 text-green-700";
  } else if (s.includes("reject") || s.includes("declined")) {
    badgeClasses += "bg-red-100 text-red-700";
  } else if (s.includes("revision") || s.includes("changes") || s.includes("modify")) {
    badgeClasses += "bg-orange-100 text-orange-700";
  } else if (s.includes("pending") || s.includes("waiting")) {
    badgeClasses += "bg-red-100 text-red-700"; 
  } else if (s.includes("under review")) {
    badgeClasses += "bg-yellow-100 text-yellow-700"; 
  } else {
    badgeClasses += "bg-gray-100 text-gray-700";
  }
  return <span className={badgeClasses}>{status}</span>;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// --- Header Component ---
const Header = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser, setloginStatus } = useUserData();

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const ROLE_CONFIG = {
    "Author": { label: "Author", path: "/journal" },
    "Editor": { label: "Editor", path: "/editor" },
    "Reviewer": { label: "Reviewer", path: "/reviewer" },
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
          <div className="hidden md:flex items-center gap-6">
              <span className="text-sm font-medium text-[#059669] bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  Editor Portal
              </span>
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
          <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
        </div>
      </div>
    </header>
  );
};

// --- Footer Component ---
const Footer = () => {
    return (
        <footer className="border-t border-[#e5e7eb] bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#059669]">
                            <span className="text-xs font-bold text-white">S</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1f2937]">SubmitEase Editor</span>
                    </div>
                    <p className="text-sm text-[#6b7280]">
                        &copy; {new Date().getFullYear()} SubmitEase. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-sm text-[#6b7280] hover:text-[#059669]">Help Center</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// --- Stats Component ---
const EditorStatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">New Submissions</h3>
        <p className="text-3xl font-bold text-[#1f2937]">{stats.newSubmissions}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Under Review</h3>
        <p className="text-3xl font-bold text-[#059669]">{stats.pendingReviews}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Awaiting Revision</h3>
        <p className="text-3xl font-bold text-[#f59e0b]">{stats.awaitingRevision}</p>
      </div>
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#6b7280]">Editor Invites</h3>
        <p className="text-3xl font-bold text-red-700">{stats.editorInvites}</p>
      </div>
    </div>
  );
};

// --- 1. New Submissions Table ---
const NewSubmissionsTable = ({ papers, onView }) => {
  if (!papers || papers.length === 0) return <p className="text-center text-[#6b7280] py-4">No new submissions found.</p>;
  return (
    <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Details</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Submitted</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Type</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
              <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">#{paper.id}</td>
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-[#1f2937]">{paper.Title}</p>
                <p className="text-xs text-[#6b7280]">{paper.Journal?.name}</p>
              </td>
              <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(paper.submittedAt)}</td>
              <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.type || "Research Article"}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onView?.(paper)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] text-[#1f2937]">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 2. Under Review Table ---
const PendingReviewsTable = ({ papers, onView }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Reviewer Stats</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
              <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">#{paper.id}</td>
              <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.Title}</td>
              <td className="py-3 px-4">
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-[#059669]">{paper.reviewersAssigned || 0} Assigned</span>
                  <span className="text-[#6b7280]">{paper.reviewersInvited || 0} Invited</span>
                </div>
              </td>
              <td className="py-3 px-4">{getStatusBadge(paper.reviewStatus)}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onView?.(paper)} className="px-3 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded hover:bg-[#059669]/20 font-medium">
                  Manage
                </button>
              </td>
            </tr>
          ))}
          {papers.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-[#6b7280]">No papers under review.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// --- 3. Revisions Table (The 4th Subsection) ---
const RevisionsTable = ({ papers, onView }) => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Round</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">#{paper.id}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.Title}</td>
                <td className="py-3 px-4 text-sm text-[#6b7280]">Rev {paper.revisionRound || 1}</td>
                <td className="py-3 px-4">{getStatusBadge("Awaiting Author Revision")}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => onView?.(paper)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] text-[#1f2937]">
                    View
                  </button>
                </td>
              </tr>
            ))}
            {papers.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-[#6b7280]">No papers waiting for revision.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

// --- 4. Editor Invites Table ---
const EditorInvitationsTable = ({ invitations, onView }) => {
  const activeInvitations = invitations.filter(inv => inv.status !== 'Accepted');
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-yellow-50 border-b border-yellow-100">
        <p className="text-sm text-yellow-800">ℹ️ Showing pending invitations to other editors.</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Invited Editor</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Invited On</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeInvitations.map((inv) => (
            <tr key={inv.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
              <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">#{inv.paperId}</td>
              <td className="py-3 px-4 text-sm text-[#1f2937]">{inv.paperTitle}</td>
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-[#1f2937]">{inv.invitedEditorName}</p>
                <p className="text-xs text-[#6b7280]">{inv.invitedEditorEmail}</p>
              </td>
              <td className="py-3 px-4 text-sm text-[#6b7280]">{formatDate(inv.invitedOn)}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onView?.(inv)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] text-[#1f2937]">
                  View
                </button>
              </td>
            </tr>
          ))}
          {activeInvitations.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-[#6b7280]">No pending invites.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Page ---
export default function EditorPortal() {
  const { user } = useUserData();

  // Data States
  const [newSubmissions, setNewSubmissions] = useState([]);
  const [pendingReviewPapers, setPendingReviewPapers] = useState([]);
  const [revisionPapers, setRevisionPapers] = useState([]);
  const [editorInvitations, setEditorInvitations] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState("new_submissions");
  const [viewPaper, setViewPaper] = useState(null);
  const [showPaperModal, setShowPaperModal] = useState(false);

  // Mock Data
  useEffect(() => {
    setNewSubmissions([
      { id: 101, Title: "Machine Learning in Healthcare", Journal: { name: "Journal of AI" }, submittedAt: "2024-01-15", type: "Research Article", keywords: ["ML", "Healthcare"] },
    ]);
    setPendingReviewPapers([
      { id: 201, Title: "Renewable Energy Systems", reviewStatus: "Under Review", reviewersAssigned: 2, reviewersInvited: 5 },
    ]);
    // Added Mock Revisions Data
    setRevisionPapers([
      { id: 301, Title: "Cybersecurity Protocols", revisionRound: 1, submittedAt: "2023-12-20" },
    ]);
    setEditorInvitations([
      { id: 1, paperId: 404, paperTitle: "Deep Learning Stats", invitedEditorName: "Dr. Emily", invitedEditorEmail: "emily@univ.edu", invitedOn: "2024-01-10", status: "Pending" },
    ]);
  }, []);

  const stats = {
    newSubmissions: newSubmissions.length,
    pendingReviews: pendingReviewPapers.length,
    awaitingRevision: revisionPapers.length,
    editorInvites: editorInvitations.filter(i => i.status === "Pending").length, 
  };

  const TabButton = ({ id, label, count }) => (
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
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <h2 className="text-3xl font-bold text-[#1f2937] mb-8">Editor Portal</h2>

        <EditorStatsGrid stats={stats} />

        {/* 4 SUBSECTIONS (Tabs) */}
        <div className="border-b border-[#e5e7eb] flex flex-wrap gap-6 mb-6">
            <TabButton id="new_submissions" label="New Assignments" count={stats.newSubmissions} />
            <TabButton id="pending_reviews" label="Under Review" count={stats.pendingReviews} />
            <TabButton id="revisions" label="Revisions" count={stats.awaitingRevision} />
            <TabButton id="editor_invites" label="Editor Invites" count={stats.editorInvites} />
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "new_submissions" && (
             <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
               <h3 className="text-xl font-semibold text-[#1f2937] mb-4">New Submissions</h3>
               <NewSubmissionsTable papers={newSubmissions} onView={(p) => { setViewPaper(p); setShowPaperModal(true); }} />
             </div>
          )}
          {activeTab === "pending_reviews" && (
             <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Submissions Under Review</h3>
                <PendingReviewsTable papers={pendingReviewPapers} onView={(p) => { setViewPaper(p); setShowPaperModal(true); }} />
             </div>
          )}
          {activeTab === "revisions" && (
             <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Awaiting Revisions from Authors</h3>
                <RevisionsTable papers={revisionPapers} onView={(p) => { setViewPaper(p); setShowPaperModal(true); }} />
             </div>
          )}
          {activeTab === "editor_invites" && (
             <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Associate Editor Invitations</h3>
                <EditorInvitationsTable invitations={editorInvitations} onView={(inv) => { setViewPaper({ ...inv, isInvite: true, Title: inv.paperTitle }); setShowPaperModal(true); }} />
             </div>
          )}
        </div>
      </main>

      <Footer />

      {/* --- PAPER MODAL --- */}
      {showPaperModal && viewPaper && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-start sticky top-0 bg-[#f9fafb] z-10">
              <div>
                <span className="px-2 py-1 bg-[#059669]/10 text-[#059669] text-xs font-bold uppercase rounded mb-2 inline-block">
                  {viewPaper.type || "Submission"}
                </span>
                <h3 className="text-xl font-bold text-[#1f2937]">{viewPaper.Title}</h3>
                <p className="text-sm text-[#6b7280] mt-1">Paper ID: #{viewPaper.id || viewPaper.paperId}</p>
              </div>
              <button onClick={() => setShowPaperModal(false)} className="text-[#6b7280] hover:text-[#1f2937] text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#e5e7eb] p-4 rounded-lg">
                <div>
                    <h4 className="text-xs font-semibold text-[#6b7280] uppercase">Submitted Date</h4>
                    <p className="text-sm font-medium text-[#1f2937]">{formatDate(viewPaper.submittedAt || viewPaper.invitedOn)}</p>
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-[#6b7280] uppercase">Status</h4>
                    <p className="text-sm font-medium text-[#1f2937]">{viewPaper.reviewStatus || viewPaper.status || "New Submission"}</p>
                </div>
                <div>
                     <h4 className="text-xs font-semibold text-[#6b7280] uppercase">Keywords</h4>
                     <p className="text-sm text-[#6b7280]">{viewPaper.keywords ? viewPaper.keywords.join(", ") : "N/A"}</p>
                </div>
              </div>
              {(viewPaper.reviewersAssigned !== undefined) && (
                 <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-900 mb-3">Reviewer Statistics</h4>
                    <div className="flex gap-8">
                        <div>
                            <span className="block text-2xl font-bold text-[#059669]">{viewPaper.reviewersAssigned}</span>
                            <span className="text-xs text-[#6b7280] uppercase font-semibold">Assigned</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-[#1f2937]">{viewPaper.reviewersInvited}</span>
                            <span className="text-xs text-[#6b7280] uppercase font-semibold">Invited</span>
                        </div>
                    </div>
                 </div>
              )}
              <div>
                  <h4 className="text-sm font-bold text-[#1f2937] mb-3">Workflow Actions</h4>
                  <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors shadow-sm">
                          Invite Reviewers
                      </button>
                      <button className="px-4 py-2 bg-white border border-[#e5e7eb] text-[#374151] rounded-md hover:bg-[#f3f4f6] transition-colors shadow-sm">
                          Assign Editor
                      </button>
                      <button className="px-4 py-2 bg-[#f59e0b] text-white rounded-md hover:bg-[#d97706] transition-colors shadow-sm ml-auto">
                          Make Decision
                      </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}