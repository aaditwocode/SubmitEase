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
    const lowerRec = recommendation?.toLowerCase() || "";
    
    if (lowerRec.includes("accept")) {
        badgeClasses += "bg-green-100 text-green-700";
    } else if (lowerRec.includes("revision")) {
        badgeClasses += "bg-yellow-100 text-yellow-700";
    } else if (lowerRec.includes("reject")) {
        badgeClasses += "bg-red-100 text-red-700";
    } else {
        badgeClasses += "bg-gray-100 text-gray-700";
        return <span className={badgeClasses}>Pending</span>;
    }
    
    return <span className={badgeClasses}>{recommendation}</span>;
};

// --- Table Component for Submitted Reviews (WITH TABS ALWAYS VISIBLE) ---
const ReviewList = ({ reviews, navigate }) => {
    const [activeTab, setActiveTab] = useState("Accepted");
    const [sortBy, setSortBy] = useState("reviewSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");

    const tabs = ["Accepted", "Revision Required", "Rejected"];

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedReviews = useMemo(() => {
        if (!reviews) return [];

        // 1. Filter by Active Tab
        const tabFiltered = reviews.filter(review => {
            const rec = review.Recommendation?.toLowerCase() || "";
            if (activeTab === "Accepted") return rec.includes("accept");
            if (activeTab === "Revision Required") return rec.includes("revision");
            if (activeTab === "Rejected") return rec.includes("reject");
            return false;
        });

        // 2. Filter by Search Term
        const filtered = tabFiltered.filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Journal?.name?.toLowerCase().includes(lowerSearch) ||
                review.Recommendation?.toLowerCase().includes(lowerSearch)
            );
        });

        // 3. Sort
        const getSortValue = (review, key) => {
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                case 'reviewSubmittedAt': return review.submittedAt ? new Date(review.submittedAt).getTime() : 0;
                case 'recommendation': return review.Recommendation || '';
                default: return '';
            }
        };

        return [...filtered].sort((a, b) => {
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm, activeTab]);

    // REMOVED the early return here so the tabs always render!

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-[#e5e7eb] overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus:outline-none ${
                            activeTab === tab
                                ? "border-[#059669] text-[#059669]"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Search submitted reviews (ID, Title, Journal, Recommendation...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                </div>
                <table className="w-full">
                    <thead>
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
                        {filteredAndSortedReviews.length > 0 ? (
                            filteredAndSortedReviews.map((review) => (
                                <tr key={review.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                                    <td className="py-3 px-4 text-sm font-medium text-[#1f2937] truncate">{review.Paper?.id}</td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="text-sm font-medium text-[#1f2937] truncate">{review.Paper?.Title}</p>
                                            <p className="text-xs text-[#6b7280] truncate">{review.Paper?.Journal?.name}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.Paper?.submittedAt)}</td>
                                    <td className="py-3 px-4">{getRecommendationBadge(review.Recommendation)}</td>
                                    <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(review.submittedAt)}</td>
                                    <td className="py-3 px-4">
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
                                    {searchTerm ? "No reviews match your search." : `You have no ${activeTab.toLowerCase()} reviews.`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Table Component for Pending Paper Invitations ---
const PendingInvitationList = ({ reviews, onAccept, onDecline }) => {
    const [sortBy, setSortBy] = useState("paperSubmittedAt");
    const [sortOrder, setSortOrder] = useState("desc"); 
    const [searchTerm, setSearchTerm] = useState("");

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedInvitations = useMemo(() => {
        if (!reviews) return [];

        const filtered = (reviews || []).filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            const authorString = review.Paper?.Authors
                .map(a => `${a.firstname} ${a.lastname}`.toLowerCase())
                .join(' ');
            
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Journal?.name?.toLowerCase().includes(lowerSearch) ||
                (!review.isBlind && authorString.includes(lowerSearch))
            );
        });

        const getSortValue = (review, key) => {
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                default: return '';
            }
        };
        return [...filtered].sort((a, b) => {
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm]);
    
    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-4">You have no pending invitations.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <div className="p-4 border-b border-[#e5e7eb]">
                <input
                    type="text"
                    placeholder="Search invitations (ID, Title, Journal, Authors...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
            </div>
            <table className="w-full table-fixed">
                <thead>
                    <tr className="border-b border-[#e5e7eb]">
                        <th onClick={() => handleSort("paperId")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperTitle")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Authors
                        </th>
                        <th onClick={() => handleSort("paperSubmittedAt")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Submitted At{sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
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
                                            <p className="text-center text-xs text-[#6b7280] truncate">{review.Paper?.Journal?.name}</p>
                                        </div>
                                    </td>
                                    <td className="text-center py-3 px-4 text-sm text-[#1f2937] truncate">
                                        {review.isBlind ? "Anonymous Authors" : authorString}
                                    </td>
                                    <td className="text-center py-3 px-4 text-sm text-[#1f2937]">
                                        {formatDate(review.Paper?.submittedAt)}
                                    </td>
                                    <td className="py-3 px-4">
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
    const [searchTerm, setSearchTerm] = useState("");

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const filteredAndSortedPendingReviews = useMemo(() => {
        if (!reviews) return [];

        const filtered = (reviews || []).filter(review => {
            const lowerSearch = searchTerm.toLowerCase();
            const authorString = review.Paper?.Authors
                .map(a => `${a.firstname} ${a.lastname}`.toLowerCase())
                .join(' ');
            
            return (
                review.Paper?.id?.toString().includes(lowerSearch) ||
                review.Paper?.Title?.toLowerCase().includes(lowerSearch) ||
                review.Paper?.Journal?.name?.toLowerCase().includes(lowerSearch) ||
                (!review.isBlind && authorString.includes(lowerSearch))
            );
        });

        const getSortValue = (review, key) => {
            switch (key) {
                case 'paperId': return review.Paper?.id || '';
                case 'paperTitle': return review.Paper?.Title || '';
                case 'paperSubmittedAt': return review.Paper?.submittedAt ? new Date(review.Paper.submittedAt).getTime() : 0;
                default: return '';
            }
        };
        return [...filtered].sort((a, b) => {
            const aValue = getSortValue(a, sortBy);
            const bValue = getSortValue(b, sortBy);
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, sortBy, sortOrder, searchTerm]);
    
    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-4">You have no pending reviews. Great job!</p>;
    }

    return (
        <div className="overflow-x-auto">
            <div className="p-4 border-b border-[#e5e7eb]">
                <input
                    type="text"
                    placeholder="Search pending reviews (ID, Title, Journal, Authors...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
            </div>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#e5e7eb]">
                        <th onClick={() => handleSort("paperId")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper ID {sortBy === "paperId" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th onClick={() => handleSort("paperTitle")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Title {sortBy === "paperTitle" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Authors
                        </th>
                        <th onClick={() => handleSort("paperSubmittedAt")} className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap">
                            Paper Submitted On{sortBy === "paperSubmittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
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
                                        <p className="text-center text-xs text-[#6b7280] truncate">{review.Paper?.Journal?.name}</p>
                                    </div>
                                </td>
                                <td className="text-center py-3 px-4 text-sm text-[#1f2937] truncate">
                                    {review.isBlind ? "Anonymous Authors" : authorString}
                                </td>
                                <td className="text-center py-3 px-4 text-sm text-[#1f2937]">
                                    {formatDate(review.Paper?.submittedAt)}
                                </td>
                                <td className="py-3 px-4">
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

// --- Header Component ---
const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const { setUser, setloginStatus } = useUserData();
  
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/journal" },
      "Journal Host": { label: "Journal Host", path: "/journal/editor" },
      "Reviewer": { label: "Reviewer", path: "/journal/ManageReviews" }
    };
  
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
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
  
            <nav className="hidden items-center md:flex">
              <button 
                onClick={() => navigate('/journal')}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#059669] hover:bg-green-50 px-3 py-2 rounded-md"
              >
                Browse Journals
              </button>
            </nav>
          </div>
  
          <div className="flex items-center gap-3">
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
                  {availablePortals.length > 0 && (
                    <div className="border-gray-100 my-1"></div>
                  )}
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
  
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90"
            >
              Return To Dashboard
            </button>
  
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

// --- Main Page Component ---
export default function ManageReviews() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const [allReviews, setAllReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleAccept = async (reviewId) => {
        let originalReviews = []; 
        setAllReviews(prevReviews => {
            originalReviews = prevReviews; 
            return prevReviews.map(review =>
                review.id === reviewId
                    ? { ...review, Status: 'Under Review' } 
                    : review
            );
        });

        try {
            const response = await fetch('http://localhost:3001/journal/reviewInvitationResponse', {
                method:"POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId, response: 'Under Review' }), 
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

    const handleDecline = async (reviewId) => {
        let originalReviews = []; 
        setAllReviews(prevReviews => {
            originalReviews = prevReviews;
            return prevReviews.filter(review => review.id !== reviewId);
        });

        try {
            const response = await fetch('http://localhost:3001/journal/reviewInvitationResponse', {
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

    useEffect(() => {
        if (user?.id) {
            const getMyReviews = async () => {
                setLoading(true);
                try {
                    const response = await fetch("http://localhost:3001/journal/get-your-reviews", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reviewerId: user.id }),
                    });
                    if (response.status === 404) {
                        setAllReviews([]); setError(null); return;
                    }
                    if (!response.ok) throw new Error("Failed to fetch assigned reviews.");
                    const data = await response.json();
                    // Server returns journal-only reviews
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

    const pendingInvitations = useMemo(() =>
        allReviews.filter(r => r.Status === 'Pending Invitation'),
    [allReviews]);

    const pendingReviews = useMemo(() =>
        allReviews.filter(r => r.Status === 'Under Review' && !r.submittedAt),
    [allReviews]);

    const submittedReviews = useMemo(() =>
        allReviews.filter(r => r.submittedAt),
    [allReviews]);

    return (
        <div className="min-h-screen bg-[#f9fafb]">
            <Header user={user} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-[#1f2937]">Journal Reviewer Dashboard</h2>

                    {loading && <p className="text-center text-gray-500 py-4">Loading your reviews...</p>}
                    {error && <p className="text-center text-red-600 py-4">Error: {error}</p>}

                    {!loading && !error && (
                        <>
                            <div className="bg-white rounded-lg shadow">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4 p-6 pb-0">Pending Paper Invitations</h3> 
                                <PendingInvitationList 
                                    reviews={pendingInvitations} 
                                    onAccept={handleAccept} 
                                    onDecline={handleDecline} 
                                />
                            </div>

                            <div className="bg-white rounded-lg shadow">
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4 p-6 pb-0">Pending Reviews</h3> 
                                <PendingReviewList 
                                    reviews={pendingReviews} 
                                    navigate={navigate} 
                                />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[#1f2937] mb-4">My Submitted Reviews</h3> 
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