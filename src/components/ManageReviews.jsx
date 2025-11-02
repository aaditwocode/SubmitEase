"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions ---

const formatDate = (dateString) => {
    // ... (function unchanged)
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const getRecommendationBadge = (recommendation) => {
    // ... (function unchanged)
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    switch (recommendation) {
        case "Strong Accept":
            badgeClasses += "bg-green-100 text-green-700";
            break;
        case "Weak Accept":
            badgeClasses += "bg-yellow-100 text-yellow-700";
            break;
        case "Rejected":
            badgeClasses += "bg-red-100 text-red-700";
            break;
        default:
            badgeClasses += "bg-gray-100 text-gray-700";
            return <span className={badgeClasses}>Pending</span>;
    }
    return <span className={badgeClasses}>{recommendation}</span>;
};


// --- Table Component for Submitted Reviews ---
const ReviewList = ({ reviews, navigate }) => {
    const [sortBy, setSortBy] = useState("reviewSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState(""); // <-- NEW

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedReviews = useMemo(() => { // <-- RENAMED
        if (!reviews) return [];

        // --- NEW: Filter ---
        const filtered = (reviews || []).filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Conference?.name?.toLowerCase().includes(lowerSearch) ||
                review.Recommendation?.toLowerCase().includes(lowerSearch)
            );
        });

        // --- Sort ---
        const getSortValue = (review, key) => {
            // ... (function unchanged)
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'confName': return review.Paper?.Conference?.name || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                case 'reviewSubmittedAt': return review.submittedAt ? new Date(review.submittedAt).getTime() : 0;
                case 'recommendation': return review.Recommendation || '';
                default: return '';
            }
        };
        return [...filtered].sort((a, b) => { // <-- Use filtered
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm]); // <-- NEW: Added searchTerm

    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-4">You have not submitted any reviews yet.</p>;
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            {/* --- NEW: Search Input --- */}
            <div className="p-4">
                <input
                    type="text"
                    placeholder="Search submitted reviews (ID, Title, Conference, Recommendation...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
            </div>
            <table className="w-full">
                <thead>
                    {/* ... (thead unchanged) ... */}
                    <tr className="border-b border-[#e5e7eb]">
                        <th onClick={() => handleSort("paperId")} className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperTitle")} className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperSubmittedAt")} className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Submitted {sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("recommendation")} className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            My Recommendation {sortBy === "recommendation" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("reviewSubmittedAt")} className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Review Submitted {sortBy === "reviewSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* --- NEW: Use filteredAndSortedReviews and add empty state --- */}
                    {filteredAndSortedReviews.length > 0 ? (
                        filteredAndSortedReviews.map((review) => (
                            <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-medium text-[#1f2937] truncate">{review.Paper?.id}</td>
                                <td className="py-3 px-4">
                                    <div>
                                        <p className="text-sm font-medium text-[#1f2937] truncate">{review.Paper?.Title}</p>
                                        <p className="text-xs text-[#6b7280] truncate">{review.Paper?.Conference?.name}</p>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.Paper?.submittedAt)}</td>
                                <td className="py-3 px-4">{getRecommendationBadge(review.Recommendation)}</td>
                                <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.submittedAt)}</td>
                                <td className="py-3 px-4">
                                    {/* CHANGED: Added flex and justify-center */}
                                    <div className="flex justify">
                                        <button onClick={() => navigate(`/ReviewPaper/${review.Paper.id}`)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center text-gray-500 py-4">
                                {searchTerm ? "No reviews match your search." : "You have not submitted any reviews yet."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


// --- Table Component for Pending Invitations ---
const PendingInvitationList = ({ reviews, onAccept, onDecline }) => {
    const [sortBy, setSortBy] = useState("paperSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc"); 
    const [searchTerm, setSearchTerm] = useState(""); // <-- NEW

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedInvitations = useMemo(() => { // <-- RENAMED
        if (!reviews) return [];

        // --- NEW: Filter ---
        const filtered = (reviews || []).filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            const authorString = review.Paper?.Authors
                .map(a => `${a.firstname} ${a.lastname}`.toLowerCase())
                .join(' ');
            
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Conference?.name?.toLowerCase().includes(lowerSearch) ||
                (!review.isBlind && authorString.includes(lowerSearch))
            );
        });

        // --- Sort ---
        const getSortValue = (review, key) => {
            // ... (function unchanged)
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                default: return '';
            }
        };
        return [...filtered].sort((a, b) => { // <-- Use filtered
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm]); // <-- NEW: Added searchTerm
    
    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-4">You have no pending invitations.</p>;
    }

    return (
        <div className="overflow-x-auto">
            {/* --- NEW: Search Input --- */}
            <div className="p-4 border-b border-[#e5e7eb]">
                <input
                    type="text"
                    placeholder="Search invitations (ID, Title, Conference, Authors...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
            </div>
            {/* CHANGED: Added table-fixed */}
            <table className="w-full table-fixed">
                <thead>
                    {/* ... (thead unchanged) ... */}
                    <tr className="border-b border-[#e5e7eb]">
                        <th onClick={() => handleSort("paperId")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperTitle")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        {/* CHANGED: Added w-[25%] */}
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Authors
                        </th>
                        {/* CHANGED: Added w-[20%] */}
                        <th onClick={() => handleSort("paperSubmittedAt")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Submitted At{sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        {/* CHANGED: Added w-[20%] and text-center */}
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* --- NEW: Use filteredAndSortedInvitations and add empty state --- */}
                    {filteredAndSortedInvitations.length > 0 ? (
                        filteredAndSortedInvitations.map((review) => {
                            const authorString = review.Paper?.Authors.length
                                ? review.Paper.Authors.map(a => `${a.firstname} ${a.lastname}`).join(", ")
                                : "N/A";

                            return (
                                <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                                    <td className="py-3 px-4 text-center text-sm font-medium text-[#1f2937] truncate">{review.Paper?.id}</td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="text-center text-sm font-medium text-[#1f2937] truncate">{review.Paper?.Title}</p>
                                            <p className="text-center text-xs text-[#6b7280] truncate">{review.Paper?.Conference?.name}</p>
                                        </div>
                                    </td>
                                    <td className="text-center py-3 px-4 text-sm text-[#1f2937] truncate">
                                        {review.isBlind ? "Anonymous Authors" : authorString}
                                    </td>
                                    <td className="text-center py-3 px-4 text-sm text-[#1f2937]">
                                        {formatDate(review.Paper?.submittedAt)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {/* CHANGED: Changed justify-end to justify-center */}
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => onAccept(review.id)}
                                                className="flex justify-center w-24 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap text-sm">
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => onDecline(review.id)}
                                                className="flex justify-center w-24 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors whitespace-nowrap text-sm">
                                                Decline
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center text-gray-500 py-4">
                                {searchTerm ? "No invitations match your search." : "You have no pending invitations."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


// --- Table Component for Pending Reviews ---
const PendingReviewList = ({ reviews, navigate }) => {
    const [sortBy, setSortBy] = useState("paperSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState(""); // <-- NEW

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedPendingReviews = useMemo(() => { // <-- RENAMED
        if (!reviews) return [];

        // --- NEW: Filter ---
        const filtered = (reviews || []).filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            const authorString = review.Paper?.Authors
                .map(a => `${a.firstname} ${a.lastname}`.toLowerCase())
                .join(' ');
            
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Conference?.name?.toLowerCase().includes(lowerSearch) ||
                (!review.isBlind && authorString.includes(lowerSearch))
            );
        });

        // --- Sort ---
        const getSortValue = (review, key) => {
            // ... (function unchanged)
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                default: return '';
            }
        };
        return [...filtered].sort((a, b) => { // <-- Use filtered
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm]); // <-- NEW: Added searchTerm
    
    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-4">You have no pending reviews. Great job!</p>;
    }

    return (
        <div className="overflow-x-auto">
            {/* --- NEW: Search Input --- */}
            <div className="p-4 border-b border-[#e5e7eb]">
                <input
                    type="text"
                    placeholder="Search pending reviews (ID, Title, Conference, Authors...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
            </div>
            {/* CHANGED: Added table-fixed */}
            <table className="w-full">
                <thead>
                    {/* ... (thead unchanged) ... */}
                    <tr className="border-b border-[#e5e7eb]">
                        <th onClick={() => handleSort("paperId")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperTitle")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        {/* CHANGED: Added w-[25%] */}
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Authors
                        </th>
                        {/* CHANGED: Added w-[20%] */}
                        <th onClick={() => handleSort("paperSubmittedAt")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Submitted On{sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* --- NEW: Use filteredAndSortedPendingReviews and add empty state --- */}
                    {filteredAndSortedPendingReviews.length > 0 ? (
                        filteredAndSortedPendingReviews.map((review) => {
                            const authorString = review.Paper?.Authors.length
                                ? review.Paper.Authors.map(a => `${a.firstname} ${a.lastname}`).join(", ")
                                : "N/A";
                            return (
                            <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                                <td className="py-3 px-4 text-center text-sm font-medium text-[#1f2937] truncate">{review.Paper?.id}</td>
                                <td className="py-3 px-4">
                                    <div>
                                        <p className="text-center text-sm font-medium text-[#1f2937] truncate">{review.Paper?.Title}</p>
                                        <p className="text-center text-xs text-[#6b7280] truncate">{review.Paper?.Conference?.name}</p>
                                    </div>
                                </td>
                                <td className="text-center py-3 px-4 text-sm text-[#1f2937] truncate">
                                    {review.isBlind ? "Anonymous Authors" : authorString}
                                </td>
                                <td className="text-center py-3 px-4 text-sm text-[#1f2937]">
                                    {formatDate(review.Paper?.submittedAt)}
                                </td>
                                <td className="py-3 px-4">
                                    {/* CHANGED: Changed justify-end to justify-center */}
                                    <div className="flex justify-center">
                                        <button onClick={() => navigate(`/ReviewPaper/${review.Paper.id}`)} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap text-sm">
                                            Review Now
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                        })
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center text-gray-500 py-4">
                                {searchTerm ? "No pending reviews match your search." : "You have no pending reviews. Great job!"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Page Component ---
export default function ManageReviews() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const [allReviews, setAllReviews] =useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handlePortalClick = (portal) => navigate(`/${portal}`);
    const handleLogout = () => { setUser(null); setloginStatus(false); navigate("/home"); };
    
    // ... (handleAccept function unchanged) ...
    const handleAccept = async (reviewId) => {
        let originalReviews = []; 
        setAllReviews(prevReviews => {
            originalReviews = prevReviews; 
            return prevReviews.map(review =>
                review.id === reviewId
                    ? { ...review, Status: 'Accepted' } 
                    : review
            );
        });

        try {
            const response = await fetch('http://localhost:3001/reviewInvitationResponse', {
                method:"POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId, response: 'Accepted' }), 
            });
            if (!response.ok) {
                throw new Error(`Server failed with status: ${response.status}`);
            }
        } catch(err) {
            console.error("Failed to accept invitation:", err);
            alert("Error: Could not accept the invitation. Please try again.");
            setAllReviews(originalReviews); 
        }
    };

    // ... (handleDecline function unchanged) ...
    const handleDecline = async (reviewId) => {
        let originalReviews = []; 
        setAllReviews(prevReviews => {
            originalReviews = prevReviews;
            return prevReviews.filter(review => review.id !== reviewId);
        });

        try {
            const response = await fetch('http://localhost:3001/reviewInvitationResponse', {
                method:"POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId, response: 'Declined' }), 
            });
            if (!response.ok) {
                throw new Error(`Server failed with status: ${response.status}`);
            }
        } catch(err) {
            console.error("Failed to decline invitation:", err);
            alert("Error: Could not decline the invitation. Please try again.");
            setAllReviews(originalReviews); 
        }
    };
    
    // ... (useEffect unchanged) ...
    useEffect(() => {
        if (user?.id) {
            const getMyReviews = async () => {
                setLoading(true);
                try {
                    const response = await fetch("http://localhost:3001/get-your-reviews", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reviewerId: user.id }),
                    });
                    if (response.status === 404) {
                        setAllReviews([]); setError(null); return;
                    }
                    if (!response.ok) throw new Error("Failed to fetch assigned reviews.");
                    const data = await response.json();
                    setAllReviews(data.reviews || []); 
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            getMyReviews();
        } else setLoading(false);
    }, [user]);

    // ... (useMemo hooks for filtering unchanged) ...
    const pendingInvitations = useMemo(() =>
        allReviews.filter(r => r.Status === 'Pending Invitation'),
    [allReviews]);

    const pendingReviews = useMemo(() =>
        allReviews.filter(r => r.Status === 'Accepted' && !r.submittedAt),
    [allReviews]);

    const submittedReviews = useMemo(() =>
        allReviews.filter(r => r.submittedAt),
    [allReviews]);


    return (
        <div className="min-h-screen bg-[#f9fafb]">
            <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                {/* ... (header JSX remains unchanged) ... */}
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                                <span className="text-lg font-bold text-white">S</span>
                            </div>
                            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <a href="/conference/registration" className="text-[#6b7280] hover:text-[#1f2937]">Create a Conference</a>
                            <a href="/conference/manage" className="text-[#6b7280] hover:text-[#1f2937]">Manage Conferences</a>
                            <a href="/ManageReviews" className="text-[#6b7280] hover:text-[#1f2937]">Manage Reviews</a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669]/90">Return To Conference Portal</button>
                        <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium hover:bg-[#f3f4f6]">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-[#1f2937]">Reviewer Dashboard</h2>

                    {loading && <p className="text-center text-gray-500 py-4">Loading your reviews...</p>}
                    {error && <p className="text-center text-red-600 py-4">Error: {error}</p>}

                    {!loading && !error && (
                        <>
                           {/* --- UPDATED: Removed p-6 from this div --- */}
                           <div className="bg-white rounded-lg shadow">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4 p-6 pb-0">Pending Invitations</h3> {/* Added padding here */}
                                <PendingInvitationList 
                                    reviews={pendingInvitations} 
                                    onAccept={handleAccept} 
                                    onDecline={handleDecline} 
                                />
                            </div>

                           {/* --- UPDATED: Removed p-6 from this div --- */}
                            <div className="bg-white rounded-lg shadow">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4 p-6 pb-0">Pending Reviews</h3> {/* Added padding here */}
                                <PendingReviewList 
                                    reviews={pendingReviews} 
                                    navigate={navigate} 
                                />
                            </div>

                           {/* --- UPDATED: Removed p-6 from this div --- */}
                            <div className="bg-white rounded-lg shadow">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4 p-6 pb-0">My Submitted Reviews</h3> {/* Added padding here */}
                                <ReviewList 
                                    reviews={submittedReviews} 
                                    navigate={navigate} 
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}