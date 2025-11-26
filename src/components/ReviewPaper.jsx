"use client";
import React, { useState, useEffect } from "react";
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

// --- NEW: Helper Component for Questionnaire ---
const ReviewScoreQuestion = ({ label, value, onChange, disabled }) => {
    return (
        <div className="py-3 sm:flex sm:items-center sm:justify-between">
            <label className="block text-sm font-medium text-[#1f2937] mb-2 sm:mb-0">
                {label}
            </label>
            <div className="flex items-center justify-start gap-2 sm:justify-end">
                <span className="text-xs text-gray-500">Low</span>
                {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score} className="flex items-center justify-center w-8 h-8 cursor-pointer">
                        <input
                            type="radio"
                            name={label} // Group radio buttons by label
                            value={score}
                            checked={value === score}
                            onChange={(e) => onChange(Number(e.target.value))}
                            disabled={disabled}
                            className="peer hidden" // Hide the actual radio button
                        />
                        {/* Custom styled radio button */}
                        <span className={`flex items-center justify-center w-full h-full border rounded-full text-sm font-medium 
                            ${value === score
                                ? 'bg-emerald-600 text-white border-emerald-600' // Selected
                                : 'text-gray-600 bg-white border-gray-300 peer-hover:bg-gray-100' // Not selected
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
                    `}>
                            {score}
                        </span>
                    </label>
                ))}
                <span className="text-xs text-gray-500">High</span>
            </div>
        </div>
    );
};


