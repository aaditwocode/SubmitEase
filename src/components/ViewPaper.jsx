"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect,useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams
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
  switch (status) {
    case "Accepted":
      badgeClasses += "bg-green-100 text-green-700";
      break;
    case "Under Review":
      badgeClasses += "bg-yellow-100 text-yellow-700";
      break;
    default:
      badgeClasses += "bg-red-100 text-red-700";
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};


export default function ViewPaper() {
  const { user, setUser, loginStatus, setloginStatus } = useUserData();
  const navigate = useNavigate();
  const { paperId } = useParams(); // Get paperId from URL
  const countries = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];
  // --- Page & Data State ---
  const [paper, setPaper] = useState(null); // Stores the fetched paper object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // --- Form State (initialized from fetched paper) ---
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [confId, setConfId] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [pdfFile, setPdfFile] = useState(null); // For uploading a *new* file
  const [trackId, setTrackId] = useState(""); // <-- NEW: State for Track

  // --- Invite Form State ---
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrg, setInviteOrg] = useState("");
  const [inviteCountry, setInviteCountry] = useState("");
  
  // --- Final Submission File State ---
  const [copyrightFile, setCopyrightFile] = useState(null);
  const [finalPaperFile, setFinalPaperFile] = useState(null);
  const [paySlipFile, setPaySlipFile] = useState(null);

  // --- State for file previews (Object URLs) ---
  const [copyrightPreview, setCopyrightPreview] = useState(null);
  const [finalPaperPreview, setFinalPaperPreview] = useState(null);
  const [paySlipPreview, setPaySlipPreview] = useState(null);
  
  // --- 1. Main Data Fetching Effect (Get Paper Details) ---
  useEffect(() => {
    if (!paperId) {
        setLoading(false);
        setError("No paper ID found in the URL.");
        return;
    }
    const fetchPaper = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/getpaperbyid/${paperId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch paper details.");
        }
        const data = await response.json();
        setPaper(data.paper);
        
        // Set edit status
        const editable = data.paper.Status === 'Pending Submission';
        setIsEditable(editable);
        
        // Populate form state
        setTitle(data.paper.Title);
        setAbstract(data.paper.Abstract);
        setKeywords(data.paper.Keywords.join(', '));
        setConfId(data.paper.Conference.id);
        setTrackId(data.paper.TrackId || ""); 
        
        // --- Sort authors based on AuthorOrder ---
        const fetchedAuthors = data.paper.Authors || [];
        const authorOrder = data.paper.AuthorOrder;

        if (authorOrder && authorOrder.length > 0 && fetchedAuthors.length > 0) {
          const authorMap = new Map(fetchedAuthors.map(author => [author.id, author]));
          const sortedAuthors = authorOrder.map(id => authorMap.get(id)).filter(Boolean);
          const authorsInOrderSet = new Set(authorOrder);
          const authorsNotInOrder = fetchedAuthors.filter(author => !authorsInOrderSet.has(author.id));
          setAuthors([...sortedAuthors, ...authorsNotInOrder]);
        } else {
          setAuthors(fetchedAuthors);
        }
        // --- End of author sorting ---
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [paperId]);

  // --- 2. Secondary Data Fetching (Users) ---
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

  // --- 3. Effect for cleaning up Object URLs ---
  useEffect(() => {
    // Cleanup object URLs on component unmount
    return () => {
      if (copyrightPreview) URL.revokeObjectURL(copyrightPreview);
      if (finalPaperPreview) URL.revokeObjectURL(finalPaperPreview);
      if (paySlipPreview) URL.revokeObjectURL(paySlipPreview);
    };
  }, [copyrightPreview, finalPaperPreview, paySlipPreview]);


  // --- Event Handlers ---
  const handlePortalClick = (portal) => navigate(`/${portal}`);
  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- Author Management Handlers ---
  const addAuthorById = (userId) => {
    if (!userId) return;
    const parsedId = parseInt(userId, 10);
    const userObj = allUsers.find(u => u.id === parsedId);
    if (!userObj || authors.some(a => a.id === userObj.id)) return;
    setAuthors(prev => [...prev, userObj]);
  };

  const handleRemoveAuthor = (indexToRemove) => {
    if (authors.length <= 1) {
      alert('At least one author is required.');
      return;
    }
    setAuthors(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setAuthors(reorder(authors, result.source.index, result.destination.index));
  };

  // --- Invite Author Handlers ---
  const handleInviteAuthor = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
        alert("Please fill in at least first name, last name, and email.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: inviteEmail,
                firstname: inviteFirstName,
                lastname: inviteLastName,
                organisation: inviteOrg,
                password: "default123", // Default password
                role: ["Author"],
                expertise: [],
                country:inviteCountry
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to invite user.");
        }

        const newUser = await response.json(); 
        setAuthors(prev => [...prev, newUser]); 
        setAllUsers(prev => [...prev, newUser]); 
        
        setShowInviteForm(false);
        setInviteEmail("");
        setInviteFirstName("");
        setInviteLastName("");
        setInviteOrg("");
        setInviteCountry("");

        alert(`User ${newUser.email} invited and added as author.`);

    } catch (error) {
        console.error("Invite failed:", error);
        alert(`Error: ${error.message}`);
    }
  };

  // --- Paper Update/Submit Handlers ---
  const handleUpdatePaper = async (e) => {
    e.preventDefault();

    // Validation for track
    if (paper?.Conference?.Tracks && paper.Conference.Tracks.length > 0 && !trackId) {
      alert("Please select a track for this submission.");
      return;
    }

    const formData = new FormData();
    formData.append('paperId', paperId); 
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
    formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
    formData.append('confId', confId);
    
    if (trackId) { 
      formData.append('trackId', trackId);
    }
    
    if (pdfFile) {
        formData.append('pdfFile', pdfFile);
    }

    try {
        const response = await fetch(`http://localhost:3001/editpaper`, {
            method:'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to update paper.');
        }

        const updatedPaper = await response.json();
        setPaper(updatedPaper.paper);
        setAuthors(updatedPaper.paper.Authors || []);
        setKeywords(updatedPaper.paper.Keywords.join(', '));
        setTrackId(updatedPaper.paper.TrackId || ""); 
        
        alert('Paper saved successfully!');
        setPdfFile(null); 
    } catch (error) {
        console.error('Update failed:', error);
        alert(`Error: ${error.message}`);
    }
    navigate('/conference');
  };

  const handleSubmitForReview = async (e) => {
    e.preventDefault();

    // Validation for track
    if (paper?.Conference?.Tracks && paper.Conference.Tracks.length > 0 && !trackId) {
      alert("Please select a track for this submission.");
      return;
    }

    if (!window.confirm("Are you sure you want to submit this paper? You will no longer be able to edit it.")) {
        return;
    }
    const formData = new FormData();
    formData.append('paperId', paperId); 
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
    formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
    formData.append('confId', confId);
    
    if (trackId) { 
      formData.append('trackId', trackId);
    }

    if (pdfFile) {
        formData.append('pdfFile', pdfFile);
    }
    try {
        
        const response = await fetch(`http://localhost:3001/submitpaper`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to submit paper.');
        }

        const submittedPaper = await response.json();
        setPaper(submittedPaper.paper);
        setIsEditable(false); 
        alert('Paper submitted for review!');

    } catch (error) {
        console.error('Submit failed:', error);
        alert(`Error: ${error.message}`);
    }
    navigate('/conference');
  };

  // --- Final Submission Handler ---
  const handleFinalSubmission = async (e) => {
    e.preventDefault();
    // This logic allows uploading 1, 2, or all 3 files at once.
    if (!copyrightFile && !finalPaperFile && !paySlipFile) {
      alert("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('paperId', paperId);
    
    if (copyrightFile) {
      formData.append('copyrightFile', copyrightFile);
    }
    if (finalPaperFile) {
      formData.append('finalPaperFile', finalPaperFile);
    }
    if (paySlipFile) {
      formData.append('paySlipFile', paySlipFile);
    }

    try {
      const response = await fetch(`http://localhost:3001/submitfinalfiles`, { // Assuming this endpoint
          method:'POST',
          body: formData,
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to upload final files.');
      }

      const updatedPaper = await response.json();
      setPaper(updatedPaper.paper); // Refresh paper data to get new URLs
      
      // Clear file inputs
      setCopyrightFile(null);
      setFinalPaperFile(null);
      setPaySlipFile(null);

      // Clear previews
      setCopyrightPreview(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFinalPaperPreview(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPaySlipPreview(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      
      alert('Final files uploaded successfully!');

    } catch (error) {
        console.error('Final upload failed:', error);
        alert(`Error: ${error.message}`);
    }
  };

  // --- Helper for creating file previews ---
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    setFile(file);
    
    // Clear old preview
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    // Create new preview
    if (file && file.type === "application/pdf") {
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- Render Logic ---
  if (loading) return <div className="p-8 text-center">Loading paper...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

  const fileInputStyles = "w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20";

  // Determine which PDF to show in the main viewer
  const displayPdfUrl = paper.FinalPaperURL || paper.URL;
  // Use updatedAt to cache-bust if it exists, otherwise submittedAt
  const cacheBustKey = new Date(paper.updatedAt || paper.submittedAt).getTime();

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
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <Header user={user} />
      {/* --- Main Content: 2-Column Layout --- */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          
          <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-4 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#1f2937]">Paper Details</h3>
              {getStatusBadge(!paper.isFinal && paper.Status!="Pending Submission"?"Under Review":paper.Status)}
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required 
                       disabled={!isEditable} 
                       className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Conference</label>
                <select 
                  value={confId || ""} 
                  onChange={(e) => setConfId(e.target.value)} 
                  required 
                  disabled={true} 
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {paper && paper.Conference ? (
                    <option value={paper.Conference.id}>
                      {paper.Conference.name}
                    </option>
                  ) : (
                    <option value="">Loading conference...</option>
                  )}
                </select>
              </div>

              {/* --- Track Selection --- */}
              {paper?.Conference?.Tracks && paper.Conference.Tracks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">
                    Track {isEditable && '*'}
                  </label>
                  <select 
                    value={trackId} 
                    onChange={(e) => setTrackId(e.target.value)} 
                    required={isEditable}
                    disabled={!isEditable} 
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a track</option>
                    {paper.Conference.Tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.Name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* --- END: Track Selection --- */}


              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={4} 
                          readOnly={!isEditable} 
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] read-only:bg-gray-100 read-only:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords (comma-separated)</label>
                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} required 
                       disabled={!isEditable} 
                       className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100 disabled:cursor-not-allowed" />
              </div>

              {/* --- Authors Section --- */}
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors</label>
                <div className="space-y-2">
                  {isEditable ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="authors-droppable">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {authors.map((author, index) => (
                              <Draggable key={author?.id} draggableId={String(author?.id)} index={index}>
                                {(prov) => (
                                  <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                    <div {...prov.dragHandleProps} className="cursor-grab select-none text-[#6b7280]">☰</div>
                                    <div className="flex-1"><CompactAuthorCard author={author} /></div>
                                    <button type="button" onClick={() => handleRemoveAuthor(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
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
                    <div className="space-y-2">
                      {authors.map((author) => <CompactAuthorCard key={author.id} author={author} />)}
                    </div>
                  )}

                  {/* --- Add/Invite Author UI (Only if editable) --- */}
                  {isEditable && !showInviteForm && (
                    <div className="flex gap-2 items-center mt-2">
                      <select defaultValue="" onChange={(e) => { addAuthorById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                        <option value="" disabled>-- Add another author by email --</option>
                        {allUsers
                          .filter(u => !authors.some(a => a && a.id === u.id))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>
                          ))}
                      </select>
                      <button type="button" onClick={() => setShowInviteForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                    </div>
                  )}

                  {/* --- Invite New Author Form --- */}
                  {isEditable && showInviteForm && (
                    <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                       <h4 className="font-medium text-[#1f2937]">Invite New Author</h4>
                       <div className="grid grid-cols-2 gap-3">
                         <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="First Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                         <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Last Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                       </div>
                       <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email Address*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                       <input type="text" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} placeholder="Organisation" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                        <select
                            id="country"
                            value={inviteCountry}
                            onChange={e => setInviteCountry(e.target.value)}
                            className={`w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] appearance-none focus:outline-none focus:ring-2 focus:ring-[#059669] ${inviteCountry ? "text-[#1f2937]" : "text-gray-400"
                            }`}
                            required
                        >
                            <option value="" >Select a country</option>
                            {countries.map((country) => (
                            <option key={country} value={country}>
                                {country}
                            </option>
                            ))}
                        </select>
                       <div className="flex gap-3">
                         <button type="button" onClick={handleInviteAuthor} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90">Add User as Author</button>
                         <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* --- File Upload (Only if editable) --- */}
              {isEditable && (
                <div>
                  <label className="block text-sm font-medium text-[#1f2937] mb-1">Upload New Version (PDF)</label>
                  <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" className={fileInputStyles}  />
                  <p className="text-xs text-gray-500 mt-1">If you select a new file, it will replace the current one when you save.</p>
                </div>
              )}

              {/* --- Action Buttons (Only if editable) --- */}
              {isEditable && (
                <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                  <button onClick={handleUpdatePaper} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
                  <button onClick={handleSubmitForReview} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Submit for Review</button>
                  <button onClick={() => navigate('/conference')} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                </div>
              )}
            </form>

            {/* --- UPDATED: FINAL SUBMISSION SECTION --- */}
            {paper.isFinal && paper.Status === 'Accepted' && (
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Final Submission Files</h3>
                <form className="space-y-4" onSubmit={handleFinalSubmission}>
                   {/* Final Paper */}
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Final Paper (PDF)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, setFinalPaperFile, setFinalPaperPreview)} 
                        accept=".pdf" 
                        disabled={paper.FinalPaperURL}
                        className={`${fileInputStyles} flex-1`} 
                      />
                      {finalPaperPreview && (
                        <a href={finalPaperPreview} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex-shrink-0">
                          View
                        </a>
                      )}
                      {!finalPaperPreview && paper.FinalPaperURL && (
                         <a href={paper.FinalPaperURL} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
                          View
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Copyright Form */}
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Copyright Form (PDF)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, setCopyrightFile, setCopyrightPreview)} 
                        accept=".pdf" 
                        disabled={paper.CopyrightFormURL}
                        className={`${fileInputStyles} flex-1`} 
                      />
                      {/* Show button for NEWLY selected file */}
                      {copyrightPreview && (
                        <a href={copyrightPreview} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex-shrink-0">
                          View
                        </a>
                      )}
                      {/* Show button for EXISTING uploaded file (if no new one is staged) */}
                      {!copyrightPreview && paper.CopyrightURL && (
                         <a href={paper.CopyrightURL} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
                          View
                        </a>
                      )}
                    </div>
                  </div>

                 

                  {/* Pay Slip */}
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Payment Slip (PDF)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, setPaySlipFile, setPaySlipPreview)} 
                        accept=".pdf" 
                        disabled={paper.PaySlipURL}
                        className={`${fileInputStyles} flex-1`} 
                      />
                      {paySlipPreview && (
                        <a href={paySlipPreview} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex-shrink-0">
                          View
                        </a>
                      )}
                      {!paySlipPreview && paper.PaySlipURL && (
                         <a href={paper.PaySlipURL} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
                          View
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <button type="submit" className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Upload Final Files
                  </button>
                </form>
              </div>
            )}
            {/* --- END: FINAL SUBMISSION --- */}

          </div>

          {/* --- Main Document Viewer --- */}
          <div className="lg:col-span-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-[#1f2937]">Document Viewer</h3>
              <a 
                href={`${displayPdfUrl}?v=${cacheBustKey}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                Open in New Tab ↗
              </a>
            </div>
            <iframe 
              src={`${displayPdfUrl}?v=${cacheBustKey}`} 
              title="Paper PDF Viewer" 
              width="100%" 
              height="100%"
              className="border rounded-md flex-grow"
            />
          </div>
          {/* --- END: Main Document Viewer --- */}
        </div>
      </main>
    </div>
  );
}