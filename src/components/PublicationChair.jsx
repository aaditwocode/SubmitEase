"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { useUserData } from "./UserContext";

// --- Helper Functions ---
const getStatusBadge = (paper) => {
  if (paper.Completed) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Completed</span>;
  }
  if (paper.CopyrightURL && paper.FinalPaperURL) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Ready for Review</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending Docs</span>;
};

// --- Paper List Component ---
const PaperList = ({ papers, onRemind, onSendBack, onViewFile, onBulkApprove }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredPapers = papers.filter((paper) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      paper.id?.toString().toLowerCase().includes(searchLower) ||
      paper.Title?.toLowerCase().includes(searchLower) ||
      paper.authors?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredPapers.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search papers (ID, Title, Authors...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
        {selectedIds.length > 0 && (
          <button
            onClick={() => {
              onBulkApprove(selectedIds);
              setSelectedIds([]);
            }}
            className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047a56] font-medium"
          >
            Approve Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="py-3 px-4 text-left">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={filteredPapers.length > 0 && selectedIds.length === filteredPapers.length}
                className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
              />
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Authors</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Correspondent</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Final Paper</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Copyright</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(paper.id)}
                    onChange={() => handleSelectOne(paper.id)}
                    className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
                  />
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937] truncate">{paper.id}</td>
                <td className="py-3 px-4 truncate">
                  <div>
                    <p className="text-sm font-medium text-[#1f2937] truncate">{paper.Title}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate">{paper.authors}</td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate">{paper.correspondent}</td>
                <td className="py-3 px-4">
                  {paper.FinalPaperURL ? (
                    <button onClick={() => onViewFile(paper.FinalPaperURL)} className="text-sm text-[#059669] hover:underline text-left">View Final Paper</button>
                  ) : <span className="text-sm text-red-500">Missing Final Paper</span>}
                </td>
                <td className="py-3 px-4">
                  {paper.CopyrightURL ? (
                    <button onClick={() => onViewFile(paper.CopyrightURL)} className="text-sm text-[#059669] hover:underline text-left">View Copyright</button>
                  ) : <span className="text-sm text-red-500">Missing Copyright</span>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center gap-2">
                    {/* Button 1: Remind Author */}
                    <button
                      onClick={() => onRemind(paper)}
                      disabled={paper.isProcessing}
                      className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md hover:bg-[#047a56] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {paper.isProcessing ? "Sending..." : "Remind Author"}
                    </button>

                    {/* Button 2: Send Back to Author */}
                    <button
                      onClick={() => onSendBack(paper)}
                      className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                      Send Back
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center text-gray-500 py-4">No papers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Modal Component for "Send Back" Message ---
const SendBackModal = ({ isOpen, onClose, onConfirm, paper }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) setMessage(""); // Reset message when modal opens
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Send Back Paper: {paper?.id}</h3>
        <p className="text-sm text-gray-600">
          This action will mark the paper as <b>Incomplete</b> (Completed: false). Please provide a reason or instructions for the author.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Message to Author</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
            rows="5"
            placeholder="e.g., The copyright form is blurred. Please re-upload..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(paper, message)}
            disabled={!message.trim()}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Publication Chair Component ---
export default function PublicationChairPortal() {
  const navigate = useNavigate();
  const { hashedConId } = useParams();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUser, setloginStatus } = useUserData();
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- Fetch Logic ---
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        const confId = hashedConId ? Base64.decode(hashedConId) : null;
        if (!confId) throw new Error("Invalid Conference ID");

        // Replace with your actual backend endpoint
        const response = await fetch(`http://localhost:3001/conference/finalpapers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conferenceId: confId }),
        });
        if (!response.ok) throw new Error("Failed to fetch papers");

        const data = await response.json();
        const formattedPapers = (data.paper || []).map((p) => ({
          id: p.id,
          Title: p.Title,
          authors: p.Authors ? p.Authors.map(a => `${a.firstname} ${a.lastname}`).join(", ") : "Unknown",
          correspondent: p.User?.email || "N/A",
          CopyrightURL: p.CopyrightURL,
          FinalPaperURL: p.FinalPaperURL,
          Completed: p.Completed,
          isProcessing: false
        }));

        setPapers(formattedPapers);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [hashedConId]);

  // --- Handlers ---

  const handleViewFile = (url) => {
    if (url) {
      window.open(`http://localhost:3001/${url}`, "_blank");
    }
  };

  const handleRemindAuthor = async (paper) => {
    try {
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: true } : p));

      const response = await fetch(`http://localhost:3001/paper/${paper.id}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: paper.correspondent,
          type: "general_reminder" // Backend can handle template
        }),
      });

      if (!response.ok) throw new Error("Failed to send reminder");
      alert(`Reminder sent to ${paper.correspondent}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
    }
  };

  // Open Modal
  const initiateSendBack = (paper) => {
    setSelectedPaper(paper);
    setIsModalOpen(true);
  };

  // Confirm Send Back (Actual API Call)
  const handleSendBackConfirm = async (paper, message) => {
    try {
      setIsModalOpen(false); // Close modal immediately
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: true } : p));

      const response = await fetch(`http://localhost:3001/paper/${paper.id}/send-back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: paper.correspondent,
          message: message,
          action: "mark_incomplete" // Signal backend to set Completed = false
        }),
      });

      if (!response.ok) throw new Error("Failed to update paper status");

      // Update local state to reflect change (Completed -> false)
      setPapers(prev => prev.map(p =>
        p.id === paper.id ? { ...p, Completed: false, isProcessing: false } : p
      ));

      alert("Paper sent back to author. Status updated to Incomplete.");

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
    }
  };

  // --- Bulk Approve ---
  const handleBulkApprove = async (paperIds) => {
    if (!confirm(`Are you sure you want to approve ${paperIds.length} papers?`)) return;

    try {
      const response = await fetch('http://localhost:3001/paper/bulk-approve-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperIds }),
      });

      if (!response.ok) throw new Error('Failed to bulk approve papers');

      const result = await response.json();
      alert(`Successfully approved ${result.count} papers.`);

      // Refresh papers to show updated status
      setPapers(prevPapers =>
        prevPapers.map(paper =>
          paperIds.includes(paper.id) ? { ...paper, Completed: true } : paper
        )
      );
    } catch (error) {
      console.error('Bulk approve error:', error);
      alert('Failed to approve papers.');
    }
  };

  // --- Render ---
  if (loading) return <div className="flex justify-center items-center h-screen text-[#059669]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;
  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    // 1. Configuration: Maps DB Role Strings -> Frontend Routes
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/conference" },
      "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
      "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
      "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
      "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
      "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
    };
  
    // 2. Filter options based on the current user's roles
    const availablePortals = useMemo(() => {
      if (!user || !user.role || !Array.isArray(user.role)) return [];
      return user.role
        .map(roleString => ROLE_CONFIG[roleString])
        .filter(Boolean);
    }, [user]);
  
    const handleLogout = () => {
      setUser(null);
      setloginStatus(false);
      navigate("/home");
    };
  
    return (
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left Side: Logo & Register Tab */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
  
            {/* Clean Navbar - Only Register remains */}
            <nav className="hidden items-center md:flex">
              <button 
                onClick={() => navigate('/conference/registration')}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#059669] hover:bg-green-50 px-3 py-2 rounded-md"
              >
                Register a Conference
              </button>
            </nav>
          </div>
  
          {/* Right Side: Actions */}
          <div className="flex items-center gap-3">
            
            {/* 1. Dynamic "Switch Portal" Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="group flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors bg-white"
              >
                Switch Portal
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
  
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
  
                  {/* Divider if we have dynamic roles */}
                  {availablePortals.length > 0 && (
                    <div className="border-gray-100 my-1"></div>
                  )}
  
                  {/* Dynamic Links based on User Roles */}
                  {availablePortals.length > 0 && (
                    <>
                      <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Your Roles
                      </h6>
                      {availablePortals.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(option.path);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
  
            {/* 2. Return to Dashboard */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90"
            >
              Return To Dashboard
            </button>
  
            {/* 3. Logout */}
            <button 
              onClick={handleLogout} 
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  };
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <button onClick={() => navigate("/conference/manage")} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
          &larr; Back to All Conferences
        </button>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-[#1f2937]">Publication Chair Portal</h2>
        </div>

        {/* Statistics - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Total Papers</h3>
            <p className="text-3xl font-bold text-[#059669]">{papers.length}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Completed</h3>
            <p className="text-3xl font-bold text-[#059669]">{papers.filter(p => p.Completed).length}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Pending Actions</h3>
            <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => !p.Completed).length}</p>
          </div>
        </div>

        {/* Main Table */}
        <PaperList
          papers={papers}
          onRemind={handleRemindAuthor}
          onSendBack={initiateSendBack}
          onViewFile={handleViewFile}
          onBulkApprove={handleBulkApprove}
        />
      </main>

      {/* Modal */}
      <SendBackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSendBackConfirm}
        paper={selectedPaper}
      />
    </div>
  );
}