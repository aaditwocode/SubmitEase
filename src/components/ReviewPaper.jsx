"use client";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // Removed dnd
import React, { useState, useEffect } from "react"; // Removed useMemo
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Small reusable author card (compact) ---
// This is still used for the Author list in Paper Details
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
// const reorder = (list, startIndex, endIndex) => { ... }; // Removed

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
// const getRecommendationBadge = (recommendation) => { ... }; // Removed

// --- Helper for date formatting ---
// const formatDate = (dateString) => { ... }; // Removed


export default function ReviewPaper() {
    const { user, setUser, loginStatus, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { paperId } = useParams(); // Get paperId from URL
    // const countries = [ ... ]; // Removed (was for inviting)

    // --- Page & Data State ---
    const [paper, setPaper] = useState(null); // Stores the fetched paper object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [allUsers, setAllUsers] = useState([]); // Removed

    // --- Form State (initialized from fetched paper) ---
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [confId, setConfId] = useState(null);
    const [authors, setAuthors] = useState([]);

    // --- Reviewer Management State ---
    // ... All reviewer management state removed ...

    // --- Reviews List State ---
    // ... All reviews list state removed ...

    // const [hostDecision, setHostDecision] = useState(""); // Removed

    // --- NEW: Reviewer's Form State ---
    const [comment, setComment] = useState("");
    const [recommendation, setRecommendation] = useState(""); // "Accepted", "Rejected", or ""
    const [submissionStatus, setSubmissionStatus] = useState(false); // true = submitted, false = draft
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

                // --- Removed all Review and Reviewer list population ---

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
                try {
                    console.log("Fetching existing review for paper:", paperId, "by reviewer:", user.id);
            const response = await fetch(`http://localhost:3001/get-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paperId: paperId,
                    reviewerId: user.id,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to Fetch Review.');
            }

            const updatedReview = await response.json();
            if(updatedReview.submittedAt){
                setSubmissionStatus(true);
            }else{
                setSubmissionStatus(false);
            }
            setComment(updatedReview.Comment);
            setRecommendation(updatedReview.Recommendation);
            } catch (error) {
                setLoading(false);
            setError("You Are Not Elidgible To Review This Paper.");
            return;
        }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPaper();
    }, [paperId]);

    // --- 2. Secondary Data Fetching (Users) ---
    // useEffect(() => { ... }); // Removed

    // --- Event Handlers ---
    const handlePortalClick = (portal) => navigate(`/${portal}`);
    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    // --- Reviewer Management Handlers ---
    // ... All reviewer handlers removed ...

    // --- Reviews Table Sort Logic ---
    // ... All sorting logic removed ...

    // --- Final Decision Handler ---
    // const handleFinalSubmit = async () => { ... }; // Removed

    // --- NEW: Review Form Handlers ---
    const handleSaveReview = async(e) => {
        e.preventDefault();
        try {
                const response = await fetch(`http://localhost:3001/save-review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paperId: paperId,
                        Comment: comment,
                        Recommendation: recommendation,
                        reviewerId: user.id,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to Save Review.');
                }

                const updatedReview = await response.json();
                setComment(updatedReview.Comment);
                setRecommendation(updatedReview.Recommendation);
                alert('Review Saved Successfully!');
            } catch (error) {
                console.error('Failed to Save Reviews:', error);
                alert(`Error: ${error.message}`);
            }

    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!recommendation) {
            alert("Please select a recommendation (Accepted or Rejected) before submitting.");
            return;
        }
        if (window.confirm(`Are you sure you want to submit this review as "${recommendation}"? This action cannot be undone.`)) {
            try {
                const response = await fetch(`http://localhost:3001/submit-review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paperId: paperId,
                        Comment: comment,
                        Recommendation: recommendation,
                        reviewerId: user.id,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to Submit Review.');
                }

                const updatedReview = await response.json();
                setComment(updatedReview.Comment);
                setRecommendation(updatedReview.Recommendation);
                alert('Review Submitted Successfully!');
            } catch (error) {
                console.error('Failed to Submit Reviews:', error);
                alert(`Error: ${error.message}`);
            }
            navigate("/ManageReviews");
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


                {/* --- REMOVED Bottom Section: Reviewers + Reviews --- */}

                {/* --- NEW: Reviewer Comment Section --- */}
                <div className="mt-8 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-6">
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#1f2937]">Your Review</h3>

                        {/* --- Comment Text Area --- */}
                        <div>
                            <label htmlFor="review-comment" className="block text-sm font-medium text-[#1f2937] mb-1">
                                Comments for Author & Conference Host
                            </label>
                            <textarea
                                id="review-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={8}
                                disabled={submissionStatus}
                                className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                placeholder="Provide your detailed feedback on the paper..."
                                required
                            />
                        </div>

                        {/* --- Recommendation Radio Buttons --- */}
                        <div>
                            <label className="block text-sm font-medium text-[#1f2937] mb-2">Your Recommendation</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="Accepted"
                                        checked={recommendation === 'Accepted'}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        disabled={submissionStatus}
                                        className="form-radio h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                    />
                                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700">Accept Paper</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="Rejected"
                                        checked={recommendation === 'Rejected'}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        disabled={submissionStatus}
                                        className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                    />
                                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700">Reject Paper</span>
                                </label>
                            </div>
                        </div>

                        {/* --- Action Buttons --- */}
                        <div className="flex gap-4 pt-4 border-t border-[#e5e7eb]">
                            <button
                                type="button"
                                onClick={handleSaveReview}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                                disabled={submissionStatus}
                            >
                                Save Review
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:bg-gray-400"
                                disabled={!recommendation || !comment || submissionStatus} // Disable submit if no comment or recommendation
                            >
                                Submit Review
                            </button>
                        </div>
                    </form>
                </div>
                {/* --- End of New Section --- */}

            </main>
        </div>
    );
}