"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Small reusable author card (compact) ---
const CompactAuthorCard = ({ author }) => {
    if (!author) return null;
    return (
        <div className="p-3 border rounded-md bg-white">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
            <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    );
};

// --- Utility to reorder array on drag end ---
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

// --- Helper for status badge ---
const getStatusBadge = (status) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    const s = status ? status.toLowerCase() : "";

    if (s.includes("accept")) {
        badgeClasses += "bg-green-100 text-green-700";
    } else if (s.includes("reject")) {
        badgeClasses += "bg-red-100 text-red-700";
    } else if (s==="revision required") {
        badgeClasses += "bg-orange-100 text-orange-700";
    } else if (s.includes("pending")) {
        badgeClasses += "bg-red-100 text-red-700";
    } else {
        badgeClasses += "bg-yellow-100 text-yellow-700";
    }
    return <span className={badgeClasses}>{status}</span>;
};

export default function ViewRevisionPaper() {
    const { user, setUser, loginStatus, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { paperId } = useParams();
    const countries = [
        "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
        "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
        "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
    ];

    // --- Page & Data State ---
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    // --- Form State ---
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [authors, setAuthors] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);

    // --- Invite Form State ---
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteFirstName, setInviteFirstName] = useState("");
    const [inviteLastName, setInviteLastName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteOrg, setInviteOrg] = useState("");
    const [inviteCountry, setInviteCountry] = useState("");

    // --- 1. Main Data Fetching ---
    useEffect(() => {
        if (!paperId) {
            setLoading(false);
            setError("No paper ID found.");
            return;
        }
        const fetchPaper = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/journal/getpaperbyid/${paperId}`);
                if (!response.ok) throw new Error("Failed to fetch paper details.");
                const data = await response.json();
                setPaper(data.paper);
                console.log("Fetched Paper Data:", data.paper);
                const editable = data.paper.Status === 'Pending Submission';
                setIsEditable(editable);

                setTitle(data.paper.Title);
                setAbstract(data.paper.Abstract);
                setKeywords(data.paper.Keywords.join(', '));

                // Sort authors
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
        fetchPaper();
    }, [paperId]);

    // --- 2. Fetch Users ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3001/users/emails');
                if (response.ok) {
                    const data = await response.json();
                    setAllUsers(data.users || []);
                }
            } catch (error) { console.error("Failed to fetch users:", error); }
        };
        fetchUsers();
    }, []);

    // --- Handlers ---
    const addAuthorById = (userId) => {
        const userObj = allUsers.find(u => u.id === parseInt(userId, 10));
        if (userObj && !authors.some(a => a.id === userObj.id)) setAuthors(prev => [...prev, userObj]);
    };
    const handleRemoveAuthor = (idx) => {
        if (authors.length <= 1) return alert('At least one author is required.');
        setAuthors(prev => prev.filter((_, i) => i !== idx));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        if (result.source.droppableId === "authors-droppable") {
            setAuthors(reorder(authors, result.source.index, result.destination.index));
        }
    };

    const handleInviteAuthor = async (e) => {
        e.preventDefault();
        if (!inviteEmail || !inviteFirstName || !inviteLastName) return alert("Fill required fields.");
        try {
            const response = await fetch('http://localhost:3001/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, firstname: inviteFirstName, lastname: inviteLastName, organisation: inviteOrg, password: "default123", role: ["Author"], expertise: [], country: inviteCountry }),
            });
            if (!response.ok) throw new Error("Failed to invite.");
            const newUser = await response.json();
            
            setAuthors(prev => [...prev, newUser]);
            setAllUsers(prev => [...prev, newUser]);
            setShowInviteForm(false);
            setInviteEmail(""); setInviteFirstName(""); setInviteLastName(""); setInviteOrg(""); setInviteCountry("");
        } catch (error) { alert(`Error: ${error.message}`); }
    };

    const handleUpdatePaper = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('paperId', paperId);
        formData.append('title', title);
        formData.append('abstract', abstract);
        formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
        formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
        if (pdfFile) formData.append('pdfFile', pdfFile);

        try {
            const response = await fetch(`http://localhost:3001/journal/editpaper`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to update.');
            const data = await response.json();
            setPaper(data.paper);
            setAuthors(data.paper.Authors || []);
            setKeywords(data.paper.Keywords.join(', '));
            alert('Paper saved!');
            setPdfFile(null);
        } catch (error) { alert(`Error: ${error.message}`); }
        navigate('/journal');
    };

    const handleSubmitForReview = async (e) => {
        e.preventDefault();
        if (!window.confirm("Submit paper?")) return;
        const formData = new FormData();
        formData.append('paperId', paperId);
        formData.append('title', title);
        formData.append('abstract', abstract);
        formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
        formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
        if (pdfFile) formData.append('pdfFile', pdfFile);

        try {
            const response = await fetch(`http://localhost:3001/journal/submitpaper`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to submit.');
            const data = await response.json();
            setPaper(data.paper);
            setIsEditable(false);
            alert('Submitted!');
        } catch (error) { alert(`Error: ${error.message}`); }
        navigate('/journal');
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

    const displayPdfUrl = paper.FinalPaperURL || paper.URL;
    const cacheBustKey = new Date(paper.updatedAt || paper.submittedAt).getTime();
    
    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };
    // Header Logic
    const Header = ({ user }) => {
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const navigate = useNavigate();
      
        const ROLE_CONFIG = {
          "Author": { label: "Author", path: "/journal" },
        };
      
        const availablePortals = useMemo(() => {
          if (!user || !user.role || !Array.isArray(user.role)) return [];
          return user.role
            .map(roleString => ROLE_CONFIG[roleString])
            .filter(Boolean);
        }, [user]);
      
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
                            <button key={index} onClick={() => { navigate(option.path); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]">
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
                    {/* Left: Metadata */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-4 h-full">
                        <button 
                            onClick={() => navigate('/journal/paper/'+paper.OriginalPaperId)} 
                            className="text-[#059669] text-sm font-medium hover:underline mb-2 flex items-center gap-1"
                        >
                            ← Back to Main Paper
                        </button>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Paper Details</h3>
                            {getStatusBadge(paper.Status)}
                        </div>
                        <form className="space-y-4">
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Paper ID</label><label className="block w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">{paper.id}</label></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label><textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} readOnly={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] read-only:bg-gray-100" /></div>
                            <div><label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords</label><input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} disabled={!isEditable} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100" /></div>
                            
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors</label>
                                {isEditable ? (
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="authors-droppable">
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                    {authors.map((a, i) => (
                                                        <Draggable key={a.id} draggableId={String(a.id)} index={i}>
                                                            {(prov) => (
                                                                <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                                                    <div {...prov.dragHandleProps} className="cursor-grab text-[#6b7280]">☰</div>
                                                                    <div className="flex-1"><CompactAuthorCard author={a} /></div>
                                                                    <button type="button" onClick={() => handleRemoveAuthor(i)} className="text-red-600 text-sm">Remove</button>
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
                                    {!showInviteForm && (
                                        <div className="flex gap-2 items-center mt-2">
                                            <select onChange={(e) => { addAuthorById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                                <option value="">-- Add another author by email --</option>
                                                {allUsers.filter(u => !authors.some(a => a.id === u.id)).map(u => <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setShowInviteForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                                        </div>
                                    )}
                                    {showInviteForm && (
                                        <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                                            <h4 className="font-medium text-[#1f2937]">Invite New Author</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="First Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                                <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Last Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                            </div>
                                            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email Address*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                            <input type="text" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} placeholder="Organisation" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                            <select value={inviteCountry} onChange={e => setInviteCountry(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                                <option value="">Select Country</option>
                                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={handleInviteAuthor} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90">Add User</button>
                                                <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20 mt-4" />
                                    <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                                        <button onClick={handleUpdatePaper} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                                        <button onClick={handleSubmitForReview} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Submit</button>
                                        <button onClick={() => navigate('/journal/paper/'+paper.OriginalPaperId)} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                                    </div>
                                </>
                            )}
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
                        <iframe src={`${displayPdfUrl}?v=${cacheBustKey}`} className="border rounded-md flex-grow" width="100%" height="100%" />
                    </div>
                </div>
            </main>
        </div>
    );
}