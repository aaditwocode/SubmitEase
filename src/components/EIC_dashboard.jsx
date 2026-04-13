"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Mock Data (Replace with API calls) ---
const MOCK_EDITORS = [
  { id: 1, name: "Dr. Alice Smith", expertise: ["AI", "Edge Computing"], activeWorkload: 2 },
  { id: 2, name: "Dr. Bob Jones", expertise: ["IoT", "Networks"], activeWorkload: 5 },
  { id: 3, name: "Dr. Clara Lin", expertise: ["Security", "Cryptography"], activeWorkload: 1 },
];

const MOCK_PAPERS = [
  {
    id: "J-2025-001",
    Title: "Optimizing Neural Networks for Edge Devices",
    Author: { firstname: "Amit", lastname: "Sharma" },
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    Status: "Awaiting Triage",
    editor: null,
    editorRecommendation: null,
    isOverdue: false,
  },
  {
    id: "J-2025-002",
    Title: "Sustainable Energy Harvesting in WSNs",
    Author: { firstname: "Sarah", lastname: "Jenkins" },
    submittedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    Status: "Under Review",
    editor: MOCK_EDITORS[1],
    editorRecommendation: null,
    isOverdue: true, // Flagged for being with editor too long
  },
  {
    id: "J-2025-003",
    Title: "Quantum Cryptography: A New Era",
    Author: { firstname: "Raj", lastname: "Patel" },
    submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    Status: "Awaiting Final Decision",
    editor: MOCK_EDITORS[2],
    editorRecommendation: "Major Revision",
    isOverdue: false,
  }
];

// --- Helper Functions ---
const getStatusBadge = (status, isOverdue) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  
  if (isOverdue) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full leading-tight bg-red-100 text-red-700 animate-pulse">⚠️ Overdue</span>;
  }

  switch (status) {
    case "Awaiting Triage": badgeClasses += "bg-blue-100 text-blue-700"; break;
    case "Under Review": badgeClasses += "bg-yellow-100 text-yellow-700"; break;
    case "Awaiting Final Decision": badgeClasses += "bg-purple-100 text-purple-700"; break;
    case "Accepted": badgeClasses += "bg-green-100 text-green-700"; break;
    case "Rejected": case "Desk Rejected": badgeClasses += "bg-gray-200 text-gray-700"; break;
    default: badgeClasses += "bg-gray-100 text-gray-700";
  }
  return <span className={badgeClasses}>{status}</span>;
};

