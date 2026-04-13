

"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// --- Exact Header Component ---
const Header = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase Admin</span>
            </div>
            <nav className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/conferences')} 
                className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]"
              >
                Conference Admin
              </button>
              <button 
                onClick={() => navigate('/admin/journal')} 
                className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]"
              >
                Journal Admin
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>

            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
          </div>
        </div>
        </header>
  );
};


export default function AdminJournal() {
  const navigate = useNavigate();
  const { user, setUser, setloginStatus } = useUserData();
  
  const [activeTab, setActiveTab] = useState("stats");
  const [eic, setEic] = useState(null);
  const [acceptedPapers, setAcceptedPapers] = useState([]);
  const [journalStats, setJournalStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // Modal States
  const [showEiCModal, setShowEiCModal] = useState(false);
  const [isInvitingNew, setIsInvitingNew] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [inviteData, setInviteData] = useState({ firstname: "", lastname: "", email: "", organisation: "" });

  // Sort & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Title");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selection for Download
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = () => {
    fetch('http://localhost:3001/admin/journal/eic').then(res => res.json()).then(data => setEic(data.eic));
    fetch('http://localhost:3001/admin/journal/accepted-papers').then(res => res.json()).then(data => setAcceptedPapers(data.papers));
    fetch('http://localhost:3001/admin/journal/stats').then(res => res.json()).then(data => setJournalStats(data));
    fetch('http://localhost:3001/users/emails').then(res => res.json()).then(data => setAllUsers(data.users));
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const handleChangeEiC = async (e) => {
    e.preventDefault();
    
    if (!isInvitingNew && !selectedUserId) return alert("Please select an existing user.");
    if (isInvitingNew && (!inviteData.firstname || !inviteData.lastname || !inviteData.email)) {
      return alert("Please fill all required fields to invite a new user.");
    }

    const payload = isInvitingNew 
      ? { newUser: inviteData } 
      : { newEicId: selectedUserId };

    try {
      const response = await fetch('http://localhost:3001/admin/journal/change-eic', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      if (response.ok) { 
        alert("Editor-in-Chief successfully updated! Email notifications have been sent."); 
        setShowEiCModal(false); 
        setInviteData({ firstname: "", lastname: "", email: "", organisation: "" });
        fetchData(); 
      } else {
        const err = await response.json();
        alert(`Failed to update EiC: ${err.message}`);
      }
    } catch (error) { console.error(error); }
  };

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortOrder("asc"); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const processedPapers = useMemo(() => {
    let filtered = acceptedPapers.filter(p => 
      p.Title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => {
      let aVal = a[sortBy] || ""; let bVal = b[sortBy] || "";
      if (sortBy === "submittedAt") {
        aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime();
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [acceptedPapers, searchTerm, sortBy, sortOrder]);

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedPaperIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedPaperIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPaperIds.size === processedPapers.length && processedPapers.length > 0) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(processedPapers.map(p => p.id)));
    }
  };

  const fetchBlob = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.blob();
  };

  const handleBulkDownload = async () => {
    if (selectedPaperIds.size === 0) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("Accepted_Journal_Papers");
      const selectedPapersList = processedPapers.filter(p => selectedPaperIds.has(p.id));

      let count = 0;
      for (const paper of selectedPapersList) {
        if (paper.URL) {
          try {
            const blob = await fetchBlob(paper.URL);
            const safeTitle = paper.Title.replace(/[^a-z0-9 _-]/gi, '_').substring(0, 30);
            const fileName = `${paper.id}_${safeTitle}.pdf`;
            folder.file(fileName, blob);
            count++;
          } catch (err) {
            console.error(`Error downloading paper ${paper.id}:`, err);
          }
        }
      }

      if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `Journal_Proceedings_${new Date().getTime()}.zip`);
      } else {
        alert("No valid files found to download.");
      }
    } catch (error) {
      console.error("Bulk download failed:", error);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Derived Extended Stats
  const totalPapers = journalStats?.papers?.total || 0;
  const acceptedCount = journalStats?.papers?.accepted || 0;
  const underReviewCount = journalStats?.papers?.underReview || 0;
  const revisionsCount = journalStats?.papers?.revisions || 0;
  const rejectedCount = journalStats?.papers?.rejected || 0;
  
  const totalReviews = journalStats?.reviews?.total || 0;
  const acceptanceRate = totalPapers > 0 ? Math.round((acceptedCount / totalPapers) * 100) : 0;

  const TabButton = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === id ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} handleLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-[#1f2937]">Journal Management</h2>
                <p className="text-[#6b7280] mt-1">Oversee editorial assignments, evaluate statistics, and manage final publications.</p>
            </div>
            <button onClick={() => setShowEiCModal(true)} className="px-4 py-2 bg-[#059669] text-white font-medium rounded-lg hover:bg-[#047857] transition-colors shadow-sm">
                Change Editor-in-Chief
            </button>
        </div>

        {/* EXTENDED JOURNAL STATS GRID */}
        {journalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Official Submissions</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#1f2937]">{totalPapers}</p>
                  <span className="text-xs text-[#6b7280]">All time</span>
              </div>
            </div>
            
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Currently Under Review</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#f59e0b]">{underReviewCount}</p>
                  <span className="text-xs text-[#f59e0b] bg-yellow-100 px-2 py-0.5 rounded">Evaluating</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Revisions Required</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#3b82f6]">{revisionsCount}</p>
                  <span className="text-xs text-[#3b82f6] bg-blue-100 px-2 py-0.5 rounded">Author Action</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Rejected Submissions</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Declined</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Accepted Manuscripts</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#059669]">{acceptedCount}</p>
                  <span className="text-xs text-[#059669] bg-green-100 px-2 py-0.5 rounded">Ready for Pub.</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Acceptance Rate</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#1f2937]">{acceptanceRate}%</p>
                  <span className="text-xs text-[#6b7280]">Selectivity</span>
              </div>
            </div>
            
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Reviews Processed</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[#1f2937]">{totalReviews}</p>
                  <span className="text-xs text-[#6b7280]">Completed</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <h3 className="text-sm font-medium text-[#6b7280]">Current EiC</h3>
              <div className="flex items-end justify-between mt-1">
                  <p className="text-lg font-bold text-[#1f2937] truncate w-full">{eic ? `${eic.firstname} ${eic.lastname}` : 'Unassigned'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-[#e5e7eb] flex gap-6 mb-6">
           <TabButton id="stats" label="Editor-in-Chief Profile" />
           <TabButton id="accepted" label="Accepted Publications" />
        </div>

        {/* EIC PROFILE TAB */}
        {activeTab === "stats" && (
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-8 shadow-sm">
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#1f2937]">Current Journal Leader</h3>
                    <p className="text-sm text-[#6b7280] mt-1">This user has ultimate approval authority over journal submissions.</p>
                </div>
             </div>
             
             {eic ? (
               <div className="flex items-center gap-6 p-6 border border-[#e5e7eb] bg-white rounded-xl shadow-sm">
                 <div className="h-20 w-20 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] text-3xl font-bold">
                    {eic.firstname.charAt(0)}{eic.lastname.charAt(0)}
                 </div>
                 <div>
                    <p className="text-2xl font-bold text-[#1f2937]">{eic.firstname} {eic.lastname}</p>
                    <p className="text-[#6b7280] flex items-center gap-2 mt-1">📧 {eic.email}</p>
                    <p className="text-[#6b7280] flex items-center gap-2 mt-1">🏢 {eic.organisation || 'Independent'}</p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-12 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-white">
                  <p className="text-[#6b7280] text-lg font-medium">No Editor-in-Chief currently assigned.</p>
                  <button onClick={() => setShowEiCModal(true)} className="mt-4 px-4 py-2 text-sm font-medium text-[#059669] bg-[#059669]/10 rounded-lg hover:bg-[#059669]/20 transition-colors">Assign One Now</button>
               </div>
             )}
          </div>
        )}

        {/* ACCEPTED PAPERS TAB (WITH DOWNLOAD) */}
        {activeTab === "accepted" && (
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg flex flex-col shadow-sm">
            <div className="p-4 border-b border-[#e5e7eb] flex flex-wrap gap-4 justify-between items-center bg-white rounded-t-lg">
              <input 
                type="text" 
                placeholder="Search by title, ID, or author..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white text-sm" 
              />
              
              <div className="flex gap-3 items-center">
                 <span className="text-sm font-medium text-[#1f2937]">
                    {selectedPaperIds.size} Selected
                 </span>
                 <button
                    onClick={handleBulkDownload}
                    disabled={selectedPaperIds.size === 0 || isDownloading}
                    className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2"
                 >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Zipping...
                      </>
                    ) : (
                      `Download ZIP`
                    )}
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-gray-50">
                    <th className="py-3 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedPaperIds.size === processedPapers.length && processedPapers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("id")}>
                      Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("Title")}>
                      Manuscript Title {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("submittedAt")}>
                      Accepted On {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedPapers.length > 0 ? processedPapers.map(paper => (
                    <tr key={paper.id} className={`border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors ${selectedPaperIds.has(paper.id) ? 'bg-green-50/50' : 'bg-white'}`}>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedPaperIds.has(paper.id)}
                          onChange={() => handleSelectOne(paper.id)}
                          className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                      <td className="py-3 px-4">
                          <p className="text-sm font-medium text-[#1f2937] line-clamp-2">{paper.Title}</p>
                          <p className="text-xs text-[#6b7280] mt-1">Authors: {paper.Authors.map(a => `${a.firstname} ${a.lastname}`).join(', ')}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#6b7280] whitespace-nowrap">{formatDate(paper.submittedAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <a href={paper.URL} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">Open PDF</a>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center text-[#6b7280] py-8 bg-white">No accepted manuscripts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Change EiC (With Tabs for Existing vs New) */}
      {showEiCModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb] bg-white rounded-t-lg">
              <h3 className="text-lg font-semibold text-[#1f2937]">Assign New Editor-in-Chief</h3>
              <button onClick={() => setShowEiCModal(false)} className="text-[#6b7280] hover:text-[#1f2937] text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[#6b7280] mb-4">Select an existing user or invite a new user to take over the editorial duties. The current EiC will have their role automatically revoked.</p>
              
              {/* Tabs for toggling form mode */}
              <div className="flex gap-4 mb-6 border-b border-[#e5e7eb]">
                 <button 
                   type="button" 
                   onClick={() => setIsInvitingNew(false)} 
                   className={`pb-2 text-sm font-medium ${!isInvitingNew ? 'text-[#059669] border-b-2 border-[#059669]' : 'text-[#6b7280] hover:text-[#1f2937]'}`}
                 >
                   Select Registered User
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setIsInvitingNew(true)} 
                   className={`pb-2 text-sm font-medium ${isInvitingNew ? 'text-[#059669] border-b-2 border-[#059669]' : 'text-[#6b7280] hover:text-[#1f2937]'}`}
                 >
                   + Invite New User
                 </button>
              </div>

              <form onSubmit={handleChangeEiC}>
                
                {/* MODE: Select Existing User */}
                {!isInvitingNew && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Registered Platform Users</label>
                    <select 
                      value={selectedUserId} 
                      onChange={(e) => setSelectedUserId(e.target.value)} 
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white text-sm"
                    >
                      <option value="" disabled>-- Select a user --</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.firstname} {u.lastname} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* MODE: Invite New User */}
                {isInvitingNew && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1f2937] mb-1">First Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={inviteData.firstname} 
                          onChange={(e) => setInviteData({...inviteData, firstname: e.target.value})}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1f2937] mb-1">Last Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={inviteData.lastname} 
                          onChange={(e) => setInviteData({...inviteData, lastname: e.target.value})}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] text-sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1f2937] mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={inviteData.email} 
                        onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1f2937] mb-1">Organisation / University</label>
                      <input 
                        type="text" 
                        value={inviteData.organisation} 
                        onChange={(e) => setInviteData({...inviteData, organisation: e.target.value})}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] text-sm" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 mt-6 border-t border-[#e5e7eb]">
                   <button 
                     type="submit" 
                     disabled={(!isInvitingNew && !selectedUserId)} 
                     className="flex-1 px-4 py-2 font-medium bg-[#059669] text-white rounded-md hover:bg-[#047857] disabled:opacity-50 transition-colors"
                   >
                     Confirm Assignment
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setShowEiCModal(false)} 
                     className="flex-1 px-4 py-2 font-medium border border-[#e5e7eb] text-[#374151] bg-white rounded-md hover:bg-[#f3f4f6] transition-colors"
                   >
                     Cancel
                   </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}