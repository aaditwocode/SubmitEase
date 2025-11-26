"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { useUserData } from "./UserContext";

// --- Helper Functions ---
const getStatusBadge = (paper) => {
  if (paper.Completed) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Registration Verified</span>;
  }
  if (paper.RegistrationURL) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Slip Uploaded</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Payment Pending</span>;
};

// --- Paper List Component ---
const PaperList = ({ papers, onApprove, onRemind, onSendBack, onViewSlip, onBulkApprove }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredPapers = papers.filter((paper) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      paper.id?.toString().toLowerCase().includes(searchLower) ||
      paper.Title?.toLowerCase().includes(searchLower) ||
      paper.authors?.toLowerCase().includes(searchLower) ||
      paper.correspondent?.toLowerCase().includes(searchLower)
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
          placeholder="Search (ID, Title, Author, Email...)"
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
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Registration Slip</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
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
                <td className="py-3 px-4 text-sm text-[#1f2937] truncate">{paper.Title}</td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate">{paper.authors}</td>
                <td className="py-3 px-4 text-sm text-[#6b7280] truncate">{paper.correspondent}</td>
                <td className="py-3 px-4">
                  {paper.RegistrationURL ? (
                    <button
                      onClick={() => onViewSlip(paper.RegistrationURL)}
                      className="text-sm font-medium text-[#059669] hover:underline flex items-center gap-1"
                    >
                      📄 View Slip
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">Not Uploaded</span>
                  )}
                </td>
                <td className="py-3 px-4">{getStatusBadge(paper)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {paper.RegistrationURL && !paper.Completed && (
                      <>
                        <button
                          onClick={() => onApprove(paper)}
                          disabled={paper.isProcessing}
                          className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md hover:bg-[#047a56] transition-colors disabled:opacity-50"
                        >
                          {paper.isProcessing ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => onSendBack(paper)}
                          className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {!paper.RegistrationURL && (
                      <button
                        onClick={() => onRemind(paper)}
                        disabled={paper.isProcessing}
                        className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md hover:bg-[#047a56] transition-colors disabled:bg-gray-300"
                      >
                        {paper.isProcessing ? "Sending..." : "Remind"}
                      </button>
                    )}

                    {paper.Completed && (
                      <button
                        onClick={() => onSendBack(paper)} // Allow un-approving if needed
                        className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
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

// --- Modal Component for "Send Back/Reject" ---
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
          This will mark the registration as <b>Incomplete</b>. Please explain why the payment slip is invalid (e.g., wrong amount, unreadable).
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection (Email to Author)</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#059669] focus:outline-none"
            rows="5"
            placeholder="e.g., The transaction ID on the slip is not visible. Please re-upload..."
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
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Registration Chair Component ---
export default function RegistrationChairPortal() {
  const navigate = useNavigate();
  const { hashedConId } = useParams(); // Conference ID encoded
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {user,setUser, setloginStatus}=useUserData();
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

        // API call to fetch papers for this conference
        const response = await fetch(`http://localhost:3001/conference/finalpapers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conferenceId: confId }),
        });
        if (!response.ok) throw new Error("Failed to fetch papers");
        const data = await response.json();

        // Map Backend Data to UI Model
        const formattedPapers = (data.paper || []).map((p) => ({
          id: p.id,
          Title: p.Title,
          authors: p.Authors ? p.Authors.map(a => `${a.firstname} ${a.lastname}`).join(", ") : "Unknown",
          correspondent: p.User?.email || "N/A",
          RegistrationURL: p.RegistrationURL, // The payment slip
          Completed: p.Completed, // Verified status
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

  const handleViewSlip = (url) => {
    if (url) {
      window.open(`http://localhost:3001/${url}`, "_blank");
    }
  };

  const handleApprove = async (paper) => {
    try {
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: true } : p));

      const response = await fetch(`http://localhost:3001/paper/${paper.id}/approve-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to approve");

      // Update State: Mark as Completed
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, Completed: true, isProcessing: false } : p));
      alert("Registration Verified Successfully.");
    } catch (err) {
      alert(err.message);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
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
      alert(`Payment reminder sent to ${paper.correspondent}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
    }
  };

  // Open Reject Modal
  const initiateSendBack = (paper) => {
    setSelectedPaper(paper);
    setIsModalOpen(true);
  };

  // Confirm Reject (Send Back)
  const handleSendBackConfirm = async (paper, message) => {
    try {
      setIsModalOpen(false);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: true } : p));

      const response = await fetch(`http://localhost:3001/paper/${paper.id}/send-back-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: paper.correspondent,
          message: message,
          action: "mark_incomplete" // Backend should set Completed = false
        }),
      });

      if (!response.ok) throw new Error("Failed to reject registration");

      // Update State: Mark as NOT Completed
      setPapers(prev => prev.map(p =>
        p.id === paper.id ? { ...p, Completed: false, isProcessing: false } : p
      ));

      alert("Registration rejected. Author has been notified.");

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, isProcessing: false } : p));
    }
  };

  // --- Bulk Approve ---
  const handleBulkApprove = async (paperIds) => {
    if (!confirm(`Are you sure you want to approve ${paperIds.length} registrations?`)) return;

    try {
      const response = await fetch('http://localhost:3001/paper/bulk-approve-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperIds }),
      });

      if (!response.ok) throw new Error('Failed to bulk approve registrations');

      const result = await response.json();
      alert(`Successfully approved ${result.count} registrations.`);

      // Refresh papers to show updated status
      setPapers(prevPapers =>
        prevPapers.map(paper =>
          paperIds.includes(paper.id) ? { ...paper, Completed: true } : paper
        )
      );
    } catch (error) {
      console.error('Bulk approve error:', error);
      alert('Failed to approve registrations.');
    }
  };

  // --- Render ---
  if (loading) return <div className="flex justify-center items-center h-screen text-[#059669]">Loading Registration Data...</div>;
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
            <p className="text-3xl font-bold text-[#059669]">{papers.filter(p => p.Completed).length}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
            <h3 className="text-sm text-[#6b7280]">Pending Verification</h3>
            <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => p.RegistrationURL && !p.Completed).length}</p>
          </div>
        </div>

        {/* Main Table */}
        <PaperList
          papers={papers}
          onApprove={handleApprove}
          onRemind={handleRemindAuthor}
          onSendBack={initiateSendBack}
          onViewSlip={handleViewSlip}
          onBulkApprove={handleBulkApprove}
        />
      </main>

      {/* Reject Modal */}
      <SendBackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSendBackConfirm}
        paper={selectedPaper}
      />
    </div>
  );
}
