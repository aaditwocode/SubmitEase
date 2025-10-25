"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions ---

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

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
            return <span className={badgeClasses}>Pending</span>;
    }
    return <span className={badgeClasses}>{recommendation}</span>;
};


// --- Reusable Table Component for Submitted Reviews ---
const ReviewList = ({ reviews }) => {
    const navigate = useNavigate();
    // Default sort by when the review was submitted
    const [sortBy, setSortBy] = useState("reviewSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const sortedReviews = useMemo(() => {
        if (!reviews) return [];
        
        // Helper to get nested sort values
        const getSortValue = (review, key) => {
            switch (key) {
                case 'paperId':
                    return review.Paper?.id || '';
                case 'paperTitle':
                    return review.Paper?.Title || '';
                case 'confName':
                    return review.Paper?.Conference?.name || '';
                case 'paperSubmittedAt':
                    // Use getTime() for correct date comparison
                    return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                case 'reviewSubmittedAt':
                    return review.submittedAt ? new Date(review.submittedAt).getTime() : 0;
                case 'recommendation':
                    return review.Recommendation || '';
                default:
                    return '';
            }
        };

        return [...reviews].sort((a, b) => {
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder]);

    if (!reviews || reviews.length === 0) {
        return (
            <p className="text-center text-gray-500 py-4">
                You have not submitted any reviews yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#e5e7eb]">
                        <th
                            className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
                            onClick={() => handleSort("paperId")}>
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
                            onClick={() => handleSort("paperTitle")}>
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
                            onClick={() => handleSort("paperSubmittedAt")}>
                            Paper Submitted {sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
                            onClick={() => handleSort("recommendation")}>
                            My Recommendation {sortBy === "recommendation" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                            className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
                            onClick={() => handleSort("reviewSubmittedAt")}>
                            Review Submitted {sortBy === "reviewSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedReviews.map((review) => (
                        <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{review.Paper?.id}</td>
                            <td className="py-3 px-4">
                                <div>
                                    <p className="text-sm font-medium text-[#1f2937]">{review.Paper?.Title}</p>
                                    <p className="text-xs text-[#6b7280]">{review.Paper?.Conference?.name}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.Paper?.submittedAt)}</td>
                            <td className="py-3 px-4">{getRecommendationBadge(review.Recommendation)}</td>
                            <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.submittedAt)}</td>
                            <td className="py-3 px-4">
                                <button onClick={() => navigate(`/ReviewPaper/${review.Paper.id}`)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Page Component ---
export default function ManageReviews() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();

    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Navigation Handlers ---
    const handlePortalClick = (portal) => {
        navigate(`/${portal}`);
    };

    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    // --- Data Fetching ---
    useEffect(() => {
        if (user?.id) {
            const getMyReviews = async () => {
                setLoading(true);
                try {
                    // ASSUMPTION: This endpoint exists and returns all reviews for a reviewerId,
                    // including nested Paper and Conference data.
                    const response = await fetch("http://localhost:3001/get-your-reviews", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reviewerId: user.id }),
                    });
                    if (response.status === 404) {
                        setAllReviews([]);
                        setError(null);
                        return;
                    }
                    if (!response.ok) {
                        throw new Error("Failed to fetch assigned reviews.");
                    }
                    const data = await response.json();
                    setAllReviews(data.reviews || []);
                } catch (err) {
                    console.error(err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            getMyReviews();
        } else {
            // If user is not loaded yet, don't show an error, just wait.
            setLoading(false);
        }
    }, [user]);

    // --- Filter reviews into pending and submitted lists ---
    const pendingReviews = useMemo(() =>
        allReviews.filter(review => !review.submittedAt),
        [allReviews]
    );

    const submittedReviews = useMemo(() =>
        allReviews.filter(review => review.submittedAt),
        [allReviews]
    );

    
    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-[#ffffff]">
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-[#1f2937]">Reviewer Dashboard</h2>

                    {loading && (
                         <p className="text-center text-gray-500 py-4">Loading your reviews...</p>
                    )}

                    {error && (
                         <p className="text-center text-red-600 py-4">Error: {error}</p>
                    )}

                    {!loading && !error && (
                        <>
                            {/* --- Section 1: Pending Reviews --- */}
                            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Pending Reviews</h3>
                                {pendingReviews.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">
                                        You have no pending reviews. Great job!
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingReviews.map((review) => (
                                            <div key={review.id} className="block p-4 border border-[#e5e7eb] rounded-lg bg-white shadow-sm">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-[#1f2937]">{review.Paper?.Title}</h4>
                                                        <p className="text-sm text-[#6b7280]">
                                                            <span className="font-medium">Conference:</span> {review.Paper?.Conference?.name}
                                                        </p>
                                                        <p className="text-sm text-[#6b7280]">
                                                            <span className="font-medium">Paper Submitted:</span> {formatDate(review.Paper?.submittedAt)}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate(`/ReviewPaper/${review.Paper.id}`)} 
                                                        className="mt-3 sm:mt-0 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap"
                                                    >
                                                        Review Now
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* --- Section 2: Submitted Reviews --- */}
                            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">My Submitted Reviews</h3>
                                <ReviewList reviews={submittedReviews} />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}