export default function ReviewPaper() {
    const { user, setUser, loginStatus, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { paperId } = useParams(); // Get paperId from URL

    // --- Page & Data State ---
    const [paper, setPaper] = useState(null); // Stores the fetched paper object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Form State (initialized from fetched paper) ---
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    const [confId, setConfId] = useState(null);
    const [authors, setAuthors] = useState([]);

    // --- Reviewer's Form State ---
    const [comment, setComment] = useState("");
    const [recommendation, setRecommendation] = useState(""); // "Strong Accept", "Weak Accept", "Reject"
    const [submissionStatus, setSubmissionStatus] = useState(false); // true = submitted, false = draft
    const [isBlind, setIsBlind] = useState(false); // true = blind review, false = open review

    // --- NEW: Questionnaire State ---
    const [scoreOriginality, setScoreOriginality] = useState(null);
    const [scoreClarity, setScoreClarity] = useState(null);
    const [scoreSoundness, setScoreSoundness] = useState(null);
    const [scoreSignificance, setScoreSignificance] = useState(null);
    const [scoreRelevance, setScoreRelevance] = useState(null);


    // --- 1. Main Data Fetching Effect (Get Paper Details) ---
    useEffect(() => {
        if (!paperId) {
            setLoading(false);
            setError("No paper ID found in the URL.");
            return;
        }
        const fetchPaper = async () => {
            setLoading(true);
            setError(null); // Clear previous errors
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

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPaper();
    }, [paperId]); // CORRECT: This effect only depends on paperId

    // --- 2. Secondary Data Fetching (Get Existing Review) ---
    useEffect(() => {
        // Wait for both paperId and user.id to be available
        if (!paperId || !user?.id) {
            return;
        }

        const fetchReview = async () => {
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

                // 404 is NOT an error, it just means the review is new
                if (response.status === 404) {
                    console.log("No existing review found. Starting new.");
                    setSubmissionStatus(false);
                    setComment("");
                    setRecommendation("");
                    setIsBlind(true);
                    // --- NEW: Reset scores for new review ---
                    setScoreOriginality(null);
                    setScoreClarity(null);
                    setScoreSoundness(null);
                    setScoreSignificance(null);
                    setScoreRelevance(null);
                    return;
                }

                // 403 or 401 IS an error
                if (response.status === 403 || response.status === 401) {
                    throw new Error("You are not eligible to review this paper.");
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to Fetch Review.');
                }

                const updatedReview = await response.json();
                if (updatedReview.submittedAt) {
                    setSubmissionStatus(true);
                } else {
                    setSubmissionStatus(false);
                }
                setComment(updatedReview.Comment || ""); // Default to empty string
                setRecommendation(updatedReview.Recommendation || ""); // Default to empty string
                setIsBlind(updatedReview.isBlind || false); // Default to false

                // --- NEW: Populate scores from existing review ---
                setScoreOriginality(updatedReview.scoreOriginality || null);
                setScoreClarity(updatedReview.scoreClarity || null);
                setScoreSoundness(updatedReview.scoreSoundness || null);
                setScoreSignificance(updatedReview.scoreSignificance || null);
                setScoreRelevance(updatedReview.scoreRelevance || null);

            } catch (error) {
                // Only set page error if one isn't already set from the paper fetch
                setError((prevError) => prevError || error.message);
            }
        };

        fetchReview();

    }, [paperId, user?.id]); // CORRECT: This effect depends on both paperId and user.id

    // --- Event Handlers ---
    const handlePortalClick = (portal) => navigate(`/${portal}`);
    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    // --- Review Form Handlers ---
    const handleSaveReview = async (e) => {
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
                    // --- NEW: Add scores ---
                    scoreOriginality: scoreOriginality,
                    scoreClarity: scoreClarity,
                    scoreSoundness: scoreSoundness,
                    scoreSignificance: scoreSignificance,
                    scoreRelevance: scoreRelevance,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to Save Review.');
                _
            }

            const updatedReview = await response.json();
            setComment(updatedReview.Comment);
            setRecommendation(updatedReview.Recommendation);
            // --- NEW: Re-set scores from response ---
            setScoreOriginality(updatedReview.scoreOriginality || null);
            setScoreClarity(updatedReview.scoreClarity || null);
            setScoreSoundness(updatedReview.scoreSoundness || null);
            setScoreSignificance(updatedReview.scoreSignificance || null);
            setScoreRelevance(updatedReview.scoreRelevance || null);

            alert('Review Saved Successfully!');
        } catch (error) {
            console.error('Failed to Save Reviews:', error);
            alert(`Error: ${error.message}`);
        }

    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!recommendation) {
            alert("Please select a final recommendation before submitting.");
            return;
        }
        // --- NEW: Check if all scores are filled ---
        if (!scoreOriginality || !scoreClarity || !scoreSoundness || !scoreSignificance || !scoreRelevance) {
            alert("Please provide a score (1-5) for all 5 questionnaire items.");
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
                        // --- NEW: Add scores ---
                        scoreOriginality: scoreOriginality,
                        scoreClarity: scoreClarity,
                        scoreSoundness: scoreSoundness,
                        scoreSignificance: scoreSignificance,
                        scoreRelevance: scoreRelevance,
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to Submit Review.');
                }

                const updatedReview = await response.json();

                // --- FIX: Optimistic UI update and correct navigation ---
                setSubmissionStatus(true); // Immediately disable form
                setComment(updatedReview.Comment);
                setRecommendation(updatedReview.Recommendation);
                // --- NEW: Set scores from final submission ---
                setScoreOriginality(updatedReview.scoreOriginality || null);
                setScoreClarity(updatedReview.scoreClarity || null);
                setScoreSoundness(updatedReview.scoreSoundness || null);
                setScoreSignificance(updatedReview.scoreSignificance || null);
                setScoreRelevance(updatedReview.scoreRelevance || null);

                alert('Review Submitted Successfully!');

                navigate("/ManageReviews"); // Navigate only on success
                // --- END FIX ---

            } catch (error) {
                console.error('Failed to Submit Reviews:', error);
                alert(`Error: ${error.message}`);
            }
        }
    };


    // --- Render Logic ---
    if (loading) return <div className="p-8 text-center">Loading paper...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;
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
            <Header user={user} />
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
                            {/* CHANGED: Only show this section if the paper review is NOT blind */}
                            {!isBlind && (
                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors</label>
                                    <div className="space-y-2">
                                        <div className="space-y-2">
                                            {authors.map((author) => <CompactAuthorCard key={author.id} author={author} />)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* --- End of Authors Section --- */}

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


                {/* --- Reviewer Comment Section --- */}
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
                                className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-gray-200 disabled:cursor-not-allowed"
                                placeholder="Provide your detailed feedback on the paper..."
                                required
                            />
                        </div>

                        {/* --- NEW: Questionnaire Section --- */}
                        <div className="space-y-2 border-t border-b border-[#e5e7eb] divide-y divide-[#e5e7eb]">
                            <h4 className="pt-4 text-base font-semibold text-[#1f2937]">Detailed Scoring</h4>

                            <ReviewScoreQuestion
                                label="Originality / Novelty"
                                value={scoreOriginality}
                                onChange={setScoreOriginality}
                                disabled={submissionStatus}
                            />
                            <ReviewScoreQuestion
                                label="Clarity / Presentation"
                                value={scoreClarity}
                                onChange={setScoreClarity}
                                disabled={submissionStatus}
                            />
                            <ReviewScoreQuestion
                                label="Technical Soundness / Methodology"
                                value={scoreSoundness}
                                onChange={setScoreSoundness}
                                disabled={submissionStatus}
                            />
                            <ReviewScoreQuestion
                                label="Significance / Impact"
                                value={scoreSignificance}
                                onChange={setScoreSignificance}
                                disabled={submissionStatus}
                            />
                            <ReviewScoreQuestion
                                label="Relevance to Conference"
                                value={scoreRelevance}
                                onChange={setScoreRelevance}
                                disabled={submissionStatus}
                            />
                        </div>
                        {/* --- End of Questionnaire Section --- */}


                        {/* --- Recommendation Radio Buttons --- */}
                        <div>
                            <label className="block text-sm font-medium text-[#1f2937] mb-2 pt-4">
                                Your Final Recommendation
                            </label>
                            <div className="flex flex-wrap gap-6">
                                {/* Strong Accept */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="Strong Accept"
                                        checked={recommendation === "Strong Accept"}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        disabled={submissionStatus}
                                        className="form-radio h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700">
                                        Strong Accept
                                    </span>
                                </label>

                                {/* Weak Accept */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="Weak Accept"
                                        checked={recommendation === "Weak Accept"}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        disabled={submissionStatus}
                                        className="form-radio h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                        Weak Accept
                                    </span>
                                </label>

                                {/* Reject */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="Reject"
                                        checked={recommendation === "Reject"}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        s disabled={submissionStatus}
                                        className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700">
                                        Reject
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-[#e5e7eb]">
                            <button
                                type="button"
                                onClick={handleSaveReview}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={submissionStatus}
                            >
                                {submissionStatus ? "Submitted" : "Save Review"}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                // NEW: Updated disabled logic
                                disabled={
                                    !recommendation ||
                                    !comment ||
                                    !scoreOriginality ||
                                    !scoreClarity ||
                                    !scoreSoundness ||
                                    !scoreSignificance ||
                                    !scoreRelevance ||
                                    submissionStatus
                                }
                            >
                                {submissionStatus ? "Submitted" : "Submit Review"}
                            </button>
                        </div>
                    </form>
                </div>
                {/* --- End of New Section --- */}

            </main>
        </div>
    );
}