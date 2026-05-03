"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Reusable Components ---
const CompactAuthorCard = ({ author }) => (
    author ? (
        <div className="p-3 border border-[#e5e7eb] rounded-md bg-white shadow-sm">
            <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500 font-normal">({author.email})</span></p>
            <p className="text-xs text-[#6b7280] mt-1">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
            <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
        </div>
    ) : null
);

const getStatusBadge = (status) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight border ";
    const s = status ? status.toLowerCase() : "";
    if (s.includes("accept")) badgeClasses += "bg-green-50 text-green-700 border-green-200";
    else if (s.includes("reject")) badgeClasses += "bg-red-50 text-red-700 border-red-200";
    else if (s.includes("decision") || s.includes("revision") || s.includes("back")) badgeClasses += "bg-orange-50 text-orange-700 border-orange-200";
    else badgeClasses += "bg-yellow-50 text-yellow-700 border-yellow-200";
    return <span className={badgeClasses}>{status}</span>;
};

const getRecommendationBadge = (recommendation) => {
    let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight border ";
    const r = recommendation || "";
    if (r === "Strong Accept" || r === "Accept") badgeClasses += "bg-green-50 text-green-700 border-green-200";
    else if (r === "Reject") badgeClasses += "bg-red-50 text-red-700 border-red-200";
    else if (r === "Weak Accept" || r.includes("Revision")) badgeClasses += "bg-yellow-50 text-yellow-700 border-yellow-200";
    else badgeClasses += "bg-gray-50 text-gray-700 border-gray-200";
    return <span className={badgeClasses}>{recommendation || 'Pending'}</span>;
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) { return 'Invalid Date'; }
};

const calculateDaysPending = (assignedAt, submittedAt) => {
    if (submittedAt || !assignedAt) return <span className="text-gray-400">—</span>;
    try {
        const diffTime = new Date().getTime() - new Date(assignedAt).getTime();
        if (diffTime < 0) return <span className="text-gray-400">—</span>;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let textColor = "text-[#059669]"; 
        if (diffDays > 7) textColor = "text-yellow-600";
        if (diffDays > 14) textColor = "text-red-600";
        return <span className={`font-bold ${textColor}`}>{diffDays === 1 ? '1 day' : `${diffDays} days`}</span>;
    } catch (error) { return <span className="text-red-500">Error</span>; }
};

