"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Base64 } from "js-base64";

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
const PaperList = ({ papers, onRemind, onSendBack, onViewFile }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPapers = papers.filter((paper) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      paper.id?.toString().toLowerCase().includes(searchLower) ||
      paper.Title?.toLowerCase().includes(searchLower) ||
      paper.authors?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search papers (ID, Title, Authors...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title & Authors</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Documents</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-[#1f2937]">{paper.Title}</p>
                    <p className="text-xs text-[#6b7280]">{paper.authors}</p>
                    <p className="text-xs text-[#6b7280] italic">{paper.correspondent}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {paper.CopyrightURL ? (
                        <button onClick={() => onViewFile(paper.CopyrightURL)} className="text-xs text-[#059669] hover:underline text-left">View Copyright</button>
                    ) : <span className="text-xs text-red-500">Missing Copyright</span>}
                    
                    {paper.FinalPaperURL ? (
                        <button onClick={() => onViewFile(paper.FinalPaperURL)} className="text-xs text-[#059669] hover:underline text-left">View Final Paper</button>
                    ) : <span className="text-xs text-red-500">Missing Final Paper</span>}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(paper)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-2">
                    {/* Button 1: Remind Author */}
                    <button
                      onClick={() => onRemind(paper)}
                      disabled={paper.isProcessing}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {paper.isProcessing ? "Sending..." : "Remind Author"}
                    </button>

                    {/* Button 2: Send Back to Author */}
                    <button
                      onClick={() => onSendBack(paper)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Send Back (Reject)
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 py-4">No papers found.</td>
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
  const { id } = useParams(); 
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // --- Fetch Logic ---
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        const confId = id ? Base64.decode(id) : null;
        if(!confId) throw new Error("Invalid Conference ID");

        // Replace with your actual backend endpoint
        const response = await fetch(`http://localhost:3001/conference/${confId}/papers/publication-status`);
        if (!response.ok) throw new Error("Failed to fetch papers");
        
        const data = await response.json();

        const formattedPapers = (data.papers || []).map((p) => ({
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
  }, [id]);

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

  // --- Render ---
  if (loading) return <div className="flex justify-center items-center h-screen text-[#059669]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate("/conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm text-white hover:bg-[#059669]/90">Conference Portal</button>
            <button onClick={() => navigate("/home")} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-[#1f2937]">Publication Chair Portal</h2>
        </div>

        {/* Statistics - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 border rounded-lg p-5">
                <h3 className="text-sm text-gray-500">Total Papers</h3>
                <p className="text-3xl font-bold text-[#059669]">{papers.length}</p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
                <h3 className="text-sm text-gray-500">Completed</h3>
                <p className="text-3xl font-bold text-[#059669]">{papers.filter(p => p.Completed).length}</p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
                <h3 className="text-sm text-gray-500">Pending Actions</h3>
                <p className="text-3xl font-bold text-yellow-600">{papers.filter(p => !p.Completed).length}</p>
            </div>
        </div>

        {/* Main Table */}
        <PaperList 
          papers={papers} 
          onRemind={handleRemindAuthor}
          onSendBack={initiateSendBack}
          onViewFile={handleViewFile}
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