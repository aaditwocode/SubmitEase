"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Small reusable author card (compact) ---
// This can be reused for Reviewers as well
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
        case "Pending Submission":
            badgeClasses += "bg-gray-100 text-gray-700";
            break;
        default: // Covers "Rejected" or other states
            badgeClasses += "bg-red-100 text-red-700";
            break;
    }
    return <span className={badgeClasses}>{status}</span>;
};

// --- Helper for review recommendation badge ---
const getRecommendationBadge = (recommendation) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    switch (recommendation) {
        case "Accepted":
            badgeClasses += "bg-green-100 text-green-700";
            break;
        case "Rejected":
            badgeClasses += "bg-red-100 text-red-700";
            break;
        default:
            badgeClasses += "bg-gray-100 text-gray-700";
            break;
    }
    return <span className={badgeClasses}>{recommendation || 'Pending Review'}</span>;
};


// --- Helper for date formatting ---
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (error) {
        return 'Invalid Date';
    }
};


export default function PaperDecision() {
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
    const [allUsers, setAllUsers] = useState([]);

    // --- Form State (initialized from fetched paper) ---
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [confId, setConfId] = useState(null);
    const [authors, setAuthors] = useState([]);

    // --- Reviewer Management State ---
    const [reviewers, setReviewers] = useState([]); // This will hold the LIST OF USER objects for the reviewers
    const [showInviteReviewerForm, setShowInviteReviewerForm] = useState(false);
    const [inviteReviewerFirstName, setInviteReviewerFirstName] = useState("");
    const [inviteReviewerLastName, setInviteReviewerLastName] = useState("");
    const [inviteReviewerEmail, setInviteReviewerEmail] = useState("");
    const [inviteReviewerOrg, setInviteReviewerOrg] = useState("");
    const [inviteReviewerCountry, setInviteReviewerCountry] = useState("");

    // --- Reviews List State ---
    const [reviews, setReviews] = useState([]); // This will hold the LIST OF REVIEW objects
    const [reviewSortBy, setReviewSortBy] = useState("submittedAt");
    const [reviewSortOrder, setReviewSortOrder] = useState("desc");

    const [hostDecision, setHostDecision] = useState("");

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

                // Populate form state
                setTitle(data.paper.Title);
                setAbstract(data.paper.Abstract);
                setKeywords(data.paper.Keywords.join(', '));
                setConfId(data.paper.Conference.id);

                // --- **FIXED**: Populate Reviews and Reviewers correctly ---
                const fetchedReviews = data.paper.Reviews || [];
                for (let rev of fetchedReviews) {
                    if (!rev.submittedAt) {
                        rev.Comment="N/A";
                        rev.Recommendation="Pending Review";
                    }
                }
                setReviews(fetchedReviews);

                // Extract the User object from each Review to build the reviewers list
                const fetchedReviewers = fetchedReviews.map(review => review.User).filter(Boolean);
                
                // Sort authors based on AuthorOrder
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

                // --- **FIXED**: Sort reviewers based on ReviewerOrder ---
                const reviewerOrder = data.paper.ReviewerOrder;
                if (reviewerOrder && reviewerOrder.length > 0 && fetchedReviewers.length > 0) {
                    const reviewerMap = new Map(fetchedReviewers.map(r => [r.id, r]));
                    const sortedReviewers = reviewerOrder.map(id => reviewerMap.get(id)).filter(Boolean);
                    const reviewersInOrderSet = new Set(reviewerOrder);
                    const reviewersNotInOrder = fetchedReviewers.filter(r => !reviewersInOrderSet.has(r.id));
                    setReviewers([...sortedReviewers, ...reviewersNotInOrder]);
                } else {
                    setReviewers(fetchedReviewers);
                }
                // --- End of reviewer sorting ---

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


    // --- Event Handlers ---
    const handlePortalClick = (portal) => navigate(`/${portal}`);
    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    // --- Reviewer Management Handlers ---
    const addReviewerById = (userId) => {
        if (!userId) return;
        const parsedId = parseInt(userId, 10);
        const userObj = allUsers.find(u => u.id === parsedId);
        if (!userObj || reviewers.some(r => r.id === userObj.id)) return;
        setReviewers(prev => [...prev, userObj]);
    };

    const handleRemoveReviewer = (indexToRemove) => {
        setReviewers(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const onReviewerDragEnd = (result) => {
        if (!result.destination) return;
        setReviewers(reorder(reviewers, result.source.index, result.destination.index));
    };

    // --- Invite Reviewer Handlers ---
    const handleInviteReviewer = async (e) => {
        e.preventDefault();
        if (!inviteReviewerEmail || !inviteReviewerFirstName || !inviteReviewerLastName) {
            alert("Please fill in at least first name, last name, and email.");
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteReviewerEmail,
                    firstname: inviteReviewerFirstName,
                    lastname: inviteReviewerLastName,
                    organisation: inviteReviewerOrg,
                    password: "default123", // Default password
                    role: ["Reviewer"], // Set role to Reviewer
                    expertise: [],
                    country: inviteReviewerCountry
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to invite user.");
            }
            const newUser = await response.json();
            setReviewers(prev => [...prev, newUser]); // Add to reviewers list in UI
            setAllUsers(prev => [...prev, newUser]); // Add to master user list
            setShowInviteReviewerForm(false);
            setInviteReviewerEmail(""); setInviteReviewerFirstName(""); setInviteReviewerLastName(""); setInviteReviewerOrg(""); setInviteReviewerCountry("");
            alert(`User ${newUser.email} invited and added as reviewer.`);
        } catch (error) {
            console.error("Invite failed:", error);
            alert(`Error: ${error.message}`);
        }
    };

    // --- Save Reviewer Assignment Handler ---
    const handleSaveReviewers = async () => {
        const reviewerIds = reviewers.map(r => r.id);
        const reviewerOrder = reviewers.map(r => r.id); // Save the order

        try {
            const response = await fetch(`http://localhost:3001/assign-reviewers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paperId: paperId,
                    reviewerIds: reviewerIds,
                    reviewerOrder: reviewerOrder, // Send the order to the backend
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to assign reviewers.');
            }

            const updatedPaper = await response.json();
            
            // --- **FIXED**: Update both reviews and reviewers from the response ---
            const freshReviews = updatedPaper.paper.Reviews || [];
            setReviews(freshReviews); // Update the reviews (stubs)

            // Re-build the reviewers list from the fresh review data
            const freshReviewers = freshReviews.map(review => review.User).filter(Boolean);
            
            // Sort the new reviewers list based on the order
            const newReviewerOrder = updatedPaper.paper.ReviewerOrder;
            if (newReviewerOrder && newReviewerOrder.length > 0 && freshReviewers.length > 0) {
                const reviewerMap = new Map(freshReviewers.map(r => [r.id, r]));
                const sortedReviewers = newReviewerOrder.map(id => reviewerMap.get(id)).filter(Boolean);
                const reviewersInOrderSet = new Set(newReviewerOrder);
                const reviewersNotInOrder = freshReviewers.filter(r => !reviewersInOrderSet.has(r.id));
                setReviewers([...sortedReviewers, ...reviewersNotInOrder]);
            } else {
                setReviewers(freshReviewers);
            }
            // --- End of fix ---

            alert('Reviewer assignments saved successfully!');

        } catch (error) {
            console.error('Failed to save reviewers:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // --- Reviews Table Sort Logic ---
    const handleReviewSort = (column) => {
        if (reviewSortBy === column) {
            setReviewSortOrder(reviewSortOrder === "asc" ? "desc" : "asc");
        } else {
            setReviewSortBy(column);
            setReviewSortOrder("asc");
        }
    };

    const sortedReviews = useMemo(() => {
        if (!reviews) return [];
        const sorted = [...reviews].sort((a, b) => {
            
            if (reviewSortBy === 'submittedAt') {
                // This logic is fine, but let's make it cleaner
                const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                if (dateA < dateB) return reviewSortOrder === "asc" ? -1 : 1;
                if (dateA > dateB) return reviewSortOrder === "asc" ? 1 : -1;
                return 0;
            }

            // --- THIS IS THE FIX ---
            // Default string comparison (for 'recommendation')
            // Treat null/undefined as an empty string "" to sort consistently
            let aValue, bValue;
            if (reviewSortBy === 'recommendation') {
                // Access the property with the correct case: 'Recommendation'
                aValue = a.Recommendation || ""; 
                bValue = b.Recommendation || "";
            } else {
                // Fallback for any other columns
                aValue = a[reviewSortBy] || "";
                bValue = b[reviewSortBy] || "";
            }

            if (aValue < bValue) return reviewSortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return reviewSortOrder === "asc" ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [reviews, reviewSortBy, reviewSortOrder]);

    const handleFinalSubmit = async () => {
        if (!window.confirm(`Are you sure you want to ${hostDecision} this paper? This action is final.`)) {
            return;
        }

        try {
            // ASSUMPTION: This endpoint exists
            const response = await fetch(`http://localhost:3001/paper-decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paperId: paperId,
                    status: hostDecision, // e.g., "Accepted" or "Rejected"
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to submit final decision.');
            }

            const updatedPaper = await response.json();
            
            // Update the paper state in the UI
            setPaper(updatedPaper.paper);
            // Also update the hostDecision state to match
            setHostDecision(updatedPaper.paper.Status);

            alert(`Paper has been ${updatedPaper.paper.Status}.`);

        } catch (error) {
            console.error('Failed to submit decision:', error);
            alert(`Error: ${error.message}`);
        }
    };


    // --- Render Logic ---
    if (loading) return <div className="p-8 text-center">Loading paper...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

    return (
        <div className="min-h-screen bg-[#ffffff]">
            {/* Header */}
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
                <a href="/conference/registration" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Create a Conference</a>
                <a href="/conference/manage" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Conferences</a>
                <a href="/ManageReviews" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Reviews</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">
                Return To Conference Portal
              </button>
              <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">
                Logout
              </button>
            </div>
          </div>
        </header>

            {/* --- Main Content --- */}
            <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* --- Top Section: Details (Scrollable) + PDF (Fixed) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* --- Left Column (Details, Authors) --- */}
                    <div className="lg:col-span-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-6 lg:h-[90vh] overflow-y-auto">

                        {/* --- Paper Details Form --- */}
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-[#1f2937]">Paper Details</h3>
                                {getStatusBadge(paper.Status)}
                            </div>
                            {/* ... (All form inputs: Title, Conference, Abstract, Keywords) ... */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                                    readOnly={true}
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

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={4}
                                    readOnly={true}
                                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] read-only:bg-gray-100 read-only:cursor-not-allowed" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords (comma-separated)</label>
                                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} required
                                    readOnly={true}
                                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-100 disabled:cursor-not-allowed" />
                            </div>

                            {/* --- Authors Section --- */}
                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors</label>
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        {authors.map((author) => <CompactAuthorCard key={author.id} author={author} />)}
                                    </div>
                                </div>
                            </div>

                        </form>
                        {/* --- End of Paper Details Form --- */}

                    </div>

                    {/* --- Right Column (PDF Viewer) --- */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full h-[90vh]">
                        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Document Viewer</h3>
                        <iframe
                            // Add a cache-busting query param based on submission time
                            src={`${paper.URL}?v=${new Date(paper.submittedAt).getTime()}`}
                            title="Paper PDF Viewer"
                            width="100%"
                            height="95%"
                            className="border rounded-md"
                        />
                    </div>
                </div>
                {/* --- End of Top Section --- */}


                {/* --- Bottom Section: Reviewers + Reviews --- */}
                <div className="mt-8 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-6">

                    {/* --- Assign Reviewers Section --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#1f2937]">Assign Reviewers</h3>

                        {/* --- Reviewer Drag-and-Drop List --- */}
                        <div className="space-y-2">
                            <DragDropContext onDragEnd={onReviewerDragEnd}>
                                <Droppable droppableId="reviewers-droppable">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                            {reviewers.map((reviewer, index) => (
                                                <Draggable key={reviewer?.id} draggableId={String(reviewer?.id)} index={index}>
                                                    {(prov) => (
                                                        <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                                            <div {...prov.dragHandleProps} className="cursor-grab select-none text-[#6b7280]">☰</div>
                                                            <div className="flex-1"><CompactAuthorCard author={reviewer} /></div>
                                                            <button type="button" onClick={() => handleRemoveReviewer(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
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

                        {/* --- Add/Invite Reviewer UI --- */}
                        {!showInviteReviewerForm && (
                            <div className="flex gap-2 items-center mt-2">
                                <select defaultValue="" onChange={(e) => { addReviewerById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                    <option value="" disabled>-- Add reviewer by email --</option>
                                    {allUsers
                                        .filter(u =>
                                            !reviewers.some(r => r && r.id === u.id) && // Filter out existing reviewers
                                            !authors.some(a => a && a.id === u.id)      // Filter out authors
                                        )
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>
                                        ))}
                                </select>
                                <button type="button" onClick={() => setShowInviteReviewerForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                            </div>
                        )}

                        {/* --- Invite New Reviewer Form --- */}
                        {showInviteReviewerForm && (
                            <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                                <h4 className="font-medium text-[#1f2937]">Invite New Reviewer</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={inviteReviewerFirstName} onChange={e => setInviteReviewerFirstName(e.target.value)} placeholder="First Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                    <input type="text" value={inviteReviewerLastName} onChange={e => setInviteReviewerLastName(e.target.value)} placeholder="Last Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                </div>
                                <input type="email" value={inviteReviewerEmail} onChange={e => setInviteReviewerEmail(e.target.value)} placeholder="Email Address*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                <input type="text" value={inviteReviewerOrg} onChange={e => setInviteReviewerOrg(e.target.value)} placeholder="Organisation" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                                <select
                                    id="reviewer-country"
                                    value={inviteReviewerCountry}
                                    onChange={e => setInviteReviewerCountry(e.target.value)}
                                    className={`w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] appearance-none focus:outline-none focus:ring-2 focus:ring-[#059669] ${inviteReviewerCountry ? "text-[#1f2937]" : "text-gray-400"}`}
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
                                    <button type="button" onClick={handleInviteReviewer} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90">Add User as Reviewer</button>
                                    <button type="button" onClick={() => setShowInviteReviewerForm(false)} className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* --- Save Reviewers Button --- */}
                        <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-4">
                            <button onClick={handleSaveReviewers} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Save Reviewer Assignments</button>
                        </div>

                    </div>
                    {/* --- END: Assign Reviewers Section --- */}


                    {/* --- Reviews List Section --- */}
                    <div className="space-y-4 pt-6 border-t border-[#e5e7eb]">
                        <h3 className="text-lg font-semibold text-[#1f2937]">Paper Reviews</h3>

                        {sortedReviews.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No reviews submitted yet.</p>
                        ) : (
                            
<div className="overflow-y-auto max-h-[60vh] bg-white rounded-lg shadow border border-[#e5e7eb]">
    {/* MODIFICATION: 
      - Added 'table-fixed' to force the table to obey 'w-full'
    */}
    <table className="w-full table-fixed">
        <thead>
            <tr className="border-b border-[#e5e7eb]">
                {/* MODIFICATION: 
                  - Removed 'whitespace-nowrap'
                  - Added explicit width 'w-[25%]'
                */}
                <th className="w-[25%] text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Reviewer</th>
                
                {/* MODIFICATION: 
                  - Removed 'whitespace-nowrap'
                  - Added explicit width 'w-[20%]'
                */}
                <th
                    className="w-[20%] text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                    onClick={() => handleReviewSort("submittedAt")}
                >
                    Submitted On {reviewSortBy === "submittedAt" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                </th>
                
                {/* MODIFICATION: 
                  - Added explicit width 'w-[40%]'
                */}
                <th className="w-[40%] text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Comment</th>
                
                {/* MODIFICATION: 
                  - Removed 'whitespace-nowrap'
                  - Added explicit width 'w-[15%]'
                */}
                <th
                    className="w-[15%] text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                    onClick={() => handleReviewSort("recommendation")}
                >
                    Recommendation {reviewSortBy === "recommendation" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                </th>
                
            </tr>
        </thead>
        <tbody>
            {sortedReviews.map((review, index) => {
                const reviewer = reviewers.find(r => r.id == review.ReviewerId);

                return (
                    <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                        
                        {/* Column 1: Reviewer Name */}
                        {/* MODIFICATION: Added 'break-words' to handle long emails */}
                        <td className="py-3 px-4 text-sm font-medium text-[#1f2937] align-top break-words">
                            {reviewer ? (
                                <>
                                    {reviewer.firstname} {reviewer.lastname}
                                    <span className="text-xs text-gray-500 block">({reviewer.email})</span>
                                </>
                            ) : (
                                `Reviewer ${index + 1}` // Fallback
                            )}
                        </td>
                        
                        {/* Column 2: Submitted Date */}
                        <td className="py-3 px-4 text-sm text-[#1f2937] align-top">
                            {formatDate(review.submittedAt)}
                        </td>

                        {/* Column 4: Reasons (Comment) */}
                        {/* MODIFICATION: 
                          - Added 'break-words' to force long strings to wrap
                        */}
                        <td className="py-3 px-4 text-sm text-[#1f2937] align-top whitespace-pre-wrap break-words">
                            {review.Comment || 'N/A'}
                        </td>

                        {/* Column 3: Decision (Recommendation) */}
                        <td className="py-3 px-4 align-top">
                            {getRecommendationBadge(review.Recommendation)}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
</div>
                        )}
                    </div>
                    {/* --- END: Reviews List Section --- */}
                    {paper.Status === 'Under Review' && (
                            <div className="pt-6 mt-6 border-t border-[#e5e7eb]">
                                <h4 className="text-lg font-semibold text-[#1f2937] mb-3">Final Decision</h4>
                                <div className="flex gap-4 items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="hostDecision" 
                                            value="Accepted"
                                            checked={hostDecision === 'Accepted'}
                                            onChange={(e) => setHostDecision(e.target.value)}
                                            className="form-radio h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                        />
                                        <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700">Accept Paper</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="hostDecision" 
                                            value="Rejected"
                                            checked={hostDecision === 'Rejected'}
                                            onChange={(e) => setHostDecision(e.target.value)}
                                            className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                        />
                                        <span className="px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700">Reject Paper</span>
                                    </label>
                                </div>
                                <button 
                                    onClick={handleFinalSubmit}
                                    className="mt-4 px-6 py-2 bg-[#059669] text-white font-medium rounded-md hover:bg-[#059669]/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={hostDecision === 'Under Review' || !hostDecision}
                                >
                                    Submit Final Decision
                                </button>
                            </div>
                        )}
                </div>
                {/* --- End of Bottom Section --- */}

            </main>
        </div>
    );
}
