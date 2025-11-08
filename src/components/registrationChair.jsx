"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Helper Functions ---
const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  switch (status) {
    case 'Approved':
      badgeClasses += "bg-green-100 text-green-700";
      break;
    case 'Pending':
      badgeClasses += "bg-yellow-100 text-yellow-700";
      break;
    case 'Rejected':
      badgeClasses += "bg-red-100 text-red-700";
      break;
    case 'Missing':
    default:
      badgeClasses += "bg-gray-100 text-gray-700";
      break;
  }
  return badgeClasses;
};

const getStatusDisplayText = (status) => {
  switch (status) {
    case 'Pending':
      return "Pending Review";
    case 'Approved':
      return "Approved";
    case 'Rejected':
      return "Rejected";
    case 'Missing':
    default:
      return "Missing";
  }
};

// --- Rejection Modal Component ---
const RejectionModal = ({ isOpen, onClose, onConfirm, paperId }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const handleSubmit = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onConfirm(paperId, rejectionReason, suggestions);
    setRejectionReason("");
    setSuggestions("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Reject Registration Slip</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-1">
              Reason for Rejection *
            </label>
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" 
              placeholder="Explain why the registration slip is being rejected..."
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-1">
              Suggestions for Improvement
            </label>
            <textarea 
              value={suggestions} 
              onChange={(e) => setSuggestions(e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" 
              placeholder="Provide guidance on how to fix the issues..."
              rows="3"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Confirm Rejection
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Resubmission Modal Component ---
const ResubmissionModal = ({ isOpen, onClose, paper, onResubmit }) => {
  const [resubmissionFile, setResubmissionFile] = useState(null);

  const handleSubmit = () => {
    if (!resubmissionFile) {
      alert("Please select a file to upload");
      return;
    }
    onResubmit(paper.id, resubmissionFile);
    setResubmissionFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Resubmit Registration Slip</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Paper: <strong>{paper.id}</strong>
            </p>
            {paper.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{paper.rejectionReason}</p>
                {paper.suggestions && (
                  <>
                    <p className="text-sm font-medium text-red-800 mb-1 mt-2">Suggestions:</p>
                    <p className="text-sm text-red-700">{paper.suggestions}</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
            >
              Upload & Resubmit
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reminder Modal Component ---
const ReminderModal = ({ isOpen, onClose, paper, onSendReminder }) => {
  const [reminderMessage, setReminderMessage] = useState("");

  const handleSubmit = () => {
    if (!reminderMessage.trim()) {
      alert("Please provide a reminder message");
      return;
    }
    onSendReminder(paper.id, paper.correspondent, reminderMessage);
    setReminderMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Send Reminder Email</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Paper: <strong>{paper.id}</strong>
            </p>
            <p className="text-sm text-gray-600">
              To: <strong>{paper.correspondent}</strong>
            </p>
            {paper.registrationStatus === 'Rejected' && paper.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{paper.rejectionReason}</p>
                {paper.suggestions && (
                  <>
                    <p className="text-sm font-medium text-red-800 mb-1 mt-2">Suggestions:</p>
                    <p className="text-sm text-red-700">{paper.suggestions}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-1">
              Reminder Message *
            </label>
            <textarea 
              value={reminderMessage} 
              onChange={(e) => setReminderMessage(e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" 
              placeholder={`Write your reminder message for ${paper.correspondent}...`}
              rows="4"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be sent to the corresponding author via email.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Send Reminder
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Paper List Component ---
const PaperList = ({ papers, onViewSlip, onApprove, onReject, onResubmit, onSendReminder }) => {
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
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Registration Slip</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
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
                  {/* Show "Not Uploaded" for Rejected and Missing status */}
                  {(paper.registrationStatus === 'Missing' || paper.registrationStatus === 'Rejected') ? (
                    <span className="text-sm text-gray-500">Not Uploaded</span>
                  ) : (
                    <button 
                      onClick={() => onViewSlip(paper)}
                      className="px-3 py-1 text-xs bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
                    >
                      View Slip
                    </button>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={getStatusBadge(paper.registrationStatus)}>
                    {getStatusDisplayText(paper.registrationStatus)}
                  </span>
                  {paper.registrationStatus === 'Rejected' && paper.rejectionReason && (
                    <div className="mt-1">
                      <button 
                        onClick={() => alert(`Rejection Reason: ${paper.rejectionReason}\n\nSuggestions: ${paper.suggestions || 'No specific suggestions provided'}`)}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        View Feedback
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {paper.registrationStatus === 'Pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onApprove(paper.id)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onReject(paper)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {paper.registrationStatus === 'Rejected' && (
                    <div className="flex flex-col gap-2">
                      {/* <button 
                        onClick={() => onResubmit(paper)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Upload New Slip
                      </button> */}
                      <button 
                        onClick={() => onSendReminder(paper)}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Send Reminder
                      </button>
                    </div>
                  )}
                  {paper.registrationStatus === 'Missing' && (
                    <div className="flex flex-col gap-2">
                      {/* <button 
                        onClick={() => onResubmit(paper)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Upload New Slip
                      </button> */}
                      <button 
                        onClick={() => onSendReminder(paper)}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Send Reminder
                      </button>
                    </div>
                  )}
                  {paper.registrationStatus === 'Approved' && (
                    <span className="text-sm text-gray-400">No Action Needed</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 py-4">No papers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Registration Chair Component ---
export default function RegistrationChairPortal() {
  const navigate = useNavigate();

  // Mock data for testing without backend
  const [papers, setPapers] = useState([
    { 
      id: 'CONF-201',
      authors: 'Dr. Kenji Tanaka, Dr. Priya Sharma',
      correspondent: 'priya.sharma@research.org',
      registrationStatus: 'Pending',
      slipFileUrl: '/registration-slips/conf-201-slip.pdf'
    },
    { 
      id: 'CONF-202',
      authors: 'Prof. Maria Rodriguez, Dr. Ahmed Hassan',
      correspondent: 'maria.rodriguez@university.edu',
      registrationStatus: 'Approved',
      slipFileUrl: '/registration-slips/conf-202-slip.pdf'
    },
    { 
      id: 'CONF-203',
      authors: 'Dr. Chen Wei, Dr. Anna Kowalski',
      correspondent: 'chen.wei@institute.org',
      registrationStatus: 'Rejected',
      slipFileUrl: null, // File URL becomes null when rejected
      rejectionReason: 'Payment amount does not match conference fee',
      suggestions: 'Please verify the payment amount and ensure it matches the conference registration fee of $500.'
    },
    { 
      id: 'CONF-204',
      authors: 'Dr. James Wilson, Dr. Lisa Zhang',
      correspondent: 'james.wilson@tech.edu',
      registrationStatus: 'Missing',
      slipFileUrl: null
    },
    { 
      id: 'CONF-205',
      authors: 'Dr. Sarah Johnson, Dr. Miguel Santos',
      correspondent: 'sarah.johnson@research.edu',
      registrationStatus: 'Pending',
      slipFileUrl: '/registration-slips/conf-205-slip.pdf'
    }
  ]);

  // Modal states
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, paper: null });
  const [resubmissionModal, setResubmissionModal] = useState({ isOpen: false, paper: null });
  const [reminderModal, setReminderModal] = useState({ isOpen: false, paper: null });

  const handleViewSlip = (paper) => {
    if (paper.registrationStatus !== 'Missing' && paper.registrationStatus !== 'Rejected' && paper.slipFileUrl) {
      console.log(`Viewing registration slip for paper ${paper.id}: ${paper.slipFileUrl}`);
      alert(`Would open registration slip: ${paper.slipFileUrl}\n\nPaper: ${paper.id}\nCorrespondent: ${paper.correspondent}\nStatus: ${paper.registrationStatus}`);
    }
  };

  const handleApprove = (paperId) => {
    setPapers(prev => prev.map(paper => 
      paper.id === paperId ? { ...paper, registrationStatus: 'Approved' } : paper
    ));
    console.log(`Paper ${paperId} registration approved`);
    alert(`Registration slip for paper ${paperId} has been approved!`);
  };

  const handleRejectClick = (paper) => {
    setRejectionModal({ isOpen: true, paper });
  };

  const handleConfirmRejection = (paperId, rejectionReason, suggestions) => {
    setPapers(prev => prev.map(paper => 
      paper.id === paperId ? { 
        ...paper, 
        registrationStatus: 'Rejected',
        slipFileUrl: null, // Remove file URL when rejected
        rejectionReason,
        suggestions 
      } : paper
    ));
    console.log(`Paper ${paperId} registration rejected with reason: ${rejectionReason}`);
    alert(`Registration slip for paper ${paperId} has been rejected! The file has been removed and authors must upload a new one.`);
  };

  const handleResubmitClick = (paper) => {
    setResubmissionModal({ isOpen: true, paper });
  };

  const handleConfirmResubmission = (paperId, file) => {
    setPapers(prev => prev.map(paper => 
      paper.id === paperId ? { 
        ...paper, 
        registrationStatus: 'Pending', // Back to pending for review
        slipFileUrl: `/registration-slips/conf-${paperId}-resubmission.pdf`, // New file URL
        rejectionReason: null, // Clear rejection feedback
        suggestions: null // Clear suggestions
      } : paper
    ));
    console.log(`Paper ${paperId} resubmitted with file:`, file.name);
    alert(`New registration slip uploaded for paper ${paperId}! Status changed to Pending Review.`);
  };

  const handleSendReminderClick = (paper) => {
    setReminderModal({ isOpen: true, paper });
  };

  const handleConfirmReminder = (paperId, correspondent, reminderMessage) => {
    console.log(`Sending reminder email for paper ${paperId} to ${correspondent}`);
    console.log(`Reminder message: ${reminderMessage}`);
    alert(`Reminder email sent to ${correspondent} for paper ${paperId}!\n\nMessage: ${reminderMessage}`);
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
  const pendingPapers = papers.filter(p => p.registrationStatus === 'Pending').length;
  const approvedPapers = papers.filter(p => p.registrationStatus === 'Approved').length;
  const rejectedPapers = papers.filter(p => p.registrationStatus === 'Rejected').length;
  const missingPapers = papers.filter(p => p.registrationStatus === 'Missing').length;

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
          <h2 className="text-3xl font-bold text-[#1f2937]">Registration Chair Portal</h2>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Papers</h3>
              <p className="text-3xl font-bold text-[#059669]">{totalPapers}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Pending Review</h3>
              <p className="text-3xl font-bold text-[#f59e0b]">{pendingPapers}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Approved</h3>
              <p className="text-3xl font-bold text-[#059669]">{approvedPapers}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Rejected/Missing</h3>
              <p className="text-3xl font-bold text-red-600">{rejectedPapers + missingPapers}</p>
            </div>
          </div>

          {/* Papers Table Section */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Registration Slip Management</h3>
            <PaperList 
              papers={papers}
              onViewSlip={handleViewSlip}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              onResubmit={handleResubmitClick}
              onSendReminder={handleSendReminderClick}
            />
          </div>

          {/* Workflow Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Registration Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">1</div>
                <p className="text-blue-800 font-medium">Missing/Rejected</p>
                <p className="text-blue-600 text-xs">No slip uploaded</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">→</div>
                <p className="text-blue-800 font-medium">Upload</p>
                <p className="text-blue-600 text-xs">Author uploads slip</p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
                <p className="text-blue-800 font-medium">Pending Review</p>
                <p className="text-blue-600 text-xs">Awaiting approval</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">→</div>
                <p className="text-blue-800 font-medium">Review</p>
                <p className="text-blue-600 text-xs">Chair approves/rejects</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
                <p className="text-blue-800 font-medium">Approved</p>
                <p className="text-blue-600 text-xs">Registration complete</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-800">
              <p><strong>Note:</strong> When a slip is rejected, the file is removed and authors must upload a completely new registration slip.</p>
            </div>
          </div>

          {/* Status Legend */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Status Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">Missing</span>
                <span className="text-gray-600">Initial state - no slip</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Pending Review</span>
                <span className="text-gray-600">Slip uploaded, awaiting review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Approved</span>
                <span className="text-gray-600">Registration confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">Rejected</span>
                <span className="text-gray-600">Slip removed, needs new upload</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, paper: null })}
        onConfirm={handleConfirmRejection}
        paperId={rejectionModal.paper?.id}
      />

      <ResubmissionModal
        isOpen={resubmissionModal.isOpen}
        onClose={() => setResubmissionModal({ isOpen: false, paper: null })}
        paper={resubmissionModal.paper}
        onResubmit={handleConfirmResubmission}
      />

      <ReminderModal
        isOpen={reminderModal.isOpen}
        onClose={() => setReminderModal({ isOpen: false, paper: null })}
        paper={reminderModal.paper}
        onSendReminder={handleConfirmReminder}
      />
    </div>
  );
}