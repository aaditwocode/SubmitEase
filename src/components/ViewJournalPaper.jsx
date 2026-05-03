"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

const CompactAuthorCard = ({ author }) => {
    if (!author) return null;
    return (
        <div className="p-3 border rounded-md bg-white shadow-sm">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
            <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    );
};

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

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

export default function ViewJournalPaper() {
    const { user, setUser, loginStatus, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { journalid, paperId } = useParams();
    const countries = [
        "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
        "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
        "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
    ];

    const [paper, setPaper] = useState(null);
    const [activeDisplayPaper, setActiveDisplayPaper] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    
    const [journalUsers, setJournalUsers] = useState([]);
    const [platformUsers, setPlatformUsers] = useState([]);
    const [currentJournalName, setCurrentJournalName] = useState("");

    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [authors, setAuthors] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]); 
    
    const [responseSheetFile, setResponseSheetFile] = useState(null);
    const [previousPaperFile, setPreviousPaperFile] = useState(null);

    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [revTitle, setRevTitle] = useState("");
    const [revAbstract, setRevAbstract] = useState("");
    const [revKeywords, setRevKeywords] = useState("");
    const [revAuthors, setRevAuthors] = useState([]);
    const [revPdfFile, setRevPdfFile] = useState(null);
    const [revResponseSheetFile, setRevResponseSheetFile] = useState(null); 
    const [revPreviousPaperFile, setRevPreviousPaperFile] = useState(null); 
    const [revAdditionalFiles, setRevAdditionalFiles] = useState([]); 

    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [authorModalContext, setAuthorModalContext] = useState("main");
    const [authorModalTab, setAuthorModalTab] = useState("journal");
    const [authorSearchTerm, setAuthorSearchTerm] = useState("");
    
    const [inviteFirstName, setInviteFirstName] = useState("");
    const [inviteLastName, setInviteLastName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteOrg, setInviteOrg] = useState("");
    const [inviteCountry, setInviteCountry] = useState("");

    useEffect(() => {
        if (!paperId || !journalid) {
            setLoading(false);
            setError("Missing paper ID or Journal ID.");
            return;
        }
        
        const fetchPaper = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/journal/getpaperbyid/${paperId}?journalId=${journalid}`);
                if (!response.ok) throw new Error("Failed to fetch paper details.");
                const data = await response.json();
                
                setPaper(data.paper);

                // --- DETERMINE ACTIVE PAPER TO DISPLAY ---
                const hasRevisions = data.paper.Revisions && data.paper.Revisions.length > 0;
                const targetPaper = hasRevisions ? data.paper.Revisions[0] : data.paper;
                setActiveDisplayPaper(targetPaper);

                const editable = targetPaper.Status === 'Pending Submission';
                setIsEditable(editable);

                setTitle(targetPaper.Title || "");
                setAbstract(targetPaper.Abstract || "");
                setKeywords((targetPaper.Keywords || []).join(', '));

                setRevTitle(targetPaper.Title || "");
                setRevAbstract(targetPaper.Abstract || "");
                setRevKeywords((targetPaper.Keywords || []).join(', '));
                
                const fetchedAuthors = targetPaper.Authors || [];
                const authorOrder = targetPaper.AuthorOrder;
                let sortedAuthors = fetchedAuthors;
                if (authorOrder && authorOrder.length > 0 && fetchedAuthors.length > 0) {
                    const authorMap = new Map(fetchedAuthors.map(author => [author.id, author]));
                    sortedAuthors = authorOrder.map(id => authorMap.get(id)).filter(Boolean);
                    const authorsInOrderSet = new Set(authorOrder);
                    const authorsNotInOrder = fetchedAuthors.filter(author => !authorsInOrderSet.has(author.id));
                    sortedAuthors = [...sortedAuthors, ...authorsNotInOrder];
                }
                setAuthors(sortedAuthors);
                setRevAuthors(sortedAuthors);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserData = async () => {
            try {
                const journalUsersRes = await fetch(`http://localhost:3001/journal/users?journalId=${journalid}`);
                if (journalUsersRes.ok) {
                    const data = await journalUsersRes.json();
                    setJournalUsers(data.users || []);
                }
            } catch(e) { console.error("Error fetching journal users", e); }

            try {
                const platformUsersRes = await fetch(`http://localhost:3001/users/emails`); 
                if (platformUsersRes.ok) {
                    const data = await platformUsersRes.json();
                    setPlatformUsers(data.users || []);
                }
            } catch(e) { console.error("Error fetching platform users", e); }

            if (user && user.activeJournals) {
                const matchingJournal = user.activeJournals.find(j => j.journalId === parseInt(journalid, 10));
                if (matchingJournal) {
                    setCurrentJournalName(matchingJournal.journalName);
                }
            }
        };

        fetchPaper();
        fetchUserData();
    }, [paperId, journalid, user]);

    const modalUsersToDisplay = useMemo(() => {
        let list = authorModalTab === 'journal' ? journalUsers : platformUsers;
        const currentActiveAuthors = authorModalContext === 'main' ? authors : revAuthors;
        list = list.filter(u => u && u.id && !currentActiveAuthors.some(a => a && a.id === u.id));

        if (authorModalTab === 'platform') {
            list = list.filter(u => !journalUsers.some(ju => ju.id === u.id));
        }

        if (authorSearchTerm.trim()) {
            const lowerTerm = authorSearchTerm.toLowerCase();
            list = list.filter(u => 
                u.firstname?.toLowerCase().includes(lowerTerm) ||
                u.lastname?.toLowerCase().includes(lowerTerm) ||
                u.email?.toLowerCase().includes(lowerTerm) ||
                u.organisation?.toLowerCase().includes(lowerTerm) ||
                (u.expertise && u.expertise.some(exp => exp.toLowerCase().includes(lowerTerm)))
            );
        }

        return list;
    }, [authorModalTab, journalUsers, platformUsers, authors, revAuthors, authorSearchTerm, authorModalContext]);


    const openAuthorModal = (context) => {
        setAuthorModalContext(context);
        setShowAuthorModal(true);
        setAuthorSearchTerm("");
    };

    const addAuthorToCorrectState = (userObj) => {
        if (!userObj) return;
        if (authorModalContext === 'main' && !authors.some(a => a.id === userObj.id)) {
            setAuthors(prev => [...prev, userObj]);
        } else if (authorModalContext === 'revision' && !revAuthors.some(a => a.id === userObj.id)) {
            setRevAuthors(prev => [...prev, userObj]);
        }
    };

    const handleAddJournalUser = (userId) => {
        const userObj = journalUsers.find(u => u.id === userId);
        addAuthorToCorrectState(userObj);
        setShowAuthorModal(false);
        setAuthorSearchTerm("");
    };

    const handleRegisterAndAddPlatformUser = async (userId) => {
        try {
            const res = await fetch('http://localhost:3001/journals/register-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId, 10), journalId: parseInt(journalid, 10) })
            });
            if (res.ok) {
                const userObj = platformUsers.find(u => u.id === userId);
                addAuthorToCorrectState(userObj);
                setShowAuthorModal(false);
                setAuthorSearchTerm("");
            } else {
                alert("Failed to register user to journal.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error while registering user.");
        }
    };

    const handleInviteNewAuthor = (e) => {
        e?.preventDefault();
        if (!inviteEmail || !inviteFirstName || !inviteLastName) return alert("Fill required fields");
        
        const mockNewUser = { id: Date.now(), firstname: inviteFirstName, lastname: inviteLastName, email: inviteEmail, organisation: inviteOrg };
        addAuthorToCorrectState(mockNewUser);
        setShowAuthorModal(false);
        
        setInviteFirstName(""); setInviteLastName(""); setInviteEmail(""); setInviteOrg(""); setInviteCountry("");
    };

    const handleRemoveAuthor = (idx, context) => {
        if (context === 'main') {
            if (authors.length <= 1) return alert('At least one author is required.');
            setAuthors(prev => prev.filter((_, i) => i !== idx));
        } else {
            if (revAuthors.length <= 1) return alert('At least one author is required.');
            setRevAuthors(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        if (result.source.droppableId === "authors-droppable") {
            setAuthors(reorder(authors, result.source.index, result.destination.index));
        } else if (result.source.droppableId === "rev-authors-droppable") {
            setRevAuthors(reorder(revAuthors, result.source.index, result.destination.index));
        }
    };

    const handleAddAdditionalFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAdditionalFiles(prev => [...prev, file]);
            e.target.value = null; 
        }
    };
    const handleRemoveAdditionalFile = (indexToRemove) => {
        setAdditionalFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleAddRevAdditionalFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setRevAdditionalFiles(prev => [...prev, file]);
            e.target.value = null; 
        }
    };
    const handleRemoveRevAdditionalFile = (indexToRemove) => {
        setRevAdditionalFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleUpdatePaper = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('paperId', activeDisplayPaper.id);
        formData.append('journalId', journalid);
        formData.append('title', title);
        formData.append('abstract', abstract);
        formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
        formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
        
        if (pdfFile) formData.append('pdfFile', pdfFile);

        const isEditingDraftRevision = !!activeDisplayPaper.OriginalPaperId;
        if (isEditingDraftRevision) {
            if (responseSheetFile) formData.append('responseSheet', responseSheetFile);
            if (previousPaperFile) formData.append('additionalFiles', previousPaperFile);
        }

        if (additionalFiles && additionalFiles.length > 0) {
            additionalFiles.forEach((file) => formData.append('additionalFiles', file));
        }

        try {
            const response = await fetch(`http://localhost:3001/journal/editpaper`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to update.');
            alert('Paper saved!');
            window.location.reload(); 
        } catch (error) { alert(`Error: ${error.message}`); }
    };

    const handleSubmitForReview = async (e) => {
        e.preventDefault();
        
        const isEditingDraftRevision = !!activeDisplayPaper.OriginalPaperId;

        // --- STRICT FRONTEND SUBMISSION VALIDATION ---
        if (!pdfFile && !activeDisplayPaper.URL && !activeDisplayPaper.FinalPaperURL) {
            return alert(`Submission Failed: Please upload the ${isEditingDraftRevision ? 'Revised Manuscript' : 'Main Manuscript'} (PDF) before submitting.`);
        }

        if (isEditingDraftRevision) {
            if (!responseSheetFile && !activeDisplayPaper.RevisionPaperURL) {
                return alert("Submission Failed: Please upload the 'Response to Reviewers (PDF)' before submitting.");
            }
            if (!previousPaperFile && !activeDisplayPaper.URL && additionalFiles.length === 0) {
                 return alert("Submission Failed: Please upload the 'Previous/Marked-up Manuscript (PDF)' before submitting.");
            }
        }

        if (!window.confirm("Submit paper? Once submitted, you cannot edit this version.")) return;
        
        const formData = new FormData();
        formData.append('paperId', activeDisplayPaper.id);
        formData.append('journalId', journalid);
        formData.append('title', title);
        formData.append('abstract', abstract);
        formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
        formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
        
        if (pdfFile) formData.append('pdfFile', pdfFile);

        if (isEditingDraftRevision) {
            if (responseSheetFile) formData.append('responseSheet', responseSheetFile);
            if (previousPaperFile) formData.append('additionalFiles', previousPaperFile);
        }

        if (additionalFiles && additionalFiles.length > 0) {
            additionalFiles.forEach((file) => formData.append('additionalFiles', file));
        }

        try {
            const response = await fetch(`http://localhost:3001/journal/submitpaper`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to submit.');
            alert('Submitted Successfully!');
            navigate(`/journal/${journalid}/author`);
        } catch (error) { alert(`Error: ${error.message}`); }
    };

    const handleRevisionSubmit = async (e) => {
        e.preventDefault();
        
        // Modal is ALWAYS generating a brand new revision, so files are strictly required in the UI
        if (!revPdfFile) return alert("Submission Failed: Please upload the 'Revised Manuscript (Clean PDF)'.");
        if (!revResponseSheetFile) return alert("Submission Failed: Please upload the 'Response to Reviewers (PDF)'.");
        if (!revPreviousPaperFile) return alert("Submission Failed: Please upload the 'Previous/Marked-up Manuscript (PDF)'.");
        
        const formData = new FormData();
        const rootId = paper.OriginalPaperId || paper.id;
        let nextVersion = 1;
        const revisionsList = paper.Revisions || []; 
        if (revisionsList && revisionsList.length > 0) nextVersion = revisionsList.length + 1;
        
        const customPaperId = `${rootId}_R${nextVersion}`;

        formData.append('id', customPaperId);
        formData.append('originalPaperId', rootId);
        formData.append('journalId', journalid);
        formData.append('title', revTitle);
        formData.append('abstract', revAbstract);
        formData.append('keywords', JSON.stringify(revKeywords.split(',').map(k => k.trim()).filter(Boolean)));
        formData.append('authorIds', JSON.stringify(revAuthors.map(a => a.id)));
        
        formData.append('pdfFile', revPdfFile);
        formData.append('responseSheet', revResponseSheetFile); 
        formData.append('additionalFiles', revPreviousPaperFile); 

        if (revAdditionalFiles && revAdditionalFiles.length > 0) {
            revAdditionalFiles.forEach((file) => formData.append('additionalFiles', file));
        }

        try {
            const response = await fetch(`http://localhost:3001/journal/savepaper`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to submit revision.');
            alert(`Revision submitted successfully!`);
            setShowRevisionForm(false);
            window.location.reload(); 
        } catch (error) { alert(`Error: ${error.message}`); }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper || !activeDisplayPaper) return <div className="p-8 text-center">Paper not found.</div>;

    // --- DERIVED STATE ---
    const isDraftRevision = !!activeDisplayPaper.OriginalPaperId;
    const displayPdfUrl = activeDisplayPaper.RevisionPaperURL || activeDisplayPaper.FinalPaperURL || activeDisplayPaper.URL;
    const cacheBustKey = new Date(activeDisplayPaper.updatedAt || activeDisplayPaper.submittedAt).getTime();
    
    const revisionsList = paper.Revisions || [];
    const currentStatus = activeDisplayPaper.Status;
    const canSubmitRevision = currentStatus === "Revision Required";
    
    const fullHistoryList = [...revisionsList, paper];
    const filteredHistoryList = fullHistoryList.filter(item => item.id !== activeDisplayPaper.id);
    const showRevisionSection = filteredHistoryList.length > 0 || canSubmitRevision;
    
    const visibleReviews = activeDisplayPaper.Reviews?.filter(r => r.isVisibleToAuthor) || [];

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
                
                <button 
                    onClick={() => navigate(`/journal/${journalid}/author`)} 
                    className="mb-6 flex items-center text-sm font-medium text-[#059669] hover:underline"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Author Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    {/* Left: Metadata */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-4 h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Paper Details</h3>
                            {getStatusBadge(activeDisplayPaper.Status)}
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper ID</label>
                                <label className="block w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">
                                    {paper.id} 
                                </label>
                                {activeDisplayPaper.id !== paper.id && (
                                    <p className="text-xs text-[#059669] mt-1 font-medium italic">Viewing Revision: {activeDisplayPaper.id}</p>
                                )}
                            </div>

                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label><textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} readOnly={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] read-only:bg-gray-100" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords</label><input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} disabled={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100" /></div>
                            
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2 flex justify-between items-center">
                                    <span>Authors</span>
                                    {isEditable && (
                                        <button type="button" onClick={() => openAuthorModal('main')} className="text-sm px-3 py-1 bg-[#059669]/10 text-[#059669] font-medium rounded-md hover:bg-[#059669]/20 transition-colors">
                                            + Add / Invite Author
                                        </button>
                                    )}
                                </label>
                                {isEditable ? (
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="authors-droppable">
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                    {authors.map((a, i) => (
                                                        <Draggable key={a.id} draggableId={String(a.id)} index={i}>
                                                            {(prov) => (
                                                                <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white shadow-sm">
                                                                    <div {...prov.dragHandleProps} className="cursor-grab text-[#6b7280]">☰</div>
                                                                    <div className="flex-1"><CompactAuthorCard author={a} /></div>
                                                                    <button type="button" onClick={() => handleRemoveAuthor(i, 'main')} className="text-red-600 text-sm font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50">Remove</button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                ) : (
                                    <div className="space-y-2">{authors.map(a => <CompactAuthorCard key={a.id} author={a} />)}</div>
                                )}
                            </div>
                            
                            {isEditable && (
                                <>
                                    <div className="pt-4 border-t border-[#e5e7eb] mt-4">
                                        <label className="block text-sm font-medium text-[#1f2937] mb-1 mt-4">
                                            {isDraftRevision ? "1. Revised Manuscript (Clean PDF)" : "Upload New Version (PDF)"}
                                        </label>
                                        <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20" />
                                    </div>

                                    {isDraftRevision && (
                                        <>
                                            <div className="pt-2 mt-2">
                                                <label className="block text-sm font-medium text-[#1f2937] mb-1">2. Response to Reviewers (PDF)</label>
                                                <input type="file" onChange={(e) => setResponseSheetFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#f59e0b]/10 file:text-[#f59e0b] hover:file:bg-[#f59e0b]/20" />
                                                <p className="text-[11px] text-gray-500 mt-1">Please provide a document detailing your answers to the reviewers' comments.</p>
                                            </div>

                                            <div className="pt-2 mt-2">
                                                <label className="block text-sm font-medium text-[#1f2937] mb-1">3. Previous/Marked-up Manuscript (PDF)</label>
                                                <input type="file" onChange={(e) => setPreviousPaperFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#8b5cf6]/10 file:text-[#8b5cf6] hover:file:bg-[#8b5cf6]/20" />
                                                <p className="text-[11px] text-gray-500 mt-1">Upload the previous version of the paper with tracked changes or highlights.</p>
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-2 mt-2 border-t border-[#e5e7eb] transition-all duration-300 ease-in-out">
                                        <label className="block text-sm font-medium text-[#1f2937] mb-1 mt-2">
                                            {isDraftRevision ? "4. Other Additional Documents" : "Add Additional Documents (Merge Order)"}
                                        </label>
                                        <p className="text-[11px] text-[#6b7280] mb-3">Upload supporting documents one by one in the exact order you want them merged.</p>
                                        
                                        {additionalFiles.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                {additionalFiles.map((file, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 text-sm border border-[#e5e7eb] rounded-md bg-white shadow-sm">
                                                        <span className="font-medium text-[#1f2937] truncate flex-1">
                                                            <span className="text-[#059669] mr-2 font-bold">{i + 1}.</span> {file.name}
                                                        </span>
                                                        <button type="button" onClick={() => handleRemoveAdditionalFile(i)} className="ml-3 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors">Remove</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <input type="file" onChange={handleAddAdditionalFile} className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#3b82f6]/10 file:text-[#3b82f6] hover:file:bg-[#3b82f6]/20 cursor-pointer" />
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                                        <button onClick={handleUpdatePaper} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Draft</button>
                                        <button onClick={handleSubmitForReview} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Submit</button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>

                    {/* Right: PDF Viewer & Reviewer Comments */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full h-[80vh] flex flex-col">
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
                            <iframe src={`${displayPdfUrl}?v=${cacheBustKey}`} className="border rounded-md flex-grow" width="100%" height="100%" />
                        </div>

                        {/* --- VISIBLE REVIEWER COMMENTS --- */}
                        {visibleReviews.length > 0 && (
                            <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-xl p-6">
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
                    </div>
                </div>

                {/* --- REVISION HISTORY TABLE --- */}
                {showRevisionSection && (
                    <div className="bg-white rounded-lg shadow flex flex-col mt-8">
                        <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
                             <h3 className="text-lg font-semibold text-[#1f2937]">Revision History</h3>
                             {canSubmitRevision && (
                                <button onClick={() => setShowRevisionForm(true)} className="px-4 py-2 bg-[#059669] text-white rounded-md text-sm font-medium hover:bg-[#059669]/90 shadow-sm">
                                    Submit New Revision
                                </button>
                             )}
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Paper ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Submitted On</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistoryList.length > 0 ? (
                                        filteredHistoryList.map((item, index) => {
                                            const isOriginal = item.id === paper.id;
                                            return (
                                                <tr key={item.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                                                    <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{item.id}</td>
                                                    <td className="py-3 px-4 text-sm text-[#1f2937]">{new Date(item.submittedAt).toLocaleDateString()}</td>
                                                    <td className="py-3 px-4">
                                                        {isOriginal ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Original Paper</span>
                                                                {getStatusBadge(item.Status)}
                                                            </div>
                                                        ) : (
                                                            getStatusBadge(item.Status)
                                                        )}
                                                    </td>
                                                    
                                                    <td className="py-3 px-4">
                                                        <button 
                                                            onClick={() => window.open(`/journal/${journalid}/author/revision/${item.id}`, '_blank')}
                                                            className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center text-gray-500 py-4">No other versions in history.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- REVISION SUBMISSION MODAL --- */}
            {showRevisionForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Submit Revised Manuscript</h3>
                            <button onClick={() => setShowRevisionForm(false)} className="text-[#6b7280] hover:text-[#1f2937]">✕</button>
                        </div>
                        
                        <div className="bg-[#059669]/10 border border-[#059669]/20 text-[#059669] px-4 py-3 rounded text-sm mb-4">
                            You are submitting a revision for <strong>{paper.Title}</strong>.
                        </div>
                        <form className="space-y-4" onSubmit={handleRevisionSubmit}>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label><input type="text" value={revTitle} onChange={(e) => setRevTitle(e.target.value)} required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label><textarea value={revAbstract} onChange={(e) => setRevAbstract(e.target.value)} required rows={4} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords</label><input type="text" value={revKeywords} onChange={(e) => setRevKeywords(e.target.value)} required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" /></div>
                            
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2 flex justify-between items-center">
                                    <span>Authors (drag to reorder)</span>
                                    <button type="button" onClick={() => openAuthorModal('revision')} className="text-sm px-3 py-1 bg-[#059669]/10 text-[#059669] font-medium rounded-md hover:bg-[#059669]/20 transition-colors">
                                        + Add / Invite Author
                                    </button>
                                </label>
                                <div className="space-y-2">
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="rev-authors-droppable">
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                    {revAuthors.map((author, index) => (
                                                        <Draggable key={author.id} draggableId={`rev-${author.id}`} index={index}>
                                                            {(prov) => (
                                                                <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white shadow-sm">
                                                                    <div {...prov.dragHandleProps} className="cursor-grab text-[#6b7280]">☰</div>
                                                                    <div className="flex-1"><CompactAuthorCard author={author} /></div>
                                                                    <button type="button" onClick={() => handleRemoveAuthor(index, 'revision')} className="text-red-600 text-sm font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50">Remove</button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-[#e5e7eb] mt-4">
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">1. Revised Manuscript (Clean PDF)</label>
                                <input type="file" onChange={(e) => setRevPdfFile(e.target.files[0])} accept=".pdf" required className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20" />
                            </div>

                            <div className="pt-2 mt-2">
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">2. Response to Reviewers (PDF)</label>
                                <input type="file" onChange={(e) => setRevResponseSheetFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#f59e0b]/10 file:text-[#f59e0b] hover:file:bg-[#f59e0b]/20" />
                                <p className="text-[11px] text-gray-500 mt-1">Please provide a document detailing your answers to the reviewers' comments.</p>
                            </div>

                            <div className="pt-2 mt-2">
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">3. Previous/Marked-up Manuscript (PDF)</label>
                                <input type="file" onChange={(e) => setRevPreviousPaperFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#8b5cf6]/10 file:text-[#8b5cf6] hover:file:bg-[#8b5cf6]/20" />
                                <p className="text-[11px] text-gray-500 mt-1">Upload the previous version of the paper with tracked changes or highlights.</p>
                            </div>

                            <div className="pt-2 mt-2 border-t border-[#e5e7eb] transition-all duration-300 ease-in-out">
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">4. Other Additional Documents</label>
                                <p className="text-[11px] text-[#6b7280] mb-2">Upload any other supporting documents one by one.</p>
                                
                                {revAdditionalFiles.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {revAdditionalFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 text-sm border border-[#e5e7eb] rounded-md bg-white shadow-sm">
                                                <span className="font-medium text-[#1f2937] truncate flex-1">
                                                    <span className="text-[#3b82f6] mr-2 font-bold">{i + 1}.</span> {file.name}
                                                </span>
                                                <button type="button" onClick={() => handleRemoveRevAdditionalFile(i)} className="ml-3 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input type="file" onChange={handleAddRevAdditionalFile} className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#3b82f6]/10 file:text-[#3b82f6] hover:file:bg-[#3b82f6]/20 cursor-pointer" />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                                <button type="submit" className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Submit Revision</button>
                                <button type="button" onClick={() => setShowRevisionForm(false)} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- UNIFIED USER SELECTION MODAL --- */}
            {showAuthorModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        
                        <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                            <h3 className="text-lg font-bold text-[#1f2937]">Add Co-Author</h3>
                            <button onClick={() => setShowAuthorModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        <div className="flex border-b border-[#e5e7eb] px-5 pt-3 bg-white">
                            <button 
                                className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'journal' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => { setAuthorModalTab('journal'); setAuthorSearchTerm(''); }}
                            >
                                Registered Journal Users
                            </button>
                            <button 
                                className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'platform' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => { setAuthorModalTab('platform'); setAuthorSearchTerm(''); }}
                            >
                                Register Other Users To Journal
                            </button>
                            <button 
                                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${authorModalTab === 'new' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => setAuthorModalTab('new')}
                            >
                                Invite Brand New User
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                            {authorModalTab === 'new' ? (
                                <form onSubmit={handleInviteNewAuthor} className="space-y-4 max-w-md mx-auto mt-4">
                                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                        <p className="text-sm text-gray-600 mb-2">We will create a temporary account, assign them the <strong>Author</strong> role, attach them to this paper, and automatically email them login instructions.</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="First Name *" required value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                            <input type="text" placeholder="Last Name *" required value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                        </div>
                                        <input type="email" placeholder="Email Address *" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                        <input type="text" placeholder="Organisation" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                        <select value={inviteCountry} onChange={e => setInviteCountry(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-sm">
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <button type="submit" className="w-full mt-2 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                            Invite & Add Author
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder={`Search by name, email, organisation, or expertise...`}
                                            value={authorSearchTerm}
                                            onChange={(e) => setAuthorSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white shadow-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {authorModalTab === 'platform' && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                            <p className="text-xs text-yellow-800 font-medium">These users are registered on SubmitEase but are not associated with this journal. Selecting them will register them to the journal and assign them to this paper.</p>
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
                                                            <p className="text-xs text-[#059669] font-medium truncate" title={u.expertise?.length ? u.expertise.join(', ') : ''}><span className="text-gray-500">Expertise:</span> {u.expertise?.length ? u.expertise.join(', ') : 'Not Specified'}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => authorModalTab === 'platform' ? handleRegisterAndAddPlatformUser(u.id) : handleAddJournalUser(u.id)} 
                                                        className="ml-2 px-5 py-2 bg-emerald-50 text-[#059669] border border-[#059669] font-bold text-xs rounded hover:bg-[#059669] hover:text-white transition-colors whitespace-nowrap"
                                                    >
                                                        {authorModalTab === 'platform' ? `Register & Add` : `Add Co-Author`}
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