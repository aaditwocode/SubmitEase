"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Helper Functions ---
const getCopyrightStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  if (status) {
    badgeClasses += "bg-green-100 text-green-700";
  } else {
    badgeClasses += "bg-red-100 text-red-700";
  }
  return badgeClasses;
};

// --- Paper List Component ---
const PaperList = ({ papers, onViewFile, onResendReminder }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPapers = papers.filter(paper => 
    paper.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.correspondent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search papers (ID, Authors, Email...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Authors List</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Corresponding Author</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Copyright Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.authors}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.correspondent}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={getCopyrightStatusBadge(paper.copyrightUploaded)}>
                      {paper.copyrightUploaded ? "Uploaded" : "Missing"}
                    </span>
                    {paper.copyrightUploaded && (
                      <button 
                        onClick={() => onViewFile(paper)}
                        className="px-2 py-1 text-xs bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
                      >
                        View File
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {!paper.copyrightUploaded && (
                    <button 
                      onClick={() => onResendReminder(paper)}
                      disabled={paper.isSending}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        paper.isSending 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-[#059669] text-white hover:bg-[#059669]/90'
                      }`}
                    >
                      {paper.isSending ? 'Sending...' : 'Resend Reminder'}
                    </button>
                  )}
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

// --- Main Publication Chair Component ---
export default function PublicationChairPortal() {
  const navigate = useNavigate();

  // Mock data for testing without backend
  const [papers, setPapers] = useState([
    { 
      id: 'AI-101',
      authors: 'Dr. Eva Smith, Dr. John Doe',
      correspondent: 'eva.smith@university.edu',
      copyrightUploaded: true,
      copyrightFileUrl: '/copyrights/ai-101-agreement.pdf',
      isSending: false
    },
    { 
      id: 'CV-202',
      authors: 'Prof. Michael Chen, Dr. Sarah Wilson',
      correspondent: 'michael.chen@tech.edu',
      copyrightUploaded: false,
      copyrightFileUrl: null,
      isSending: false
    },
    { 
      id: 'NLP-303',
      authors: 'Dr. Robert Johnson, Dr. Emily Davis, Dr. James Brown',
      correspondent: 'robert.johnson@research.org',
      copyrightUploaded: true,
      copyrightFileUrl: '/copyrights/nlp-303-agreement.pdf',
      isSending: false
    },
    { 
      id: 'ML-404',
      authors: 'Dr. Maria Garcia, Dr. David Lee',
      correspondent: 'maria.garcia@institute.edu',
      copyrightUploaded: false,
      copyrightFileUrl: null,
      isSending: false
    }
  ]);

  const handleViewFile = (paper) => {
    if (paper.copyrightUploaded && paper.copyrightFileUrl) {
      console.log(`Viewing file for paper ${paper.id}: ${paper.copyrightFileUrl}`);
      // In a real app, this would open the file or a modal
      alert(`Would open copyright file: ${paper.copyrightFileUrl}\n\nPaper: ${paper.id}\nCorrespondent: ${paper.correspondent}`);
    }
  };

  const handleResendReminder = async (paper) => {
    // Update paper state to show "Sending..."
    setPapers(prev => prev.map(p => 
      p.id === paper.id ? { ...p, isSending: true } : p
    ));

    // Simulate API call delay
    setTimeout(() => {
      console.log(`Reminder sent to ${paper.correspondent} for paper ${paper.id}`);
      
      // Reset sending state
      setPapers(prev => prev.map(p => 
        p.id === paper.id ? { ...p, isSending: false } : p
      ));

      // Show success message
      alert(`Reminder sent successfully to:\n${paper.correspondent}\nfor paper: ${paper.id}`);
    }, 2000);
  };

  const handlePortalClick = (portal) => {
    alert(`Would navigate to ${portal} portal (Demo mode)`);
  };

  const handleLogout = () => {
    alert("Would logout (Demo mode)");
    navigate("/home");
  };

  // Calculate statistics
  const totalPapers = papers.length;
  const copyrightUploaded = papers.filter(p => p.copyrightUploaded).length;
  const copyrightMissing = papers.filter(p => !p.copyrightUploaded).length;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <span className="text-[#6b7280]">Create a Conference</span>
              <span className="text-[#6b7280]">Manage Conferences</span>
              <span className="text-[#6b7280]">Manage Reviews</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Conference Portal</button>
            <button onClick={() => handlePortalClick("dashboard")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#1f2937]">Publication Chair Portal</h2>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Papers</h3>
              <p className="text-3xl font-bold text-[#059669]">{totalPapers}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Copyright Uploaded</h3>
              <p className="text-3xl font-bold text-[#059669]">{copyrightUploaded}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Copyright Missing</h3>
              <p className="text-3xl font-bold text-[#f59e0b]">{copyrightMissing}</p>
            </div>
          </div>

          {/* Papers Table Section */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Copyright Management</h3>
            <PaperList 
              papers={papers}
              onViewFile={handleViewFile}
              onResendReminder={handleResendReminder}
            />
          </div>

          {/* Instructions Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Publication Chair Responsibilities</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Monitor copyright form submissions for all accepted papers</li>
              <li>• Send reminders to corresponding authors who haven't uploaded copyright forms</li>
              <li>• Verify uploaded copyright forms are complete and valid</li>
              <li>• Track submission status for publication readiness</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}