// --- HEADER COMPONENT ---
const Header = ({ user, journalid, currentJournalName, handleLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const ROLE_CONFIG = {
        "Author": { label: "Author", path: `/journal/${journalid}/author` },
        "Journal Editor": { label: "Editor", path: `/journal/${journalid}/editor` },
        "Journal Reviewer": { label: "Reviewer", path: `/journal/${journalid}/reviewer` },
        "Editor-in-Chief": { label: "Editor-In-Chief", path: `/journal/${journalid}/eic` },
        "Journal Host": { label: "Journal Host", path: `/journal/${journalid}/journalhost` }
    };

    const availablePortals = useMemo(() => {
        if (!user || !user.activeJournals) return [];
        const currentJournal = user.activeJournals.find((j) => j.journalId === parseInt(journalid, 10));
        const rolesForThisJournal = currentJournal?.roles || [];
        
        return rolesForThisJournal
            .map(roleString => ROLE_CONFIG[roleString])
            .filter(Boolean);
    }, [user, journalid]);
    
    return (
        <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]"><span className="text-lg font-bold text-white">S</span></div>
                        <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
                        {currentJournalName && (
                            <>
                                <span className="text-gray-300 mx-1">|</span>
                                <span className="text-sm font-semibold text-[#059669] truncate max-w-[200px] md:max-w-md">{currentJournalName}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} className="group flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] bg-white">
                            Switch Portal <svg className={`w-4 h-4 text-gray-500 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
                                {availablePortals.length > 0 && (<><h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roles</h6>
                                    {availablePortals.map((option, index) => (
                                        <button key={index} onMouseDown={() => { navigate(option.path); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]">{option.label}</button>
                                    ))}
                                </>)}
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669]/90">Return To Dashboard</button>
                    <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-red-50 hover:text-red-600">Logout</button>
                </div>
            </div>
        </header>
    );
};

// --- MAIN COMPONENT ---
export default function JournalEditorPaperDetails() {
    const { user, setUser, setloginStatus } = useUserData();
    const navigate = useNavigate();
    const { journalid, paperId } = useParams();

    // Data States
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [journalUsers, setJournalUsers] = useState([]);
    const [platformUsers, setPlatformUsers] = useState([]);
    const [currentJournalName, setCurrentJournalName] = useState("");
    
    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [checkedReviewIds, setCheckedReviewIds] = useState(new Set());

    // Modal States
    const [viewReviewModalOpen, setViewReviewModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    // Dynamic Role States based on user context
    const [isEIC, setIsEIC] = useState(false);

    // Decision States
    const [hostDecision, setHostDecision] = useState(""); 
    const [editorRecommendation, setEditorRecommendation] = useState(""); 
    const [selectedCommentsToAuthor, setSelectedCommentsToAuthor] = useState(new Set());
    
    // --- Unified Directory Search Modal State ---
    const [userModal, setUserModal] = useState({ open: false, role: '', context: '' }); // role: 'Editor'|'Reviewer', context: 'Assign'|'Change'|'Transfer'
    const [userModalTab, setUserModalTab] = useState('directory'); // 'directory', 'upgrade_journal', 'upgrade_network', 'new'
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [inviteForm, setInviteForm] = useState({ firstname: "", lastname: "", email: "" });

    // Sorting & Searching State for Reviews
    const [reviewSearchTerm, setReviewSearchTerm] = useState("");
    const [reviewSortBy, setReviewSortBy] = useState("assignedAt");
    const [reviewSortOrder, setReviewSortOrder] = useState("desc");

    // Desk Reject Modal States
    const [deskRejectModalOpen, setDeskRejectModalOpen] = useState(false);
    const [deskRejectMessage, setDeskRejectMessage] = useState("");

    const handleLogout = () => { setUser(null); setloginStatus(false); navigate("/home"); };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [paperRes, journalUsersRes, platformUsersRes] = await Promise.all([
                    fetch(`http://localhost:3001/journal/editor/paper/${paperId}?journalId=${journalid}`),
                    fetch(`http://localhost:3001/journal/users?journalId=${journalid}`),
                    fetch('http://localhost:3001/users/emails')
                ]);
                const paperData = await paperRes.json();
                const jUsersData = await journalUsersRes.json();
                const pUsersData = await platformUsersRes.json();

                setPaper(paperData.paper);
                setReviews(paperData.paper.Reviews || []);
                setReviewers((paperData.paper.Reviews || []).map(r => r.User).filter(Boolean));
                setJournalUsers(jUsersData.users || []);
                setPlatformUsers(pUsersData.users || []);

                if (user && user.activeJournals) {
                    const matchingJournal = user.activeJournals.find(j => j.journalId === parseInt(journalid, 10));
                    if (matchingJournal) {
                        setCurrentJournalName(matchingJournal.journalName);
                        // Safely evaluate if user holds the EIC role in this specific journal
                        setIsEIC(matchingJournal.roles.includes("Editor-in-Chief"));
                    }
                }
            } catch (err) { console.error("Fetch error:", err); } finally { setLoading(false); }
        };
        if(journalid && paperId) fetchData();
    }, [paperId, journalid, user]);

    // Derived State for Permissions
    const hasAssignedEditor = paper?.Editors && paper.Editors.length > 0;
    const currentEditor = hasAssignedEditor ? paper.Editors[0] : null;
    const isAssignedEditor = currentEditor && user?.id === currentEditor.EditorId;
    
    const isReviewLocked = paper && ['accepted', 'rejected', 'revision'].some(status => (paper.Status || '').toLowerCase().includes(status));
    
    // STRICT FIX: Only the assigned editor can mess with reviewers. If EIC wants to manage reviewers, they must assign themselves.
    const disableReviewerActions = !isAssignedEditor || isReviewLocked; 
    
    const hasEnoughReviewers = reviews.filter(r => ['Submitted', 'Completed'].includes(r.Status)).length >= 3;

    // --- Filter logic for Modals ---
    // 1. Users IN the journal WITH the requested role
    const availableEditors = journalUsers.filter(u => u.role?.includes("Journal Editor"));
    const eligibleReviewerUsers = journalUsers.filter(u => (u.role?.includes("Journal Reviewer")) && !reviewers.some(r => r.id === u.id));
    
    // 2. Users IN the journal WITHOUT the requested role (needs upgrade)
    const journalUsersWithoutEditorRole = journalUsers.filter(u => !u.role?.includes("Journal Editor"));
    const journalUsersWithoutReviewerRole = journalUsers.filter(u => !u.role?.includes("Journal Reviewer") && !reviewers.some(r => r.id === u.id));

    // 3. Users completely OUTSIDE the journal (needs upgrade)
    const platformNonJournalEditors = platformUsers.filter(u => !journalUsers.some(ju => ju.id === u.id));
    const platformNonJournalReviewers = platformUsers.filter(u => !journalUsers.some(ju => ju.id === u.id) && !reviewers.some(r => r.id === u.id));

    // --- Action Handlers: EIC ---
    const handleDeskReject = () => {
        setDeskRejectMessage(""); 
        setDeskRejectModalOpen(true);
    };

    const submitDeskReject = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to desk reject this paper? This action cannot be undone.")) return;
        try {
            await fetch('http://localhost:3001/journal/eic/desk-reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, message: deskRejectMessage })
            });
            alert("Paper Desk Rejected and Author Notified!");
            window.location.reload();
        } catch(err) { alert("Failed to desk reject"); }
    };

    const handleFinalSubmit = async () => {
        if (!hostDecision) return alert("Select a final decision.");
        if (!window.confirm(`Finalize decision as ${hostDecision}?`)) return;
        try {
            await fetch('http://localhost:3001/journal/eic/final-decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, status: hostDecision, commentsForAuthor: Array.from(selectedCommentsToAuthor) })
            });
            alert("Final Decision Submitted and Author Notified!");
            window.location.reload();
        } catch(err) { alert("Error submitting final decision."); }
    };

    const handleRemindEditor = async () => {
        if (!window.confirm("Send a reminder email to the assigned editor?")) return;
        try {
            await fetch('http://localhost:3001/journal/eic/remind-editor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, editorId: currentEditor.EditorId })
            });
            alert("Reminder sent successfully!");
        } catch (err) { alert("Failed to send reminder."); }
    };

    // --- Action Handlers: Assigned Editor ---
    const handleEditorSubmit = async () => {
        if (!editorRecommendation) return alert("Please select a recommendation.");
        if (!window.confirm(`Submit recommendation as ${editorRecommendation}?`)) return;
        try {
            await fetch('http://localhost:3001/journal/editor/recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, editorId: user.id, recommendation: editorRecommendation })
            });
            alert("Recommendation submitted successfully to the EIC!");
            window.location.reload();
        } catch (err) { alert("Error submitting recommendation."); }
    };

    const handleRevokeTransfer = async () => {
        if (!window.confirm("Cancel this pending transfer request?")) return;
        try {
            await fetch('http://localhost:3001/journal/editor/transfer/revoke', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ paperId, journalId: journalid, editorId: user.id })
            });
            alert("Transfer request revoked successfully.");
            window.location.reload();
        } catch (err) {
            alert("Failed to revoke transfer.");
        }
    };

    // --- Action Handlers: Reviewers ---
    const handleRemoveReviewers = async () => {
        const ids = Array.from(checkedReviewIds);
        if (ids.length === 0) return alert("Select at least one reviewer to remove.");
        if (!window.confirm("Are you sure you want to remove the selected reviewers?")) return;
        try {
            const res = await fetch('http://localhost:3001/journal/remove-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, reviewerIds: ids }),
            });
            if (res.ok) {
                alert("Reviewers removed successfully!");
                window.location.reload();
            }
        } catch (err) { alert("Failed to remove reviewers."); }
    };

    const handleRemindReviewers = async () => {
        const ids = Array.from(checkedReviewIds);
        if (ids.length === 0) return alert("Select at least one reviewer to remind.");
        try {
            await fetch('http://localhost:3001/journal/remind-reviewers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperId, journalId: journalid, reviewerIds: ids }),
            });
            alert("Reminders sent successfully!");
            setCheckedReviewIds(new Set());
        } catch (err) { alert(err.message); }
    };

    // --- Unified User Selection & Invitation Handler ---
    const openUnifiedUserModal = (role, context) => {
        setUserModal({ open: true, role, context });
        setUserModalTab('directory');
        setUserSearchTerm('');
        setInviteForm({ firstname: "", lastname: "", email: "" });
    };

    const handleUserSelectionSubmit = async (targetUserId, isUpgrade = false, isNewUser = false) => {
        try {
            let finalUserId = targetUserId;

            if (isNewUser) {
                if (!inviteForm.email || !inviteForm.firstname || !inviteForm.lastname) return alert("Please fill all fields.");
                const roleArray = userModal.role === "Editor" ? ["Journal Editor"] : ["Journal Reviewer"];
                
                const response = await fetch('http://localhost:3001/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: inviteForm.email, password: "tempPassword123", 
                        firstname: inviteForm.firstname, lastname: inviteForm.lastname,
                        role: roleArray, sendEmail: true,
                        journalId: parseInt(journalid, 10) 
                    }),
                });
                if (!response.ok) throw new Error("Failed to register new user.");
                const newUser = await response.json();
                finalUserId = newUser.id;
            }

            if (userModal.role === 'Editor') {
                if (userModal.context === 'Assign') {
                    await fetch('http://localhost:3001/journal/eic/assign-editor', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paperId, journalId: journalid, editorId: finalUserId, upgradeRole: isUpgrade || isNewUser })
                    });
                    alert("Editor Assigned Successfully!");
                } else if (userModal.context === 'Change') {
                    if (!window.confirm("Are you sure you want to change the assigned editor? The current editor will be removed.")) return;
                    await fetch('http://localhost:3001/journal/eic/change-editor', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paperId, journalId: journalid, oldEditorId: currentEditor.EditorId, newEditorId: finalUserId, upgradeRole: isUpgrade || isNewUser })
                    });
                    alert("Editor Changed Successfully!");
                } else if (userModal.context === 'Transfer') {
                    await fetch('http://localhost:3001/journal/editor/transfer/initiate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paperId, journalId: journalid, editorId: user.id, newEditorId: finalUserId, upgradeRole: isUpgrade || isNewUser })
                    });
                    alert("Transfer request sent successfully!");
                }
            }  else if (userModal.role === 'Journal Reviewer') {
                const response = await fetch('http://localhost:3001/journal/assign-reviewers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paperId, journalId: journalid, reviewerIds: [parseInt(finalUserId)], upgradeRole: isUpgrade || isNewUser }),
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || "Failed to assign reviewer.");
                }
                alert("Reviewer Assigned Successfully!");
            }

            window.location.reload();
        } catch (err) { alert(err.message || "Action failed."); }
    };

    const toggleAuthorComment = (reviewId) => {
        setSelectedCommentsToAuthor(prev => {
            const next = new Set(prev);
            if(next.has(reviewId)) next.delete(reviewId);
            else next.add(reviewId);
            return next;
        });
    };

    const toggleCheckedReviewId = (reviewerId) => {
        setCheckedReviewIds(prev => {
            const next = new Set(prev);
            if(next.has(reviewerId)) next.delete(reviewerId);
            else next.add(reviewerId);
            return next;
        });
    };

    const handleViewReview = (review) => {
        setSelectedReview(review);
        setViewReviewModalOpen(true);
    };

    const handleReviewSort = (column) => {
        if (reviewSortBy === column) setReviewSortOrder(reviewSortOrder === "asc" ? "desc" : "asc");
        else { setReviewSortBy(column); setReviewSortOrder("asc"); }
    };

    const filteredAndSortedReviews = useMemo(() => {
        if (!reviews) return [];
        const filtered = reviews.filter(review => {
            const lowerSearch = reviewSearchTerm.toLowerCase();
            if (!lowerSearch) return true;
            const reviewer = review.User || reviewers.find(r => r.id === review.ReviewerId);
            return (
                (reviewer?.firstname?.toLowerCase().includes(lowerSearch)) ||
                (reviewer?.email?.toLowerCase().includes(lowerSearch)) ||
                ((review.Status || '').toLowerCase().includes(lowerSearch)) ||
                ((review.Recommendation || '').toLowerCase().includes(lowerSearch))
            );
        });

        return [...filtered].sort((a, b) => {
            let aValue = a[reviewSortBy] || 0, bValue = b[reviewSortBy] || 0;
            if(reviewSortBy === 'assignedAt' || reviewSortBy === 'submittedAt') {
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }
            if (aValue < bValue) return reviewSortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return reviewSortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [reviews, reviewSortBy, reviewSortOrder, reviewSearchTerm, reviewers]);

    // Data Aggregation for User Modal
    const modalUsersToDisplay = useMemo(() => {
        let list = [];
        if (userModalTab === 'directory') {
            list = userModal.role === 'Editor' ? availableEditors : eligibleReviewerUsers;
        } else if (userModalTab === 'upgrade_journal') {
            list = userModal.role === 'Editor' ? journalUsersWithoutEditorRole : journalUsersWithoutReviewerRole;
        } else if (userModalTab === 'upgrade_network') {
            list = userModal.role === 'Editor' ? platformNonJournalEditors : platformNonJournalReviewers;
        }

        if (userModal.role === 'Editor' && (userModal.context === 'Change' || userModal.context === 'Transfer') && currentEditor) {
            list = list.filter(u => u.id !== currentEditor.EditorId);
        }

        if (!userSearchTerm) return list;
        const lowerSearch = userSearchTerm.toLowerCase();
        return list.filter(u => 
            (u.firstname + " " + u.lastname).toLowerCase().includes(lowerSearch) ||
            u.email.toLowerCase().includes(lowerSearch) ||
            (u.organisation || "").toLowerCase().includes(lowerSearch) ||
            (u.expertise || []).join(" ").toLowerCase().includes(lowerSearch)
        );
    }, [userModal, userModalTab, userSearchTerm, availableEditors, eligibleReviewerUsers, journalUsersWithoutEditorRole, journalUsersWithoutReviewerRole, platformNonJournalEditors, platformNonJournalReviewers, currentEditor]);


    if (loading) return <div className="p-8 text-center text-[#6b7280] font-medium mt-10">Loading Document Data...</div>;
    if (!paper) return <div className="p-8 text-center text-red-600 font-medium mt-10">Document not found.</div>;

    const sortedRevisions = [...(paper.Revisions || [])].sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return (
        <div className="min-h-screen bg-[#ffffff]">
            <Header user={user} journalid={journalid} currentJournalName={currentJournalName} handleLogout={handleLogout} />

            <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <button 
                    onClick={() => navigate(isEIC ? `/journal/${journalid}/eic` : `/journal/${journalid}/editor`)} 
                    className="mb-4 text-sm font-bold text-[#059669] hover:underline flex items-center gap-1"
                >
                    ← Back to {isEIC ? 'EIC' : 'Editor'} Dashboard
                </button>                
                
                {/* --- TOP SECTION: Grid Layout --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- Left Column: Paper Details & Authors --- */}
                    <div className="lg:col-span-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-6 lg:h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-[#1f2937]">Paper Details</h3>
                            {getStatusBadge(paper.Status)}
                        </div>

                        <div className="space-y-5">
                            <div><label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Title</label><textarea value={paper.Title} readOnly rows={2} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-white text-sm resize-none" /></div>
                            <div><label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Abstract</label><textarea value={paper.Abstract} readOnly rows={6} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-white text-sm resize-none" /></div>
                            <div><label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Keywords</label><input type="text" value={paper.Keywords?.join(', ')} readOnly className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-white text-sm" /></div>
                            
                            <div className="pt-2 border-t border-[#e5e7eb]">
                                <label className="block text-sm font-bold text-[#1f2937] mb-3">Author Directory</label>
                                <div className="space-y-3">
                                    {(paper.Authors || []).map((author) => <CompactAuthorCard key={author.id} author={author} />)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column: PDF Viewer --- */}
                    <div className="lg:col-span-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full h-[90vh] flex flex-col">
                        <h3 className="text-lg font-bold text-[#1f2937] mb-4">Document Viewer</h3>
                        <iframe src={`${paper.URL}#toolbar=0`} title="Paper PDF Viewer" className="w-full flex-grow border border-[#e5e7eb] rounded-md bg-white" />
                    </div>
                </div>

                {/* --- BOTTOM SECTION: Revision History, Triage, Reviewers, Final Decision --- */}
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full space-y-10">
                    {/* --- 1. Revision History --- */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#1f2937]">Revision History</h3>
                        {sortedRevisions.length === 0 ? (
                            <p className="text-[#6b7280] text-sm italic py-2">No previous revisions exist for this manuscript.</p>
                        ) : (
                            <div className="overflow-x-auto border border-[#e5e7eb] rounded-lg bg-white">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-[#e5e7eb]">
                                        <tr>
                                            <th className="p-4 font-medium text-[#6b7280]">Document ID</th>
                                            <th className="p-4 font-medium text-[#6b7280]">Submitted At</th>
                                            <th className="p-4 font-medium text-[#6b7280]">Status</th>
                                            <th className="p-4 font-medium text-[#6b7280]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e5e7eb]">
                                        {sortedRevisions.map(rev => (
                                            <tr key={rev.id} className="hover:bg-[#f3f4f6]/50">
                                                <td className="p-4 font-mono text-[#1f2937]">{rev.id}</td>
                                                <td className="p-4 text-[#1f2937]">{new Date(rev.submittedAt).toLocaleDateString()}</td>
                                                <td className="p-4">{getStatusBadge(rev.Status)}</td>
                                                <td className="p-4"><button onClick={() => navigate(`/journal/${journalid}/editor/paper/${rev.id}`)} className="text-[#059669] font-medium hover:underline">View Revision</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#e5e7eb]"></div>

                    {/* --- 2. EIC ONLY: Triage & Editor Assignment --- */}
                    {(isEIC || isAssignedEditor) && (
                        <>
                            <div className="space-y-4 bg-white p-5 border border-emerald-100 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                            Editor Assignment
                                        </h3>
                                        <p className="text-sm text-emerald-700 mt-1">{isEIC ? "Assign an Editor to handle peer review, or Desk Reject if out of scope." : "You are the assigned editor for this manuscript."}</p>
                                    </div>
                                    {currentEditor ? (
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                                            Editor Assigned
                                        </span>
                                    ) : (isEIC && !isReviewLocked) ? (
                                        <button onClick={handleDeskReject} className="px-4 py-2 bg-red-50 text-red-700 font-medium rounded-md hover:bg-red-100 border border-red-200 text-sm transition-colors">Desk Reject (No Review)</button>
                                    ) : null}
                                </div>
                                
                                {currentEditor ? (
                                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-md">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-semibold text-emerald-900 text-sm uppercase tracking-wider mb-1">Assigned Editor Details</p>
                                            
                                            {/* Action Buttons */}
                                            {!isReviewLocked && (
                                                <div className="flex gap-2">
                                                    {isEIC && (
                                                        <>
                                                            <button onClick={handleRemindEditor} className="text-xs px-3 py-1 bg-white border border-emerald-300 text-[#059669] font-bold rounded hover:bg-emerald-50 transition-colors shadow-sm">
                                                                Remind Editor
                                                            </button>
                                                            <button onClick={() => openUnifiedUserModal('Editor', 'Change')} className="text-xs px-3 py-1 bg-white border border-emerald-300 text-[#059669] font-bold rounded hover:bg-emerald-50 transition-colors shadow-sm">
                                                                Change Editor
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                            <p className="text-emerald-900 font-medium">{currentEditor.Editor?.firstname} {currentEditor.Editor?.lastname} <span className="text-emerald-600 font-normal">({currentEditor.Editor?.email})</span></p>
                                            {currentEditor.Editor?.expertise && currentEditor.Editor.expertise.length > 0 && (
                                                <p className="text-sm text-emerald-700"><span className="font-semibold">Expertise:</span> {currentEditor.Editor.expertise.join(', ')}</p>
                                            )}
                                            {currentEditor.assignedAt && (
                                                <p className="text-sm text-emerald-700"><span className="font-semibold">Assigned:</span> {formatDate(currentEditor.assignedAt)}</p>
                                            )}
                                        </div>

                                        {/* Editor Transfer UI */}
                                        {currentEditor.TransferStatus === "Pending" ? (
                                            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-teal-800 font-bold mb-1 flex items-center gap-2">
                                                        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                        Transfer Pending
                                                    </p>
                                                    <p className="text-xs text-teal-700">A request has been sent to transfer this paper to {currentEditor.TransferredEditor?.firstname} {currentEditor.TransferredEditor?.lastname}.</p>
                                                </div>
                                                {isAssignedEditor && (
                                                    <button onClick={handleRevokeTransfer} className="text-xs px-3 py-1 bg-white border border-teal-300 text-teal-700 font-bold rounded hover:bg-teal-100 transition-colors shadow-sm">
                                                        Revoke Transfer
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            isAssignedEditor && !isReviewLocked && (
                                                <button onClick={() => openUnifiedUserModal('Editor', 'Transfer')} className="mt-4 text-xs px-4 py-2 bg-white border border-emerald-300 text-[#059669] font-bold rounded hover:bg-emerald-50 transition-colors shadow-sm">
                                                    Transfer paper to another editor
                                                </button>
                                            )
                                        )}
                                    </div>
                                ) : (isEIC && !isReviewLocked) && (
                                    <div className="mt-4">
                                        <button onClick={() => openUnifiedUserModal('Editor', 'Assign')} className="px-6 py-2 bg-[#059669] text-white text-sm font-medium rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                            Assign or Invite Editor
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-[#e5e7eb]"></div>
                        </>
                    )}

                    {/* --- 3. Reviewer Management --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-[#1f2937]">Reviewer Management</h3>
                                {disableReviewerActions && <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">Read-Only Mode</span>}
                            </div>
                            
                            {!disableReviewerActions && (
                                <div className="flex gap-3">
                                    <button onClick={handleRemindReviewers} disabled={checkedReviewIds.size === 0} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${checkedReviewIds.size ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-sm' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                                        Remind Selected
                                    </button>
                                    <button onClick={handleRemoveReviewers} disabled={checkedReviewIds.size === 0} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${checkedReviewIds.size ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                                        Remove Selected
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {!disableReviewerActions && (
                            <div className="mt-4">
                                <button onClick={() => openUnifiedUserModal('Journal Reviewer', 'Assign')} className="px-6 py-2 bg-[#059669] text-white text-sm font-medium rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                    Assign or Invite Reviewer
                                </button>
                            </div>
                        )}

                        <div className="overflow-x-auto border border-[#e5e7eb] rounded-lg bg-white mt-4">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-[#e5e7eb]">
                                    <tr>
                                        {!disableReviewerActions && <th className="p-4 w-12 text-center"><span className="text-gray-400">Select</span></th>}
                                        <th className="p-4 font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleReviewSort("reviewer")}>Reviewer {reviewSortBy === "reviewer" && (reviewSortOrder === "asc" ? "↑" : "↓")}</th>
                                        <th className="p-4 font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleReviewSort("status")}>Status {reviewSortBy === "status" && (reviewSortOrder === "asc" ? "↑" : "↓")}</th>
                                        <th className="p-4 font-medium text-[#6b7280]">Recommendation & Comments</th>
                                        <th className="p-4 font-medium text-[#6b7280] whitespace-nowrap" onClick={() => handleReviewSort("assignedAt")}>Assigned {reviewSortBy === "assignedAt" && (reviewSortOrder === "asc" ? "↑" : "↓")}</th>
                                        <th className="p-4 font-medium text-[#6b7280] whitespace-nowrap">Days Pending</th>
                                        <th className="p-4 font-medium text-[#6b7280] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                    {filteredAndSortedReviews.length === 0 ? (
                                        <tr><td colSpan={disableReviewerActions ? 6 : 7} className="text-center py-8 text-[#6b7280]">No reviewers assigned yet.</td></tr>
                                    ) : (
                                        filteredAndSortedReviews.map((review) => {
                                            const reviewer = review.User || reviewers.find(r => r && r.id === review.ReviewerId);
                                            const isFinished = ['submitted', 'completed'].includes((review.Status || '').toLowerCase());

                                            return (
                                                <tr key={review.id} className="hover:bg-[#f3f4f6]/50">
                                                    {!disableReviewerActions && (
                                                        <td className="p-4 text-center align-top">
                                                            <input 
                                                                type="checkbox" 
                                                                onChange={() => toggleCheckedReviewId(review.ReviewerId)} 
                                                                checked={checkedReviewIds.has(review.ReviewerId)} 
                                                                disabled={isFinished}
                                                                className={`rounded text-[#059669] focus:ring-[#059669] w-4 h-4 ${isFinished ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                title={isFinished ? "Cannot modify a reviewer who has already submitted." : ""}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="p-4 align-top">
                                                        {reviewer ? (
                                                            <div><p className="font-bold text-[#1f2937]">{reviewer.firstname} {reviewer.lastname}</p><p className="text-xs text-[#6b7280]">{reviewer.email}</p></div>
                                                        ) : <span className="text-[#6b7280] italic">Unknown</span>}
                                                    </td>
                                                    <td className="p-4 align-top font-medium text-[#1f2937]">{review.Status || 'Pending'}</td>
                                                    <td className="p-4 align-top max-w-xs">
                                                        <div className="mb-1">{getRecommendationBadge(review.Recommendation)}</div>
                                                        {review.Comment && (
                                                            <p className="text-xs text-gray-500 line-clamp-2 italic mt-2 border-l-2 border-gray-300 pl-2">"{review.Comment}"</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-top text-[#1f2937]">{formatDate(review.assignedAt)}</td>
                                                    <td className="p-4 align-top">{calculateDaysPending(review.assignedAt, review.submittedAt)}</td>
                                                    <td className="p-4 align-top text-center">
                                                        <button 
                                                            onClick={() => handleViewReview(review)}
                                                            className="text-[#059669] hover:bg-emerald-50 px-3 py-1 rounded border border-transparent hover:border-emerald-200 transition-colors text-sm font-medium"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- 4. EDITOR ONLY: Submit Recommendation --- */}
                    {isAssignedEditor && currentEditor.Status !== 'Completed' && (
                        <>
                            <div className="border-t border-[#e5e7eb]"></div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-emerald-900 mb-4">Submit Editor Recommendation</h3>
                                
                                {!hasEnoughReviewers ? (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 font-medium text-sm flex items-start gap-2">
                                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        You must have at least 3 completed reviews submitted for this paper before you can send your formal recommendation to the Editor-in-Chief.
                                    </div>
                                ) : (
                                    <p className="text-sm text-emerald-800 mb-4">Based on the {reviews.length} reviews, select your recommendation for the Editor-in-Chief:</p>
                                )}

                                <div className="flex flex-wrap gap-4 items-center">
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded border ${hasEnoughReviewers ? 'bg-white border-gray-200 cursor-pointer hover:border-green-500' : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'}`}>
                                        <input disabled={!hasEnoughReviewers} type="radio" name="editorDecision" value="Accept" checked={editorRecommendation === 'Accept'} onChange={(e) => setEditorRecommendation(e.target.value)} className="text-green-600 focus:ring-green-500" />
                                        <span className="text-sm font-bold text-green-700">Accept</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded border ${hasEnoughReviewers ? 'bg-white border-gray-200 cursor-pointer hover:border-yellow-500' : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'}`}>
                                        <input disabled={!hasEnoughReviewers} type="radio" name="editorDecision" value="Minor Revision" checked={editorRecommendation === 'Minor Revision'} onChange={(e) => setEditorRecommendation(e.target.value)} className="text-yellow-600 focus:ring-yellow-500" />
                                        <span className="text-sm font-bold text-yellow-700">Minor Revision</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded border ${hasEnoughReviewers ? 'bg-white border-gray-200 cursor-pointer hover:border-orange-500' : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'}`}>
                                        <input disabled={!hasEnoughReviewers} type="radio" name="editorDecision" value="Major Revision" checked={editorRecommendation === 'Major Revision'} onChange={(e) => setEditorRecommendation(e.target.value)} className="text-orange-600 focus:ring-orange-500" />
                                        <span className="text-sm font-bold text-orange-700">Major Revision</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-3 py-2 rounded border ${hasEnoughReviewers ? 'bg-white border-gray-200 cursor-pointer hover:border-red-500' : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'}`}>
                                        <input disabled={!hasEnoughReviewers} type="radio" name="editorDecision" value="Reject" checked={editorRecommendation === 'Reject'} onChange={(e) => setEditorRecommendation(e.target.value)} className="text-red-600 focus:ring-red-500" />
                                        <span className="text-sm font-bold text-red-700">Reject</span>
                                    </label>
                                </div>
                                <button onClick={handleEditorSubmit} disabled={!hasEnoughReviewers || !editorRecommendation} className="mt-6 px-6 py-2 bg-[#059669] text-white font-medium rounded-md hover:bg-[#047857] disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-colors">
                                    Send Recommendation to EIC
                                </button>
                            </div>
                        </>
                    )}

                    {/* --- 5. EIC ONLY: Final Decision Panel --- */}
                    {isEIC && (
                        <>
                            <div className="border-t border-[#e5e7eb]"></div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-[#059669] mb-4">EIC Final Decision & Author Feedback</h3>
                                
                                {currentEditor?.Recommendation ? (
                                    <>
                                        <div className="mb-6 p-4 bg-white rounded-md border border-emerald-100">
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Editor's Official Recommendation</p>
                                            <div className="flex items-center gap-3">
                                                {getRecommendationBadge(currentEditor.Recommendation)}
                                                <span className="text-sm italic text-gray-600">"{currentEditor.Recommendation}"</span>
                                            </div>
                                        </div>

                                        {/* Select Comments to Send */}
                                        <div className="mb-6">
                                            <p className="text-sm font-bold text-[#1f2937] mb-2">Select Reviewer Comments to include in Author Email:</p>
                                            <p className="text-xs text-[#059669] font-medium mb-3">Checking a box will make that comment permanently visible to the author on their dashboard.</p>
                                            <div className="space-y-2 bg-white p-3 rounded-md border border-emerald-100 max-h-48 overflow-y-auto">
                                                {filteredAndSortedReviews.filter(r => r.Comment).length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic">No comments submitted by reviewers yet.</p>
                                                ) : (
                                                    filteredAndSortedReviews.filter(r => r.Comment).map((r, idx) => (
                                                        <label key={r.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                                                            <input type="checkbox" className="mt-1 rounded text-[#059669] focus:ring-[#059669]" checked={selectedCommentsToAuthor.has(r.id)} onChange={() => toggleAuthorComment(r.id)} />
                                                            <div className="text-sm text-gray-700">
                                                                <span className="font-bold">Reviewer {idx + 1}: </span>"{r.Comment}"
                                                            </div>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 items-center">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-200 hover:border-green-500">
                                                <input type="radio" name="hostDecision" value="Accepted" checked={hostDecision === 'Accepted'} onChange={(e) => setHostDecision(e.target.value)} className="text-green-600 focus:ring-green-500" />
                                                <span className="text-sm font-bold text-green-700">Accept</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-200 hover:border-yellow-500">
                                                <input type="radio" name="hostDecision" value="Minor Revision" checked={hostDecision === 'Minor Revision'} onChange={(e) => setHostDecision(e.target.value)} className="text-yellow-600 focus:ring-yellow-500" />
                                                <span className="text-sm font-bold text-yellow-700">Minor Revision</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-200 hover:border-orange-500">
                                                <input type="radio" name="hostDecision" value="Major Revision" checked={hostDecision === 'Major Revision'} onChange={(e) => setHostDecision(e.target.value)} className="text-orange-600 focus:ring-orange-500" />
                                                <span className="text-sm font-bold text-orange-700">Major Revision</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-200 hover:border-red-500">
                                                <input type="radio" name="hostDecision" value="Rejected" checked={hostDecision === 'Rejected'} onChange={(e) => setHostDecision(e.target.value)} className="text-red-600 focus:ring-red-500" />
                                                <span className="text-sm font-bold text-red-700">Reject</span>
                                            </label>
                                        </div>
                                        <button onClick={handleFinalSubmit} disabled={!hostDecision} className="mt-6 px-6 py-2 bg-[#059669] text-white font-medium rounded-md hover:bg-[#047857] disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm transition-colors">
                                            Submit Final Decision & Notify Author
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 font-medium text-sm flex items-start gap-2">
                                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        You must wait for the assigned Editor to submit their formal recommendation before you can log the final decision.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* --- REVIEW DETAILS MODAL --- */}
            {viewReviewModalOpen && selectedReview && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[110]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                            <h3 className="text-lg font-bold text-[#1f2937]">Detailed Review Submission</h3>
                            <button onClick={() => setViewReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Reviewer Information</p>
                                    <p className="font-bold text-[#1f2937]">{selectedReview.User?.firstname} {selectedReview.User?.lastname}</p>
                                    <p className="text-sm text-[#6b7280]">{selectedReview.User?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Status & Recommendation</p>
                                    <div className="mb-2">{getStatusBadge(selectedReview.Status)}</div>
                                    <div>{getRecommendationBadge(selectedReview.Recommendation)}</div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-3">Evaluation Metrics (Out of 10)</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Originality</p>
                                        <p className="font-bold text-[#1f2937]">{selectedReview.scoreOriginality ?? '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Clarity</p>
                                        <p className="font-bold text-[#1f2937]">{selectedReview.scoreClarity ?? '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Soundness</p>
                                        <p className="font-bold text-[#1f2937]">{selectedReview.scoreSoundness ?? '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Significance</p>
                                        <p className="font-bold text-[#1f2937]">{selectedReview.scoreSignificance ?? '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Relevance</p>
                                        <p className="font-bold text-[#1f2937]">{selectedReview.scoreRelevance ?? '—'}</p>
                                    </div>
                                    <div className="bg-[#e6f4ea] p-3 rounded border border-[#a8dab5]">
                                        <p className="text-xs text-[#059669] font-bold mb-1">Average Score</p>
                                        <p className="font-bold text-[#059669] text-lg">{selectedReview.avgScore ? selectedReview.avgScore.toFixed(1) : '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-2">Written Feedback</p>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-[#1f2937] whitespace-pre-wrap min-h-[100px]">
                                    {selectedReview.Comment || <span className="text-gray-400 italic">No written feedback provided.</span>}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb] text-right">
                            <button onClick={() => setViewReviewModalOpen(false)} className="px-5 py-2 bg-white border border-[#e5e7eb] text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50">
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DESK REJECT MODAL --- */}
            {deskRejectModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[120]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-red-50">
                            <h3 className="text-lg font-bold text-red-800">Desk Reject Manuscript</h3>
                            <button onClick={() => setDeskRejectModalOpen(false)} className="text-red-400 hover:text-red-600 text-xl leading-none">✕</button>
                        </div>
                        
                        <form onSubmit={submitDeskReject} className="p-5">
                            <div className="mb-4 text-sm text-gray-700">
                                <p className="mb-2">You are about to reject this paper without sending it for peer review.</p>
                                <p className="font-bold">Please provide a reason to be emailed to the author:</p>
                            </div>
                            
                            <textarea 
                                required
                                rows={6}
                                placeholder="e.g., This manuscript falls outside the scope of our journal..."
                                value={deskRejectMessage}
                                onChange={(e) => setDeskRejectMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-red-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-none"
                            />

                            <div className="flex gap-3 pt-4 mt-4">
                                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-md hover:bg-red-700 shadow-sm transition-colors">
                                    Confirm Desk Reject & Send Email
                                </button>
                                <button type="button" onClick={() => setDeskRejectModalOpen(false)} className="px-4 py-2 bg-white border border-[#e5e7eb] text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- UNIFIED USER SELECTION MODAL --- */}
            {userModal.open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
                            <h3 className="text-lg font-bold text-[#1f2937]">
                                {userModal.context} {userModal.role}
                            </h3>
                            <button onClick={() => setUserModal({ open: false, role: '', context: '' })} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>
                        
                        <div className="flex border-b border-[#e5e7eb] px-5 pt-3 bg-white overflow-x-auto">
                            <button 
                                className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'directory' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => { setUserModalTab('directory'); setUserSearchTerm(''); }}
                            >
                                Registered {userModal.role}s
                            </button>
                            <button 
                                className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'upgrade_journal' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => { setUserModalTab('upgrade_journal'); setUserSearchTerm(''); }}
                            >
                                Upgrade Journal User
                            </button>
                            <button 
                                className={`pb-3 mr-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'upgrade_network' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => { setUserModalTab('upgrade_network'); setUserSearchTerm(''); }}
                            >
                                Upgrade Network User
                            </button>
                            <button 
                                className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${userModalTab === 'new' ? 'text-[#059669] border-[#059669]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                onClick={() => setUserModalTab('new')}
                            >
                                Invite Brand New User
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                            {userModalTab === 'new' ? (
                                <form onSubmit={(e) => { e.preventDefault(); handleUserSelectionSubmit(null, false, true); }} className="space-y-4 max-w-md mx-auto mt-4">
                                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                        <p className="text-sm text-gray-600 mb-2">We will create a temporary account, assign them the <strong>{userModal.role}</strong> role, attach them to this paper, and automatically email them login instructions.</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="First Name *" required value={inviteForm.firstname} onChange={e => setInviteForm({...inviteForm, firstname: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                            <input type="text" placeholder="Last Name *" required value={inviteForm.lastname} onChange={e => setInviteForm({...inviteForm, lastname: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                        </div>
                                        <input type="email" placeholder="Email Address *" required value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
                                        
                                        <button type="submit" className="w-full mt-2 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                                            Register & {userModal.context}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder={`Search by name, email, organisation, or expertise...`}
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white shadow-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {(userModalTab === 'upgrade_journal' || userModalTab === 'upgrade_network') && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                            <p className="text-xs text-yellow-800 font-medium">These users do not currently hold the <strong>{userModal.role}</strong> role in this journal. Selecting them will grant them the role and assign them to this paper.</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 mt-4">
                                        {modalUsersToDisplay.length === 0 ? (
                                            <div className="text-center py-8 bg-white rounded-md border border-gray-200">
                                                <p className="text-sm text-gray-500 italic">No users found matching your search.</p>
                                            </div>
                                        ) : (
                                            modalUsersToDisplay.map(u => (
                                                <div key={u.id} className="p-4 border border-[#e5e7eb] rounded-md hover:border-[#059669] flex justify-between items-center bg-white shadow-sm transition-colors group">
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-[#1f2937]">{u.firstname} {u.lastname}</p>
                                                            <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{u.email}</p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:gap-6 mt-2">
                                                            <p className="text-xs text-[#059669] font-medium"><span className="text-gray-500">Org:</span> {u.organisation || 'Not Specified'}</p>
                                                            <p className="text-xs text-[#059669] font-medium truncate" title={u.expertise?.length ? u.expertise.join(', ') : ''}><span className="text-gray-500">Expertise:</span> {u.expertise?.length ? u.expertise.join(', ') : 'Not Specified'}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleUserSelectionSubmit(u.id, userModalTab.includes('upgrade'), false)} 
                                                        className="ml-2 px-5 py-2 bg-emerald-50 text-[#059669] border border-[#059669] font-bold text-xs rounded hover:bg-[#059669] hover:text-white transition-colors whitespace-nowrap"
                                                    >
                                                        {userModalTab.includes('upgrade') ? `Upgrade & ${userModal.context}` : userModal.context}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