export default function JournalEICDashboard() {
  const { user, setUser, setloginStatus } = useUserData();
  const navigate = useNavigate();

  const [papers, setPapers] = useState(MOCK_PAPERS);
  const [activeTab, setActiveTab] = useState("triage");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals State
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");

  // --- Derived Data ---
  const triagePapers = papers.filter(p => p.Status === "Awaiting Triage");
  const inReviewPapers = papers.filter(p => p.Status === "Under Review");
  const decisionPapers = papers.filter(p => p.Status === "Awaiting Final Decision");
  const completedPapers = papers.filter(p => ["Accepted", "Rejected", "Desk Rejected"].includes(p.Status));

  const filteredPapers = useMemo(() => {
    let list = [];
    if (activeTab === "triage") list = triagePapers;
    else if (activeTab === "in_review") list = inReviewPapers;
    else if (activeTab === "decisions") list = decisionPapers;
    else if (activeTab === "completed") list = completedPapers;
    else list = papers;

    return list.filter(p => 
      p.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, papers, searchTerm]);

  // --- Actions ---
  const handleAssignEditor = (editor) => {
    // API Call to assign editor goes here
    setPapers(papers.map(p => 
      p.id === selectedPaper.id ? { ...p, Status: "Under Review", editor: editor } : p
    ));
    setShowAssignModal(false);
    setSelectedPaper(null);
  };

  const handleDeskReject = (paperId) => {
    if(window.confirm("Are you sure you want to desk reject this paper without review?")) {
        setPapers(papers.map(p => p.id === paperId ? { ...p, Status: "Desk Rejected" } : p));
    }
  };

  const handleFinalDecision = (decision) => {
    // API Call for final decision goes here
    setPapers(papers.map(p => 
      p.id === selectedPaper.id ? { ...p, Status: decision } : p
    ));
    setShowDecisionModal(false);
    setSelectedPaper(null);
    setDecisionNotes("");
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* HEADER (Reused from your existing structure) */}
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase </span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white">Dashboard</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1f2937]">Editor-in-Chief Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Manage pipeline, assign editors, and make final publication decisions.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="text-sm font-medium text-blue-800">Awaiting Triage</h3>
            <p className="text-3xl font-bold text-blue-900">{triagePapers.length}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-5">
            <h3 className="text-sm font-medium text-yellow-800">Under Review</h3>
            <p className="text-3xl font-bold text-yellow-900">{inReviewPapers.length}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-5">
            <h3 className="text-sm font-medium text-purple-800">Decisions Needed</h3>
            <p className="text-3xl font-bold text-purple-900">{decisionPapers.length}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-5">
            <h3 className="text-sm font-medium text-red-800">Overdue Papers</h3>
            <p className="text-3xl font-bold text-red-900">{papers.filter(p => p.isOverdue).length}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-[#e5e7eb] flex gap-6 mb-6">
           {['triage', 'in_review', 'decisions', 'completed', 'all'].map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`pb-2 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937]"}`}
               >
                 {tab.replace('_', ' ')}
               </button>
           ))}
        </div>

        {/* LIST VIEW */}
        <div className="bg-white rounded-lg shadow border border-[#e5e7eb]">
          <div className="p-4 border-b border-[#e5e7eb]">
            <input type="text" placeholder="Search manuscripts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#059669]" />
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Title</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Editor</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPapers.map(paper => (
                <tr key={paper.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{paper.Title}</p>
                    <p className="text-xs text-gray-500">{paper.id} • Submitted: {new Date(paper.submittedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(paper.Status, paper.isOverdue)}
                    {paper.editorRecommendation && (
                        <p className="text-xs font-bold text-purple-700 mt-1">Rec: {paper.editorRecommendation}</p>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {paper.editor ? (
                        <div>
                            <p className="text-sm text-gray-900">{paper.editor.name}</p>
                            <button className="text-xs text-red-600 hover:underline mt-1">Revoke Assignment</button>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {paper.Status === "Awaiting Triage" && (
                        <>
                            <button onClick={() => { setSelectedPaper(paper); setShowAssignModal(true); }} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs hover:bg-blue-100">Assign Editor</button>
                            <button onClick={() => handleDeskReject(paper.id)} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100">Desk Reject</button>
                        </>
                    )}
                    {paper.Status === "Awaiting Final Decision" && (
                         <button onClick={() => { setSelectedPaper(paper); setShowDecisionModal(true); }} className="px-3 py-1 bg-[#059669] text-white rounded text-xs hover:bg-[#047857]">Make Decision</button>
                    )}
                    <button onClick={() => navigate(`/journal/paper/${paper.id}`)} className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">View PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL: ASSIGN EDITOR --- */}
      {showAssignModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
             <h3 className="text-lg font-semibold mb-4">Assign Associate Editor for {selectedPaper.id}</h3>
             <div className="space-y-3 max-h-96 overflow-y-auto">
                 {MOCK_EDITORS.map(editor => (
                     <div key={editor.id} className="flex items-center justify-between p-3 border rounded hover:border-[#059669]">
                         <div>
                             <p className="font-medium text-gray-900">{editor.name}</p>
                             <p className="text-xs text-gray-500">Expertise: {editor.expertise.join(", ")}</p>
                         </div>
                         <div className="flex items-center gap-4">
                             <div className="text-right">
                                 <p className="text-xs text-gray-500">Active Workload</p>
                                 <p className={`text-sm font-bold ${editor.activeWorkload > 3 ? 'text-red-600' : 'text-green-600'}`}>{editor.activeWorkload} papers</p>
                             </div>
                             <button onClick={() => handleAssignEditor(editor)} className="px-4 py-2 bg-[#059669] text-white text-sm rounded hover:bg-[#047857]">Assign</button>
                         </div>
                     </div>
                 ))}
             </div>
             <button onClick={() => setShowAssignModal(false)} className="mt-4 px-4 py-2 border rounded w-full hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* --- MODAL: FINAL DECISION --- */}
      {showDecisionModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
             <h3 className="text-lg font-semibold mb-2">Final Decision for {selectedPaper.id}</h3>
             <p className="text-sm text-gray-600 mb-4">Editor Recommendation: <span className="font-bold text-purple-700">{selectedPaper.editorRecommendation}</span></p>
             
             <textarea 
                className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-[#059669]" 
                rows="4" 
                placeholder="Confidential notes for the audit trail..."
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
             />

             <div className="grid grid-cols-2 gap-3 mb-4">
                 <button onClick={() => handleFinalDecision('Accepted')} className="p-3 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100 font-medium">Accept Submission</button>
                 <button onClick={() => handleFinalDecision('Rejected')} className="p-3 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 font-medium">Reject Submission</button>
                 <button onClick={() => handleFinalDecision('Minor Revision')} className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded hover:bg-yellow-100 font-medium">Minor Revision</button>
                 <button onClick={() => handleFinalDecision('Major Revision')} className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded hover:bg-orange-100 font-medium">Major Revision</button>
             </div>
             <button onClick={() => setShowDecisionModal(false)} className="px-4 py-2 border rounded w-full hover:bg-gray-50 text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}