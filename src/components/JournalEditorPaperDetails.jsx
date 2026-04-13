"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Reusable Components ---
const CompactAuthorCard = ({ author }) => (
    author ? (
        <div className="p-3 border rounded-md bg-white">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
            <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    ) : null
);

const getStatusBadge = (status) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    const s = status ? status.toLowerCase() : "";
    if (s.includes("accept")) badgeClasses += "bg-green-100 text-green-700";
    else if (s.includes("reject")) badgeClasses += "bg-red-100 text-red-700";
    else if (s.includes("revision") || s.includes("back")) badgeClasses += "bg-orange-100 text-orange-700";
    else badgeClasses += "bg-yellow-100 text-yellow-700";
    return <span className={badgeClasses}>{status}</span>;
};

const getRecommendationBadge = (recommendation) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
    const r = recommendation || "";
    if (r === "Strong Accept") badgeClasses += "bg-green-100 text-green-700";
    else if (r === "Reject") badgeClasses += "bg-red-100 text-red-700";
    else if (r === "Weak Accept") badgeClasses += "bg-yellow-100 text-yellow-700";
    else badgeClasses += "bg-gray-100 text-gray-700";
    return <span className={badgeClasses}>{recommendation || 'Pending'}</span>;
};

export default function JournalEditorPaperDetails() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { paperId } = useParams();

    // Data States
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [checkedReviewIds, setCheckedReviewIds] = useState(new Set());
    const [newReviewerId, setNewReviewerId] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [paperRes, usersRes] = await Promise.all([
                    fetch(`http://localhost:3001/journal/getpaperbyid/${paperId}`),
                    fetch('http://localhost:3001/users/emails')
                ]);
                const paperData = await paperRes.json();
                const usersData = await usersRes.json();

                setPaper(paperData.paper);
                setReviews(paperData.paper.Reviews || []);
                setReviewers((paperData.paper.Reviews || []).map(r => r.User).filter(Boolean));
                setAllUsers(usersData.users || []);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [paperId]);

    // Reviewer Handlers (from PaperDecision.jsx)
    const handleAssignReviewer = async () => {
        if (!newReviewerId) return;
        try {
            const res = await fetch('http://localhost:3001/assign-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, reviewerIds: [parseInt(newReviewerId)] }),
            });
            if (res.ok) {
                alert("Reviewer assigned!");
                window.location.reload();
            }
        } catch (err) { alert(err.message); }
    };

    const handleRemindReviewers = async () => {
        const ids = Array.from(checkedReviewIds);
        try {
            await fetch('http://localhost:3001/remind-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, reviewerIds: ids }),
            });
            alert("Reminders sent!");
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="p-8 text-center">Loading Editor View...</div>;
    if (!paper) return <div className="p-8 text-center">Paper not found.</div>;

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-8xl mx-auto px-4 py-8 space-y-8">
                {/* TOP SECTION: Paper Details & PDF Viewer */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    {/* Paper Metadata (from ViewJournalPaper.jsx) */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6 space-y-4 shadow-sm h-fit">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-[#1f2937]">Paper Metadata</h3>
                            {getStatusBadge(paper.Status)}
                        </div>
                        <div className="space-y-3">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Title</label><p className="text-sm text-gray-700">{paper.Title}</p></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Abstract</label><p className="text-sm text-gray-700 line-clamp-6">{paper.Abstract}</p></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Authors</label>
                                <div className="mt-2 space-y-2">{(paper.Authors || []).map(a => <CompactAuthorCard key={a.id} author={a} />)}</div>
                            </div>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="lg:col-span-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 shadow-sm h-[70vh]">
                        <iframe src={`${paper.URL}#toolbar=0`} className="w-full h-full border rounded" title="Manuscript" />
                    </div>
                </div>

                {/* MIDDLE SECTION: Manage Reviewers (from PaperDecision.jsx) */}
                <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#1f2937]">Reviewer Management</h3>
                        <div className="flex gap-2">
                            <select 
                                className="px-3 py-2 border rounded-md text-sm"
                                onChange={(e) => setNewReviewerId(e.target.value)}
                                value={newReviewerId}
                            >
                                <option value="">Select Reviewer to Add</option>
                                {allUsers.filter(u => !reviewers.some(r => r.id === u.id)).map(u => (
                                    <option key={u.id} value={u.id}>{u.email}</option>
                                ))}
                            </select>
                            <button onClick={handleAssignReviewer} className="px-4 py-2 bg-[#059669] text-white text-sm rounded-md hover:bg-[#059669]/90">Assign</button>
                            <button onClick={handleRemindReviewers} disabled={checkedReviewIds.size === 0} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md disabled:bg-gray-300">Remind Selected</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3"><input type="checkbox" /></th>
                                    <th className="p-3">Reviewer</th>
                                    <th className="p-3">Recommendation</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(rev => (
                                    <tr key={rev.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <input 
                                                type="checkbox" 
                                                onChange={() => setCheckedReviewIds(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(rev.ReviewerId)) next.delete(rev.ReviewerId);
                                                    else next.add(rev.ReviewerId);
                                                    return next;
                                                })}
                                            />
                                        </td>
                                        <td className="p-3 font-medium">{rev.User?.firstname} {rev.User?.lastname}</td>
                                        <td className="p-3">{getRecommendationBadge(rev.Recommendation)}</td>
                                        <td className="p-3">{rev.Status || 'Pending'}</td>
                                        <td className="p-3">{rev.avgScore || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BOTTOM SECTION: Revision History (from ViewJournalPaper.jsx) */}
                <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-[#1f2937] mb-6">Revision History</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-gray-500">ID</th>
                                    <th className="p-3 text-gray-500">Submitted At</th>
                                    <th className="p-3 text-gray-500">Status</th>
                                    <th className="p-3 text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(paper.Revisions || []).map(rev => (
                                    <tr key={rev.id} className="border-b">
                                        <td className="p-3 font-mono">{rev.id}</td>
                                        <td className="p-3">{new Date(rev.submittedAt).toLocaleDateString()}</td>
                                        <td className="p-3">{getStatusBadge(rev.Status)}</td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => navigate(`/journal/editor/revision/${rev.id}`)}
                                                className="text-[#059669] font-medium hover:underline"
                                            >
                                                View Detailed Revision
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}