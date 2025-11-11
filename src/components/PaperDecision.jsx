"use client";
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Small reusable author card (compact) ---
// This can be reused for Reviewers as well
const CompactAuthorCard = ({ author }) => {
    // ... (component unchanged)
    if (!author) return null;
    return (
        <div className="p-3 border rounded-md bg-white">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
            <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    );
};

// (drag-and-drop removed) 

// --- Helper for status badge ---
const getStatusBadge = (status) => {
    // ... (function unchanged)
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
    // ... (function unchanged)
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    switch (recommendation) {
        case "Strong Accept":
            badgeClasses += "bg-green-100 text-green-700";
            break;
        case "Reject":
            badgeClasses += "bg-red-100 text-red-700";
            break;
        case "Weak Accept":
            badgeClasses += "bg-yellow-100 text-yellow-700";
            break;
        default:
            badgeClasses += "bg-gray-100 text-gray-700";
            break;
    }
    return <span className={badgeClasses}>{recommendation || 'Pending Review'}</span>;
};


// --- Helper for date formatting ---
const formatDate = (dateString) => {
    // ... (function unchanged)
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
        // ... (countries list unchanged)
        "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
        "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
        "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
    ];
    // --- Page & Data State ---
    const [paper, setPaper] = useState(null); // Stores the fetched paper object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [confReviewers, setConfReviewers] = useState([]);

    // --- Form State (initialized from fetched paper) ---
    // ... (form state unchanged)
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [confId, setConfId] = useState(null);
    const [authors, setAuthors] = useState([]);

    // --- Reviewer Management State ---
    // ... (reviewer state unchanged)
    const [newReviewers, setNewReviewers] = useState([]);
    const [newInvitedReviewers, setNewInvitedReviewers] = useState([]);
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
    const [reviewSearchTerm, setReviewSearchTerm] = useState(""); // <-- NEW: Search state
    const [checkedReviewIds, setCheckedReviewIds] = useState(new Set()); // holds selected ReviewerIds (user ids)

    const [hostDecision, setHostDecision] = useState("");

    // --- 1. Main Data Fetching Effect (Get Paper Details) ---
    useEffect(() => {
        // ... (effect unchanged)
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

                // --- *FIXED*: Populate Reviews and Reviewers correctly ---
                const fetchedReviews = data.paper.Reviews || [];
                for (let rev of fetchedReviews) {
                    if (!rev.submittedAt) {
                        rev.Comment = "N/A";
                        rev.Recommendation = "N/A";
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

                setReviewers(fetchedReviewers);
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
        // ... (effect unchanged)
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
    useEffect(() => {
        // ... (effect unchanged)
        const fetchUsers = async () => {
            try {
                if (!confId) return;
                const response = await fetch('http://localhost:3001/conference/reviewers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confId: confId }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setConfReviewers(data.reviewers || []);
                }
            } catch (error) { console.error("Failed to fetch Reviewers:", error); }
        };
        fetchUsers();
    }, [confId]);


    // --- Event Handlers ---
    // ... (handlers unchanged)
    const handlePortalClick = (portal) => navigate(`/${portal}`);
    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    // --- Reviewer Management Handlers ---
    // ... (handlers unchanged)
    const addReviewerById = (userId) => {
        if (!userId) return;
        const parsedId = parseInt(userId, 10);
        const userObj = allUsers.find(u => u.id === parsedId);
        if (!userObj || reviewers.some(r => r.id === userObj.id)) return;
        setNewReviewers(prev => [...prev, userObj]);
    };

    const addInvitedReviewerById = (userId) => {
        if (!userId) return;
        const parsedId = parseInt(userId, 10);
        const userObj = allUsers.find(u => u.id === parsedId);
        if (!userObj || reviewers.some(r => r.id === userObj.id)) return;
        setNewInvitedReviewers(prev => [...prev, userObj]);
    };

    const handleRemoveReviewer = (indexToRemove) => {
        setNewReviewers(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleRemoveInvitedReviewer = (indexToRemove) => {
        setNewInvitedReviewers(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // drag-and-drop removed: lists are now static (no reorder)

    // --- Invite Reviewer Handlers ---
    const handleInviteReviewer = async (e) => {
        // ... (function unchanged)
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
                    password: "defaultPassword123", // Default password
                    firstname: inviteReviewerFirstName,
                    lastname: inviteReviewerLastName,
                    organisation: inviteReviewerOrg,
                    role: ["Reviewer"], // Set role to Reviewer
                    expertise: [],
                    country: inviteReviewerCountry,
                    sub: "Invitation for collaboration on SubmitEase",
                    msg: `Hello ${inviteReviewerFirstName} ${inviteReviewerLastName},

                You are invited to collaborate on SubmitEase. We've created a temporary account for you so you can be added as an author on submissions. Please sign in on Submitease using the email address (${inviteReviewerEmail}) and the temporary password provided below: defaultPassword123

                If you have any questions, reply to this email.

                Thanks,
                ${user?.firstname || 'SubmitEase Team'}`,
                    sendEmail: true,
                    invitedBy: user?.id || null,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to invite user.");
            }
            const newUser = await response.json();
            setNewInvitedReviewers(prev => [...prev, newUser]); // Add to reviewers list in UI
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
        // ... (function unchanged)
        const reviewerIds = newReviewers.map(r => r.id);

        try {
            const response = await fetch('http://localhost:3001/assign-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paperId: paperId,
                    reviewerIds: reviewerIds,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to assign reviewers.');
            }

            const updatedPaper = await response.json();

            // --- *FIXED*: Update both reviews and reviewers from the response ---
            const freshReviews = updatedPaper.paper.Reviews || [];
            setReviews(freshReviews); // Update the reviews (stubs)

            // Re-build the reviewers list from the fresh review data
            const freshReviewers = freshReviews.map(review => review.User).filter(Boolean);

            // Sort the new reviewers list based on the order
            setNewReviewers(freshReviewers);
            // --- End of fix ---

            alert('Reviewer Invited For Paper Successfully!');
            setNewReviewers([]);

        } catch (error) {
            console.error('Failed to save reviewers:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleSaveInvitedReviewers = async () => {
        // ... (function unchanged)
        const reviewerIds = newInvitedReviewers.map(r => r.id);

        try {
            const response = await fetch('http://localhost:3001/conference/invite-reviewer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confId: confId,
                    reviewerIds: reviewerIds,
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to invite reviewers.');
            }
            // --- End of fix ---

            alert('Reviewer Invited To Conference Successfully!');
            setNewInvitedReviewers([]);

        } catch (error) {
            console.error('Failed to save reviewers:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // --- Reviews Table Sort Logic ---
    const handleReviewSort = (column) => {
        // ... (function unchanged)
        if (reviewSortBy === column) {
            setReviewSortOrder(reviewSortOrder === "asc" ? "desc" : "asc");
        } else {
            setReviewSortBy(column);
            setReviewSortOrder("asc");
        }
    };

    // --- UPDATED: Combined filtering and sorting logic ---
    const filteredAndSortedReviews = useMemo(() => {
        if (!reviews) return [];

        // --- 1. NEW: Filtering ---
        const filtered = reviews.filter(review => {
            const lowerSearch = reviewSearchTerm.toLowerCase();
            if (!lowerSearch) return true; // Pass all if search is empty

            // Find the reviewer for this review
            // Note: Depends on 'reviewers' state
            const reviewer = reviewers.find(r => r.id == review.ReviewerId);
            const reviewerName = reviewer ? `${reviewer.firstname} ${reviewer.lastname}`.toLowerCase() : '';
            const reviewerEmail = reviewer ? reviewer.email.toLowerCase() : '';

            const comment = (review.Comment || '').toLowerCase();
            const recommendation = (review.Recommendation || '').toLowerCase();
            const status = (review.Status || '').toLowerCase();

            return (
                reviewerName.includes(lowerSearch) ||
                reviewerEmail.includes(lowerSearch) ||
                comment.includes(lowerSearch) ||
                recommendation.includes(lowerSearch) ||
                status.includes(lowerSearch)
            );
        });

        // --- 2. Sorting (on the 'filtered' list) ---
        const sorted = [...filtered].sort((a, b) => {

            let aValue, bValue;

            switch (reviewSortBy) {
                // ... (sorting switch case unchanged)
                case 'submittedAt':
                    aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                    bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                    break;
                case 'recommendation':
                    aValue = a.Recommendation || "";
                    bValue = b.Recommendation || "";
                    break;
                case 'status':
                    aValue = a.Status || "";
                    bValue = b.Status || "";
                    break;
                case 'score':
                    aValue = (a.scoreOriginality + a.scoreClarity + a.scoreRelevance + a.scoreSignificance + a.scoreSoundness) / 5 || 0;
                    bValue = (b.scoreOriginality + b.scoreClarity + b.scoreRelevance + b.scoreSignificance + b.scoreSoundness) / 5 || 0;
                    break;
                default:
                    // Default to submittedAt
                    aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                    bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                    break;
            }

            if (aValue < bValue) return reviewSortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return reviewSortOrder === "asc" ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [reviews, reviewSortBy, reviewSortOrder, reviewSearchTerm, reviewers]); // <-- NEW: Added reviewSearchTerm and reviewers

    const handleFinalSubmit = async () => {
        // ... (function unchanged)
        if (!window.confirm(`Are you sure you want to ${hostDecision} this paper? This action is final.`)) {
            return;
        }

        try {
            // ASSUMPTION: This endpoint exists
            const response = await fetch('http://localhost:3001/paper-decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paperId: paperId,
                    status: hostDecision,// e.g., "Accepted" or "Rejected"
                    total: authors,
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

    // --- New: Checkbox handlers for selecting reviewers in the table ---
    const toggleCheckedReviewId = (reviewerId) => {
        // Prevent toggling if the review for this reviewer is already Submitted
        const reviewObj = (reviews || []).find(r => r.ReviewerId === reviewerId);
        if (reviewObj && (reviewObj.Status || '').toLowerCase() === 'submitted') return;

        setCheckedReviewIds(prev => {
            const next = new Set(prev);
            if (next.has(reviewerId)) next.delete(reviewerId);
            else next.add(reviewerId);
            return next;
        });
    };

    const handleSelectAllVisible = () => {
        const visibleReviewerIds = Array.from(new Set(filteredAndSortedReviews
            .filter(r => r.Status !== 'Submitted')
            .map(r => r.ReviewerId)
            .filter(Boolean)));
        const allSelected = visibleReviewerIds.every(id => checkedReviewIds.has(id));
        if (allSelected) {
            // clear only those visible
            setCheckedReviewIds(prev => {
                const next = new Set(prev);
                visibleReviewerIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setCheckedReviewIds(prev => {
                const next = new Set(prev);
                visibleReviewerIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    // --- New: Remind selected reviewers via backend ---
    const handleRemindReviewers = async () => {
        const selectedIds = Array.from(checkedReviewIds);
        if (selectedIds.length === 0) return alert('Please select at least one reviewer to remind.');

        // Exclude any reviewers whose review status is 'Submitted'
        const selectableIds = selectedIds.filter(id => {
            const r = (reviews || []).find(rr => rr.ReviewerId === id);
            return !(r && (r.Status || '').toLowerCase() === 'submitted');
        });

        if (selectableIds.length === 0) return alert('No selectable reviewers (selected ones are already submitted).');

        // Partition into under-review and pending-invitation groups
        const underReviewIds = selectableIds.filter(id => {
            const r = (reviews || []).find(rr => rr.ReviewerId === id);
            return r && (r.Status || '').toLowerCase() === 'under review';
        });

        const pendingIds = selectableIds.filter(id => {
            const r = (reviews || []).find(rr => rr.ReviewerId === id);
            const isPendingReview = r && (r.Status || '').toLowerCase() === 'pending invitation';
            const isInInvited = (newInvitedReviewers || []).some(u => u.id === id);
            return isPendingReview || isInInvited;
        });

        try {
            let sentUnder = 0, sentPending = 0;

            if (underReviewIds.length > 0) {
                const resp = await fetch('http://localhost:3001/remind-reviewers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paperId: paperId, reviewerIds: underReviewIds }),
                });
                if (!resp.ok) {
                    const err = await resp.json();
                    throw new Error(err.message || 'Failed to send reminders to under-review reviewers.');
                }
                sentUnder = underReviewIds.length;
            }

            if (pendingIds.length > 0) {
                const resp2 = await fetch('http://localhost:3001/remind-invited-reviewers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paperId: paperId, reviewerIds: pendingIds }),
                });
                if (!resp2.ok) {
                    const err = await resp2.json();
                    throw new Error(err.message || 'Failed to send reminders to pending-invitation reviewers.');
                }
                sentPending = pendingIds.length;
            }

            alert(`Reminders Sent`);
        } catch (error) {
            console.error('Remind failed:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // --- New: Remove selected reviewers from paper ---
    const handleDeleteReviewers = async () => {
        const reviewerIds = Array.from(checkedReviewIds);
        console.log('Removing reviewers with IDs:', reviewerIds);
        if (reviewerIds.length === 0) return alert('Please select at least one reviewer to remove.');
        if (!window.confirm('Are you sure you want to remove the selected reviewer(s) from this paper? This cannot be undone.')) return;
        try {
            const response = await fetch('http://localhost:3001/remove-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId: paperId, reviewerIds }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to remove reviewers.');
            }
            const data = await response.json();
            const freshReviews = data.paper.Reviews || [];
            setReviews(freshReviews);
            const freshReviewers = freshReviews.map(review => review.User).filter(Boolean);
            setReviewers(freshReviewers);
            setCheckedReviewIds(new Set());
            alert('Selected reviewers removed from paper.');
        } catch (error) {
            console.error('Remove failed:', error);
            alert(`Error: ${error.message}`);
        }
    };


    // --- Render Logic ---
    if (loading) return <div className="p-8 text-center">Loading paper...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

    // Derived values used in render
    const visibleReviewerIds = Array.from(new Set(filteredAndSortedReviews.map(r => r.ReviewerId).filter(Boolean)));
    const allVisibleSelected = visibleReviewerIds.length > 0 && visibleReviewerIds.every(id => checkedReviewIds.has(id));

    return (
        <div className="min-h-screen bg-[#ffffff]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                {/* ... (header unchanged) ... */}
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
                            {/* ... (form unchanged) ... */}
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
                        {/* ... (iframe unchanged) ... */}
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
                        {/* ... (reviewer assignment section unchanged) ... */}
                        <h3 className="text-lg font-semibold text-[#1f2937]">Invite Reviewers To Conference</h3>

                        {/* --- Reviewer List --- */}
                        <div className="space-y-2">
                            {newInvitedReviewers.map((reviewer, index) => (
                                <div key={reviewer?.id} className="flex items-center gap-3 p-3 border rounded bg-white">
                                    <div className="flex-1"><CompactAuthorCard author={reviewer} /></div>
                                    <button type="button" onClick={() => handleRemoveInvitedReviewer(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                                </div>
                            ))}
                        </div>

                        {/* --- Add/Invite Reviewer UI --- */}
                        {!showInviteReviewerForm && (
                            <div className="flex gap-2 items-center mt-2">
                                <select defaultValue="" onChange={(e) => { addInvitedReviewerById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                    <option value="" disabled>-- Add reviewer by email --</option>
                                    {allUsers
                                        .filter(u =>
                                            !reviewers.some(r => r && r.id === u.id) && // Filter out existing reviewers
                                            !authors.some(a => a && a.id === u.id) &&
                                            !confReviewers.some(cr => cr && cr.id === u.id) &&
                                            !newInvitedReviewers.some(nr => nr && nr.id === u.id)
                                        )
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>
                                        ))}
                                </select>
                                <button type="button" onClick={() => setShowInviteReviewerForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite New User</button>
                            </div>
                        )}

                        {/* --- Invite New Reviewer Form --- */}
                        {showInviteReviewerForm && (
                            <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                                <h4 className="font-medium text-[#1f2937]">Invite New Reviewer To Conference</h4>
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
                        <div className="flex gap-3 pt-4">
                            <button onClick={handleSaveInvitedReviewers} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Invite Reviewers To Conference</button>
                        </div>

                    </div>
                    {/* --- END: Assign Reviewers Section --- */}

                    {/* --- Assign Reviewers Section --- */}
                    <div className="space-y-4 border-t border-[#e5e7eb] mt-4 mb-4 pt-4">
                        {/* ... (reviewer assignment section unchanged) ... */}
                        <h3 className="text-lg font-semibold text-[#1f2937] ">Assign Reviewers</h3>

                        {/* --- Reviewer Drag-and-Drop List --- */}
                        <div className="space-y-2">
                            {newReviewers.map((reviewer, index) => (
                                <div key={reviewer?.id} className="flex items-center gap-3 p-3 border rounded bg-white">
                                    <div className="flex-1"><CompactAuthorCard author={reviewer} /></div>
                                    <button type="button" onClick={() => handleRemoveReviewer(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                                </div>
                            ))}
                        </div>

                        {/* --- Add/Invite Reviewer UI --- */}
                        {!showInviteReviewerForm && (
                            <div className="flex gap-2 items-center mt-2">
                                <select defaultValue="" onChange={(e) => { addReviewerById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                                    <option value="" disabled>-- Add reviewer by email --</option>
                                    {confReviewers
                                        .filter(u =>
                                            !reviewers.some(r => r && r.id === u.id) && // Filter out existing reviewers
                                            !authors.some(a => a && a.id === u.id) &&
                                            !newReviewers.some(nr => nr && nr.id === u.id)
                                        )
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>
                                        ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
                        <button onClick={handleSaveReviewers} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Invite Reviewers For Paper</button>
                    </div>
                    {/* --- MODIFIED: Combined Reviews List Section --- */}
                    <div className="space-y-4 pt-6 border-t border-[#e5e7eb]">
                        <h3 className="text-lg font-semibold text-[#1f2937]">Paper Reviews & Scores</h3>

                        {/* --- NEW: Search Input + Controls (Remind / Delete) --- */}
                        <div className="p-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search reviews (Reviewer, Comment, Decision...)"
                                    value={reviewSearchTerm}
                                    onChange={(e) => setReviewSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleRemindReviewers} className={`px-3 py-2 text-sm font-medium rounded-md ${checkedReviewIds.size ? 'bg-[#059669] text-white hover:bg-[#059669]/90' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`} disabled={!checkedReviewIds.size}>Remind Reviewers</button>
                                <button onClick={handleDeleteReviewers} className={`px-3 py-2 text-sm font-medium rounded-md ${checkedReviewIds.size ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`} disabled={!checkedReviewIds.size}>Delete Reviewer(s)</button>
                            </div>
                        </div>

                        {/* --- UPDATED: Empty state and table data source --- */}
                        {filteredAndSortedReviews.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">
                                {reviewSearchTerm ? "No reviews match your search." : "No reviews submitted yet."}
                            </p>
                        ) : (

                            <div className="overflow-x-auto max-h-[80vh] bg-white rounded-lg shadow border border-[#e5e7eb]">
                                {/* MODIFIED: Table-fixed and new width classes */}
                                <table className="w-full table-fixed min-w-[1000px]">
                                    <thead>
                                        {/* ... (table header modified for checkboxes) ... */}
                                        <tr className="border-b border-[#e5e7eb]">
                                            <th className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280]"><input type="checkbox" onChange={handleSelectAllVisible} checked={allVisibleSelected} /></th>
                                            <th className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Reviewer</th>

                                            <th
                                                className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                                                onClick={() => handleReviewSort("submittedAt")}
                                            >
                                                Submitted {reviewSortBy === "submittedAt" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                                            </th>

                                            <th className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Comment</th>



                                            <th
                                                className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                                                onClick={() => handleReviewSort("status")}
                                            >
                                                Review Status {reviewSortBy === "status" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                                            </th>

                                            {/* --- NEW: Score Headers --- */}
                                            <th
                                                className=" text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                                                onClick={() => handleReviewSort("score")}
                                            >
                                                Score {reviewSortBy === "score" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className=" text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                                                onClick={() => handleReviewSort("recommendation")}
                                            >
                                                Decision {reviewSortBy === "recommendation" && (reviewSortOrder === "asc" ? "↑" : "↓")}
                                            </th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* --- UPDATED: Map over filteredAndSortedReviews --- */}
                                        {filteredAndSortedReviews.map((review, index) => {
                                            const reviewer = review.User || reviewers.find(r => r.id == review.ReviewerId);
                                            const isPending = !review.submittedAt;

                                            return (
                                                // ... (table row unchanged) ...
                                                <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">

                                                    {/* Column 0: Checkbox */}
                                                    <td className="py-3 px-4 text-sm align-top">
                                                        <input type="checkbox" disabled={review.Status==="Submitted"} checked={checkedReviewIds.has(review.ReviewerId)} onChange={() => toggleCheckedReviewId(review.ReviewerId)} />
                                                    </td>

                                                    {/* Column 1: Reviewer Name */}
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

                                                    {/* Column 3: Comment */}
                                                    <td className="py-3 px-4 text-sm text-[#1f2937] align-top whitespace-pre-wrap break-words">
                                                        {review.Comment || 'N/A'}
                                                    </td>


                                                    <td className="py-3 px-4 text-sm text-[#1f2937] align-top whitespace-pre-wrap break-words">
                                                        {review.Status || 'N/A'}
                                                    </td>
                                                    {/* --- NEW: Score Cells --- */}
                                                    <td className="py-3 px-4 text-sm text-[#1f2937] align-top text-center font-medium">
                                                        {isPending ? '—' : ((review.scoreOriginality + review.scoreClarity + review.scoreRelevance + review.scoreSignificance + review.scoreSoundness) / 5 || '—')}
                                                    </td>
                                                    {/* Column 4: Recommendation */}
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
                    {/* --- END: Combined Reviews List Section --- */}

                    {/* --- REMOVED: Second score table is gone --- */}

                    {/* --- Final Decision Section --- */}
                    {paper.Status === 'Under Review' && (
                        // ... (section unchanged) ...
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
                    {/* --- END: Final Decision Section --- */}

                </div>
                {/* --- End of Bottom Section --- */}

            </main>
        </div>
    );
}