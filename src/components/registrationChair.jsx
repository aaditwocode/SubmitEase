"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { useUserData } from "./UserContext";

// --- Helper Functions ---
// Status Badge Logic based on CompletedRegistration
const getRegistrationStatusBadge = (isApproved) => {
  if (isApproved) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pending
    </span>
  );
};

// --- Paper List Component ---
const PaperList = ({ papers, onRemind, onSendBack, onViewFile, onBulkApprove }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // 1. Filter Logic
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        paper.id?.toString().toLowerCase().includes(searchLower) ||
        paper.Title?.toLowerCase().includes(searchLower) ||
        paper.authors?.toLowerCase().includes(searchLower) ||
        paper.correspondent?.toLowerCase().includes(searchLower)
      );
    });
  }, [papers, searchTerm]);

  // 2. Sorting Logic
  const sortedPapers = useMemo(() => {
    let sortableItems = [...filteredPapers];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
        const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPapers, sortConfig]);

  // Sorting Handler
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (name) => {
    if (sortConfig.key === name) return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    return '';
  };

  // --- Selection Logic ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Only select papers that are NOT verified (CompletedRegistration is false)
      const selectablePapers = sortedPapers
        .filter(p => !p.CompletedRegistration) 
        .map(p => p.id);
      setSelectedIds(selectablePapers);
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

  // Wrapper for Bulk Approve to validate files
  const handleApproveClick = () => {
    // Check if any selected paper is missing the Registration Slip
    const selectedPapersData = papers.filter(p => selectedIds.includes(p.id));
    const invalidPapers = selectedPapersData.filter(p => !p.RegistrationURL);

    if (invalidPapers.length > 0) {
      const invalidIds = invalidPapers.map(p => p.id).join(", ");
      alert(`Cannot approve the following papers because the Registration Slip is missing:\n${invalidIds}`);
      return;
    }

    onBulkApprove(selectedIds);
    setSelectedIds([]);
  };

  // Helper variables for UI
  const selectableCount = sortedPapers.filter(p => !p.CompletedRegistration).length;
  const isAllSelected = selectableCount > 0 && selectedIds.length === selectableCount;
  const headerBtnClass = "flex items-center gap-1 hover:text-[#1f2937] transition-colors focus:outline-none font-medium";

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search (ID, Title, Author, Email...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
        {selectedIds.length > 0 && (
          <button
            onClick={handleApproveClick}
            className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047a56] font-medium"
          >
            Approve Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-gray-50">
            <th className="py-3 px-4 text-left w-10">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={isAllSelected}
                disabled={selectableCount === 0}
                className="rounded border-gray-300 text-[#059669] focus:ring-[#059669] disabled:opacity-50"
              />
            </th>
            {/* Sortable Headers */}
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('id')} className={headerBtnClass}>
                Paper ID {getSortIndicator('id')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('Title')} className={headerBtnClass}>
                Title {getSortIndicator('Title')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('authors')} className={headerBtnClass}>
                Authors {getSortIndicator('authors')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('correspondent')} className={headerBtnClass}>
                Correspondent {getSortIndicator('correspondent')}
              </button>
            </th>
            
            {/* File Column */}
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Registration Slip</th>
            
            {/* Status Column */}
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('CompletedRegistration')} className={headerBtnClass}>
                Status {getSortIndicator('CompletedRegistration')}
              </button>
            </th>
            
            <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPapers.length > 0 ? (
            sortedPapers.map((paper) => (
              <tr 
                key={paper.id} 
                className={`border-b border-[#e5e7eb] transition-colors ${paper.CompletedRegistration ? 'bg-gray-50' : 'hover:bg-[#f3f4f6]/50'}`}
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(paper.id)}
                    onChange={() => handleSelectOne(paper.id)}
                    disabled={paper.CompletedRegistration}
                    className="rounded border-gray-300 text-[#059669] focus:ring-[#059669] disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937] truncate max-w-[100px]">{paper.id}</td>
                <td className="py-3 px-4 truncate max-w-[200px]" title={paper.Title}>
                  <div>
                    <p className="text-sm font-medium text-[#1f2937] truncate">{paper.Title}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate max-w-[150px]" title={paper.authors}>{paper.authors}</td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate max-w-[150px]" title={paper.correspondent}>{paper.correspondent}</td>
                
                {/* Registration Slip Column */}
                <td className="py-3 px-4">
                  {paper.RegistrationURL ? (
                    <button onClick={() => onViewFile(paper.RegistrationURL)} className="text-sm text-[#059669] hover:underline text-left">
                      View Slip
                    </button>
                  ) : (
                    <span className="text-sm text-red-500 font-medium">Missing Slip</span>
                  )}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4">
                   {getRegistrationStatusBadge(paper.CompletedRegistration)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onRemind(paper)}
                      disabled={paper.isProcessing || paper.CompletedRegistration}
                      className="px-3 py-1 text-xs font-medium bg-[#059669] text-white rounded hover:bg-[#047a56] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {paper.isProcessing ? "Sending..." : "Remind"}
                    </button>

                    <button
                      onClick={() => onSendBack(paper)}
                      disabled={paper.isProcessing || paper.CompletedRegistration}
                      className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
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

// --- Modal Component ---
const SendBackModal = ({ isOpen, onClose, onConfirm, paper }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) setMessage("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Reject Registration: {paper?.id}</h3>
        <p className="text-sm text-gray-600">
          This action will mark the registration as <b>Pending</b> (Invalid). Please explain why (e.g., blurred slip, wrong amount).
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Message to Author</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
            rows="5"
            placeholder="e.g., The transaction ID is not visible. Please re-upload..."
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

// --- Main Registration Chair Component ---
export default function RegistrationChairPortal() {
  const navigate = useNavigate();
  const { hashedConId } = useParams();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser, setloginStatus } = useUserData();
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // --- Fetch Logic ---
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        const confId = hashedConId ? Base64.decode(hashedConId) : null;
        if (!confId) throw new Error("Invalid Conference ID");

        // Fetch Papers
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
          RegistrationURL: p.RegistrationURL, // Specific to Registration
          CompletedRegistration: p.CompletedRegistration, // Specific Boolean from DB
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
      window.open(url);
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
          type: "registration_reminder"
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

      const response = await fetch(`http://localhost:3001/paper/${paper.id}/send-back-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: paper.correspondent,
          message: message,
          action: "mark_incomplete" 
        }),
      });

      if (!response.ok) throw new Error("Failed to update paper status");

      // Update local state: CompletedRegistration -> false
      setPapers(prev => prev.map(p =>
        p.id === paper.id ? { ...p, CompletedRegistration: false, isProcessing: false } : p
      ));

      alert("Registration rejected. Author notified.");

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
    }
  };

  // --- Bulk Approve ---
  const handleBulkApprove = async (paperIds) => {
    if (!confirm(`Are you sure you want to verify ${paperIds.length} registrations?`)) return;

    try {
      const response = await fetch('http://localhost:3001/paper/bulk-approve-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperIds }),
      });

      if (!response.ok) throw new Error('Failed to bulk approve registrations');

      const result = await response.json();
      alert(`Successfully verified ${result.count} registrations.`);

      // Update state
      setPapers(prevPapers =>
        prevPapers.map(paper =>
          paperIds.includes(paper.id) ? { ...paper, CompletedRegistration: true } : paper
        )
      );
    } catch (error) {
      console.error('Bulk approve error:', error);
      alert('Failed to approve registrations.');
    }
  };

  // --- Header Component ---
  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/conference" },
      "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
      "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
      "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
      "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
      "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
    };
  
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
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
            <nav className="hidden items-center md:flex">
              <button 
                onClick={() => navigate('/conference/registration')}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#059669] hover:bg-green-50 px-3 py-2 rounded-md"
              >
                Register a Conference
              </button>
            </nav>
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
                  {availablePortals.length > 0 && <div className="border-gray-100 my-1"></div>}
                  {availablePortals.length > 0 && (
                    <>
                      <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roles</h6>
                      {availablePortals.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => { navigate(option.path); setIsDropdownOpen(false); }}
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
            <button onClick={() => navigate('/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">
              Return To Dashboard
            </button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-[#059669]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <button onClick={() => navigate("/conference/manage/registrationchair")} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
          &larr; Back to All Conferences
        </button>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-[#1f2937]">Registration Chair Portal</h2>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Total Papers</h3>
            <p className="text-3xl font-bold text-[#059669]">{papers.length}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Verified (Paid)</h3>
            <p className="text-3xl font-bold text-[#059669]">{papers.filter(p => p.CompletedRegistration).length}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Pending Verification</h3>
            <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => !p.CompletedRegistration).length}</p>
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