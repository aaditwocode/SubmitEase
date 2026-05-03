"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Small reusable author card (compact & read-only) ---
const CompactAuthorCard = ({ author }) => {
    if (!author) return null;
    return (
        <div className="p-3 border rounded-md bg-white shadow-sm flex-1">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
            <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    );
};

// --- Helper for status badge ---
const getStatusBadge = (status) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    const s = status ? status.toLowerCase() : "";

    if (s.includes("accept")) {
        badgeClasses += "bg-green-100 text-green-700";
    } else if (s.includes("reject") || s.includes("declined")) {
        badgeClasses += "bg-red-100 text-red-700";
    } else if (s==="revision required" || s.includes("sent back")) {
        badgeClasses += "bg-orange-100 text-orange-700";
    } else if (s.includes("pending")) {
        badgeClasses += "bg-red-100 text-red-700";
    } else {
        badgeClasses += "bg-yellow-100 text-yellow-700";
    }
    return <span className={badgeClasses}>{status}</span>;
};

export default function ViewRevisionPaper() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { journalid, paperId } = useParams(); 

    // --- Page & Data State ---
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentJournalName, setCurrentJournalName] = useState("");

    // --- Display Data ---
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [authors, setAuthors] = useState([]);

    // --- 1. Main Data Fetching ---
    useEffect(() => {
        if (!paperId || !journalid) {
            setLoading(false);
            setError("Missing paper ID or Journal ID.");
            return;
        }
        
        const fetchPaper = async () => {
            setLoading(true);
            try {
                // Fetch strictly the revision paper ID
                const response = await fetch(`http://localhost:3001/journal/getpaperbyid/${paperId}?journalId=${journalid}`);
                if (!response.ok) throw new Error("Failed to fetch paper details.");
                const data = await response.json();
                
                setPaper(data.paper);
                setTitle(data.paper.Title || "");
                setAbstract(data.paper.Abstract || "");
                setKeywords((data.paper.Keywords || []).join(', '));

                // Sort authors for display
                const fetchedAuthors = data.paper.Authors || [];
                const authorOrder = data.paper.AuthorOrder;
                let sortedAuthors = fetchedAuthors;
                if (authorOrder && authorOrder.length > 0 && fetchedAuthors.length > 0) {
                    const authorMap = new Map(fetchedAuthors.map(author => [author.id, author]));
                    sortedAuthors = authorOrder.map(id => authorMap.get(id)).filter(Boolean);
                    const authorsInOrderSet = new Set(authorOrder);
                    const authorsNotInOrder = fetchedAuthors.filter(author => !authorsInOrderSet.has(author.id));
                    sortedAuthors = [...sortedAuthors, ...authorsNotInOrder];
                }
                setAuthors(sortedAuthors);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.activeJournals) {
            const matchingJournal = user.activeJournals.find(j => j.journalId === parseInt(journalid, 10));
            if (matchingJournal) {
                setCurrentJournalName(matchingJournal.journalName);
            }
        }

        fetchPaper();
    }, [paperId, journalid, user]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

    // Prefers RevisionPaperURL (the full merged doc with response sheet) if it exists
    const displayPdfUrl = paper.RevisionPaperURL || paper.FinalPaperURL || paper.URL;
    const cacheBustKey = new Date(paper.updatedAt || paper.submittedAt).getTime();
    
    // Explicit Review Filtering for this specific revision
    const visibleReviews = paper.Reviews?.filter(r => r.isVisibleToAuthor) || [];

    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };
    
    const Header = ({ user }) => {
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const navigate = useNavigate();
      
        const ROLE_CONFIG = {
            "Author": { label: "Author", path: `/journal/${journalid}/author` },
            "Journal Editor": { label: "Editor", path: `/journal/${journalid}/editor` },
            "Journal Reviewer": { label: "Reviewer", path: `/journal/${journalid}/reviewer` },
            "Editor-in-Chief": { label: "Editor-in-Chief", path: `/journal/${journalid}/eic` },
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
                            <button key={index} onMouseDown={() => { navigate(option.path); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]">
                              {option.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
      
                <button onClick={() => navigate('/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
                <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
              </div>
            </div>
          </header>
        );
    };

    return (
        <div className="min-h-screen bg-[#ffffff]">
            <Header user={user} />
            <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    {/* Left: Metadata (Read-Only) */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-4 h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Revision Details</h3>
                            {getStatusBadge(paper.Status)}
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper ID</label>
                                <label className="block w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">{paper.id}</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                                <input type="text" value={title} disabled className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                                <textarea value={abstract} rows={5} disabled className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords</label>
                                <input type="text" value={keywords} disabled className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors</label>
                                <div className="space-y-2">
                                    {authors.map((a, i) => (
                                        <div key={a.id} className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-400">{i + 1}.</span>
                                            <CompactAuthorCard author={a} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right: PDF Viewer */}
                    <div className="lg:col-span-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Document Viewer</h3>
                            <a 
                                href={`${displayPdfUrl}?v=${cacheBustKey}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1 text-sm font-medium text-[#059669] border border-[#059669] rounded-md hover:bg-[#059669]/10 transition-colors"
                            >
                                Open in New Tab ↗
                            </a>
                        </div>
                        <iframe src={`${displayPdfUrl}?v=${cacheBustKey}`} className="border rounded-md flex-grow" width="100%" height="100%" title="Revision Document" />
                    </div>
                </div>

                {/* --- VISIBLE REVIEWER COMMENTS SECTION (BOTTOM) --- */}
                {visibleReviews.length > 0 && (
                    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-xl p-6 mt-8">
                        <h3 className="text-lg font-bold text-[#1f2937] mb-4 flex items-center gap-2">
                            <span>📝</span> Editorial & Reviewer Feedback
                        </h3>
                        <div className="space-y-4">
                            {visibleReviews.map((review, idx) => (
                                <div key={review.id} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-sm text-[#059669]">Reviewer {idx + 1}</p>
                                        {review.Recommendation && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-white border border-gray-200 rounded text-gray-600">
                                                Recommendation: {review.Recommendation}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 border border-gray-100 rounded">
                                        {review.Comment || "No written feedback provided."}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}