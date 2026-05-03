"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// --- Header Component ---
const Header = ({ user, journalid, currentJournalName, onLogout }) => {
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
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
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
                                {availablePortals.length > 0 && (
                                    <>
                                        <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roles</h6>
                                        {availablePortals.map((option, index) => (
                                            <button
                                                key={index}
                                                onMouseDown={() => { navigate(option.path); setIsDropdownOpen(false); }}
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
                    <button onClick={onLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default function JournalHost() {
  const navigate = useNavigate();
  const { journalid } = useParams();
  const { user, setUser, setloginStatus } = useUserData();
  
  const [currentJournalName, setCurrentJournalName] = useState("");
  const [journalData, setJournalData] = useState(null);

  const [activeTab, setActiveTab] = useState("stats");
  const [eic, setEic] = useState(null);
  const [acceptedPapers, setAcceptedPapers] = useState([]);
  const [journalStats, setJournalStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [journalUsers, setJournalUsers] = useState([]); 

  // Modal States
  const [showEiCModal, setShowEiCModal] = useState(false);
  const [userModalTab, setUserModalTab] = useState('upgrade_journal'); 
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [inviteData, setInviteData] = useState({ firstname: "", lastname: "", email: "", organisation: "" });

  // Sort & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Title");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selection for Download
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract Journal Name for Header
  useEffect(() => {
      if (user && user.activeJournals && journalid) {
          const matchingJournal = user.activeJournals.find(j => j.journalId === parseInt(journalid, 10));
          if (matchingJournal) {
              setCurrentJournalName(matchingJournal.journalName);
          }
      }
  }, [user, journalid]);

  const fetchData = () => {
    if (!journalid) return;

    fetch(`http://localhost:3001/journal/getjournalbyid/${journalid}`)
      .then(res => res.json())
      .then(data => setJournalData(data.journal || data))
      .catch(console.error);

    fetch(`http://localhost:3001/journal/host/eic?journalId=${journalid}`).then(res => res.json()).then(data => setEic(data.eic)).catch(console.error);
    fetch(`http://localhost:3001/journal/host/accepted-papers?journalId=${journalid}`).then(res => res.json()).then(data => setAcceptedPapers(data.papers)).catch(console.error);
    fetch(`http://localhost:3001/journal/host/stats?journalId=${journalid}`).then(res => res.json()).then(data => setJournalStats(data)).catch(console.error);
    fetch('http://localhost:3001/users/emails').then(res => res.json()).then(data => setAllUsers(data.users)).catch(console.error);
    
    // Fetch specifically users registered in this journal
    fetch(`http://localhost:3001/journal/users?journalId=${journalid}`)
      .then(res => res.json())
      .then(data => setJournalUsers(data.users || []))
      .catch(console.error);
  };

  useEffect(() => { fetchData(); }, [journalid]);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- Searchable Users Logic ---
  const networkUsers = useMemo(() => {
    // Platform users who are NOT part of this journal
    return allUsers.filter(u => !journalUsers.some(ju => ju.id === u.id));
  }, [allUsers, journalUsers]);

  const modalUsersToDisplay = useMemo(() => {
    let baseList = userModalTab === 'upgrade_journal' ? journalUsers : networkUsers;
    
    // Remove the current EiC from the selection lists so you can't assign them again
    if (eic) {
        baseList = baseList.filter(u => u.id !== eic.id);
    }

    if (!userSearchTerm) return baseList;
    const lower = userSearchTerm.toLowerCase();
    return baseList.filter(u => 
        (u.firstname + " " + u.lastname).toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        (u.organisation || "").toLowerCase().includes(lower) ||
        (u.expertise || []).join(" ").toLowerCase().includes(lower)
    );
  }, [userModalTab, journalUsers, networkUsers, userSearchTerm, eic]);

  // --- Handlers for EIC Assignment ---
  const submitExistingUserEiC = async (userId) => {
    if (!window.confirm("Are you sure you want to assign this user as the new Editor-in-Chief?")) return;
    
    try {
        const response = await fetch('http://localhost:3001/journal/host/change-eic', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ newEicId: userId, journalId: journalid })
        });
        if (response.ok) { 
            alert("Editor-in-Chief successfully updated! Email notifications have been sent."); 
            setShowEiCModal(false); 
            fetchData(); 
        } else {
            const err = await response.json();
            alert(`Failed to update EiC: ${err.message}`);
        }
    } catch (error) { console.error(error); }
  };

  const submitNewUserEiC = async (e) => {
    e.preventDefault();
    if (!inviteData.firstname || !inviteData.lastname || !inviteData.email) {
        return alert("Please fill all required fields to invite a new user.");
    }
    
    if (!window.confirm("Are you sure you want to create this user and assign them as the new Editor-in-Chief?")) return;

    try {
        const response = await fetch('http://localhost:3001/journal/host/change-eic', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ newUser: inviteData, journalId: journalid })
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

  // --- Table Sorting & Downloading ---
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
      <Header user={user} journalid={journalid} currentJournalName={currentJournalName} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* JOURNAL DATA HEADER */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-8 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#1f2937]">{journalData?.name || currentJournalName || "Journal Management"}</h2>
                <p className="text-[#6b7280] mt-2 max-w-3xl leading-relaxed">
                  {journalData?.description || "Oversee editorial assignments, evaluate statistics, and manage final publications."}
                </p>
                
                {journalData && (
                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-[#4b5563]">
                        {journalData.Publication && (
                            <span className="bg-white px-3 py-1.5 rounded-md border border-[#e5e7eb] font-medium shadow-sm flex items-center gap-2">
                                🏢 Publisher: {journalData.Publication}
                            </span>
                        )}
                        {journalData.issn && (
                            <span className="bg-white px-3 py-1.5 rounded-md border border-[#e5e7eb] font-medium shadow-sm">
                                ISSN: {journalData.issn}
                            </span>
                        )}
                        {journalData.domain && (
                            <span className="bg-white px-3 py-1.5 rounded-md border border-[#e5e7eb] font-medium shadow-sm">
                                Domain: {journalData.domain}
                            </span>
                        )}
                        {journalData.link && (
                            <a href={journalData.link} target="_blank" rel="noopener noreferrer" className="bg-emerald-50 text-[#059669] px-3 py-1.5 rounded-md border border-emerald-200 font-bold shadow-sm flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                                🔗 Official Website
                            </a>
                        )}
                    </div>
                )}
                
                {journalData?.Keywords && journalData.Keywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Focus Areas:</span>
                        {journalData.Keywords.map((kw, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                                {kw}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-3 shrink-0">
                <button 
                    onClick={() => { setShowEiCModal(true); setUserModalTab('upgrade_journal'); setUserSearchTerm(''); }} 
                    className="px-5 py-2.5 bg-[#059669] text-white font-medium rounded-lg hover:bg-[#047857] transition-colors shadow-sm whitespace-nowrap w-full"
                >
                    Change Editor-in-Chief
                </button>
            </div>
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
                  <button onClick={() => { setShowEiCModal(true); setUserModalTab('upgrade_journal'); setUserSearchTerm(''); }} className="mt-4 px-4 py-2 text-sm font-medium text-[#059669] bg-[#059669]/10 rounded-lg hover:bg-[#059669]/20 transition-colors">Assign One Now</button>
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

      {/* UNIFIED MODAL: Change EiC */}
      {showEiCModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <h3 className="text-lg font-bold text-[#1f2937]">Assign New Editor-in-Chief</h3>
                    <button onClick={() => setShowEiCModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>
                
                <div className="p-5 bg-white border-b border-[#e5e7eb]">
                    <p className="text-sm text-[#6b7280]">Select an existing user or invite a new user to take over the editorial duties. The current EiC will have their role automatically revoked.</p>
                </div>

                <div className="flex border-b border-[#e5e7eb] px-5 pt-3 bg-white overflow-x-auto">
                    <button 
                        className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'upgrade_journal' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => { setUserModalTab('upgrade_journal'); setUserSearchTerm(''); }}
                    >
                        Upgrade Journal User
                    </button>
                    <button 
                        className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'upgrade_network' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => { setUserModalTab('upgrade_network'); setUserSearchTerm(''); }}
                    >
                        Upgrade Network User
                    </button>
                    <button 
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'new' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        onClick={() => setUserModalTab('new')}
                    >
                        Invite Brand New User
                    </button>
                </div>

                <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                    {userModalTab === 'new' ? (
                        <form onSubmit={submitNewUserEiC} className="space-y-4 max-w-md mx-auto mt-4">
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                <p className="text-sm text-gray-600 mb-2">We will create a temporary account, assign them the <strong>Editor-in-Chief</strong> role, and automatically email them login instructions.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="First Name *" required value={inviteData.firstname} onChange={e => setInviteData({...inviteData, firstname: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                    <input type="text" placeholder="Last Name *" required value={inviteData.lastname} onChange={e => setInviteData({...inviteData, lastname: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                </div>
                                <input type="email" placeholder="Email Address *" required value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                <input type="text" placeholder="Organisation / University" value={inviteData.organisation} onChange={e => setInviteData({...inviteData, organisation: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                
                                <button type="submit" className="w-full mt-2 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                    Register & Assign EiC
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search users by name or email..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white shadow-sm"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {(userModalTab === 'upgrade_journal' || userModalTab === 'upgrade_network') && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                    <p className="text-xs text-yellow-800 font-medium">These users do not currently hold the <strong>Editor-in-Chief</strong> role. Selecting them will grant them the role and revoke it from the current EiC.</p>
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
                                                    <p className="text-xs text-[#059669] font-medium truncate" title={u.expertise?.length ? u.expertise.join(', ') : ''}>
                                                        <span className="text-gray-500">Expertise:</span> {u.expertise?.length ? u.expertise.join(', ') : 'Not Specified'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => submitExistingUserEiC(u.id)} 
                                                className="ml-2 px-5 py-2 bg-emerald-50 text-[#059669] border border-[#059669] font-bold text-xs rounded hover:bg-[#059669] hover:text-white transition-colors whitespace-nowrap"
                                            >
                                                Assign EiC
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