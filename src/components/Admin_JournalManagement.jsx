"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext"; 

const Header = ({ user, handleLogout }) => {
    const navigate = useNavigate();

    const ROLE_CONFIG = {
        "Author": { label: "Author", path: "/journal" },
        "Journal Editor": { label: "Editor", path: "/journal/editor" },
        "Journal Reviewer": { label: "Reviewer", path: "/journal/ManageReviews" },
        "Global Admin": { label: "Admin Portal", path: "/admin" }
    };

    return (
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase Admin</span>
            </div>
            <nav className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/conferences')} 
                className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]"
              >
                Conference Admin
              </button>
              <button 
                onClick={() => navigate('/admin/journal')} 
                className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]"
              >
                Journal Admin
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
          </div>
        </div>
        </header>
    );
};

export default function AdminJournals() {
    const navigate = useNavigate();
    const { user, setUser, setloginStatus,loading } = useUserData();

    const [activeTab, setActiveTab] = useState("stats");
    const [pendingJournals, setPendingJournals] = useState({ newPending: [] });
    const [journalStats, setJournalStats] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const [showJournalModal, setShowJournalModal] = useState(false);
    const [selectedJournal, setSelectedJournal] = useState(null);
    const [isLoadingJournal, setIsLoadingJournal] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user || user.isAdmin != 1) { 
            setUser(null);
            setloginStatus(false);
            navigate("/home");
        } else {
            fetch('http://localhost:3001/admin/journals/pending')
                .then(res => res.json())
                .then(data => setPendingJournals(data))
                .catch(err => console.error("Failed to fetch pending journals:", err));

            fetch('http://localhost:3001/admin/journals/stats')
                .then(res => res.json())
                .then(data => setJournalStats(data.stats))
                .catch(err => console.error("Failed to fetch journal stats:", err));
        }
    }, [user, loading, navigate, setUser, setloginStatus]);

    const handleLogout = () => {
        setUser(null);
        setloginStatus(false);
        navigate("/home");
    };

    const handleSort = (column) => {
        if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortBy(column); setSortOrder("asc"); }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch('http://localhost:3001/admin/journals/approve', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ journalId: id })
            });
            if (res.ok) {
                setPendingJournals(prev => ({ ...prev, newPending: prev.newPending.filter(j => j.id !== id) }));
                fetch('http://localhost:3001/admin/journals/stats').then(res => res.json()).then(data => setJournalStats(data.stats));
            }
        } catch (error) { console.error(error); }
    };

    const handleReject = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to reject this journal request? This action will notify the user.");
        if (!isConfirmed) return;

        try {
            const res = await fetch('http://localhost:3001/admin/journals/reject', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ journalId: id })
            });
            if (res.ok) {
                setPendingJournals(prev => ({ ...prev, newPending: prev.newPending.filter(j => j.id !== id) }));
                setShowJournalModal(false);
            }
        } catch (error) { console.error(error); }
    };

    const handleViewJournal = async (id) => {
        setShowJournalModal(true);
        setIsLoadingJournal(true);
        setSelectedJournal(null);
        try {
            const response = await fetch('http://localhost:3001/get-journal-by-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journalId: id.toString() })
            });
            const data = await response.json();
            setSelectedJournal(data.journal);
        } catch (error) {
            console.error("Failed to fetch journal details", error);
        } finally {
            setIsLoadingJournal(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    const processedPending = useMemo(() => {
        let filtered = pendingJournals.newPending?.filter(j =>
            j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.Publication?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
        return filtered.sort((a, b) => {
            let aVal = a[sortBy] || ""; let bVal = b[sortBy] || "";
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [pendingJournals, searchTerm, sortBy, sortOrder]);

    const processedStats = useMemo(() => {
        let filtered = journalStats.filter(j => j.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.sort((a, b) => {
            let aVal = sortBy === 'Papers' ? a._count?.Papers || 0 : a[sortBy];
            let bVal = sortBy === 'Papers' ? b._count?.Papers || 0 : b[sortBy];
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [journalStats, searchTerm, sortBy, sortOrder]);

    const totalJournals = journalStats.length;
    const activeJournals = journalStats.filter(j => j.status === 'Open' || j.status === 'Active').length;
    const pendingApprovalsCount = pendingJournals.newPending?.length || 0;
    const totalPapersAcrossJournals = journalStats.reduce((sum, j) => sum + (j._count?.Papers || 0), 0);
    const avgPapersPerJournal = totalJournals > 0 ? Math.round(totalPapersAcrossJournals / totalJournals) : 0;

    const TabButton = ({ id, label, count }) => (
        <button onClick={() => setActiveTab(id)} className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === id ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"}`}>
            {label} {count > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#ffffff]">
            
            <Header user={user} handleLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937]">Journal Operations</h2>
                        <p className="text-[#6b7280] mt-1">Manage journal approvals, monitor editorial boards, and analyze platform-wide submission volumes.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Total Journals</h3>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-bold text-[#1f2937]">{totalJournals}</p>
                            <span className="text-xs font-semibold text-[#f59e0b] bg-yellow-100 px-2 py-1 rounded">{pendingApprovalsCount} Pending</span>
                        </div>
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Active Journals</h3>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-bold text-[#1f2937]">{activeJournals}</p>
                            <span className="text-xs font-semibold text-[#059669] bg-green-100 px-2 py-1 rounded">Accepting</span>
                        </div>
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Total Papers Hosted</h3>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-bold text-[#1f2937]">{totalPapersAcrossJournals}</p>
                            <span className="text-xs font-semibold text-[#3b82f6] bg-blue-100 px-2 py-1 rounded">Submissions</span>
                        </div>
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Avg. Papers / Journal</h3>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-bold text-[#1f2937]">{avgPapersPerJournal}</p>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded">Density</span>
                        </div>
                    </div>
                </div>

                <div className="border-b border-[#e5e7eb] flex gap-6 mb-6">
                    <TabButton id="stats" label="All Journal Data" />
                    <TabButton id="new" label="Pending Approvals" count={pendingApprovalsCount} />
                </div>

                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg flex flex-col shadow-sm">
                    <div className="p-4 border-b border-[#e5e7eb]">
                        <input type="text" placeholder="Search journals by name or publisher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e5e7eb] bg-white">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("name")}>
                                        Journal {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </th>
                                    {activeTab === "new" ? (
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Host / Publisher</th>
                                    ) : (
                                        <>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("status")}>Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("Papers")}>Papers {sortBy === "Papers" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                                        </>
                                    )}
                                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === "new" ? processedPending.map(journal => (
                                    <tr key={journal.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors bg-white">
                                        <td className="py-3 px-4 font-medium text-[#1f2937]">{journal.name} <br /><span className="text-xs text-[#6b7280] flex items-center gap-1 mt-1">📚 {journal.Publication}</span></td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm font-medium text-[#1f2937]">{journal.host?.firstname} {journal.host?.lastname}</p>
                                            <p className="text-xs text-[#6b7280]">{journal.host?.email}</p>
                                        </td>
                                        <td className="py-3 px-4 flex gap-2">
                                            <button onClick={() => handleViewJournal(journal.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                            <button onClick={() => handleApprove(journal.id)} className="px-3 py-1.5 text-xs font-medium bg-[#059669] text-white rounded shadow hover:bg-[#047857] transition-colors">Approve</button>
                                            <button onClick={() => handleReject(journal.id)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors">Reject</button>
                                        </td>
                                    </tr>
                                )) : processedStats.map(stat => (
                                    <tr key={stat.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors bg-white">
                                        <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{stat.name}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stat.status === 'Open' || stat.status === 'Active' ? 'bg-green-100 text-green-800' : stat.status === 'Closed' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {stat.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{stat._count?.Papers || 0}</td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => handleViewJournal(stat.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                                {(activeTab === "new" && processedPending.length === 0) || (activeTab === "stats" && processedStats.length === 0) ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-[#6b7280] bg-white">No matching journals found.</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* DETAILED JOURNAL MODAL */}
            {showJournalModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb] bg-white rounded-t-lg">
                            <h3 className="text-xl font-bold text-[#1f2937]">Journal Details</h3>
                            <button onClick={() => setShowJournalModal(false)} className="text-[#6b7280] hover:text-[#1f2937] text-2xl leading-none">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {isLoadingJournal ? (
                                <p className="text-center text-[#6b7280] py-8">Loading complete details...</p>
                            ) : selectedJournal ? (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-3xl font-bold text-[#1f2937]">{selectedJournal.name}</h4>
                                            <p className="text-[#6b7280] mt-1 flex items-center gap-2 font-medium">📚 {selectedJournal.Publication}</p>
                                            {selectedJournal.link && <a href={selectedJournal.link} target="_blank" rel="noreferrer" className="text-sm text-[#059669] hover:underline mt-2 block font-medium">🔗 Visit Journal Website</a>}
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border mr-2 ${selectedJournal.status === 'Open' || selectedJournal.status === 'Active' ? 'bg-green-50 text-green-800 border-green-200' : selectedJournal.status === 'Pending' || selectedJournal.status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                                {selectedJournal.status}
                                            </span>

                                            {(selectedJournal.status === 'Pending' || selectedJournal.status === 'Pending Approval') && (
                                                <>
                                                    <button
                                                        onClick={() => handleReject(selectedJournal.id)}
                                                        className="px-4 py-2 text-sm font-medium bg-white text-red-600 border border-red-600 rounded-md shadow-sm hover:bg-red-50 transition-colors"
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleApprove(selectedJournal.id);
                                                            setShowJournalModal(false); 
                                                        }}
                                                        className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md shadow hover:bg-[#047857] transition-colors"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Publisher</p>
                                            <p className="text-lg font-bold text-[#1f2937] mt-1">{selectedJournal.Publication}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Host User</p>
                                            <p className="text-lg font-bold text-[#1f2937] mt-1">{selectedJournal.host?.firstname} {selectedJournal.host?.lastname}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Platform Status</p>
                                            <p className="text-lg font-bold text-[#059669] mt-1">{selectedJournal.status}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Submitted On</p>
                                            <p className="text-lg font-bold text-[#1f2937] mt-1">{formatDate(selectedJournal.submittedAt)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-bold text-[#1f2937] mb-4 uppercase tracking-wider border-b border-[#e5e7eb] pb-2">Editorial Administration</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                <p className="text-xs text-[#059669] font-bold mb-2 uppercase tracking-wider">Journal Host</p>
                                                {selectedJournal.host ? (
                                                    <div>
                                                        <p className="text-base font-bold text-[#1f2937]">{selectedJournal.host.firstname} {selectedJournal.host.lastname}</p>
                                                        <p className="text-sm text-[#6b7280] mt-1">{selectedJournal.host.email}</p>
                                                        <p className="text-xs text-[#6b7280] mt-1 italic">{selectedJournal.host.organisation || 'No Org Listed'}</p>
                                                    </div>
                                                ) : <p className="text-sm text-[#6b7280] italic">None assigned</p>}
                                            </div>

                                            <div className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                <p className="text-xs text-[#059669] font-bold mb-2 uppercase tracking-wider">Editor-in-Chief</p>
                                                {selectedJournal.EIC ? (
                                                    <div>
                                                        <p className="text-base font-bold text-[#1f2937]">{selectedJournal.EIC.firstname} {selectedJournal.EIC.lastname}</p>
                                                        <p className="text-sm text-[#6b7280] mt-1">{selectedJournal.EIC.email}</p>
                                                        <p className="text-xs text-[#6b7280] mt-1 italic">{selectedJournal.EIC.organisation || 'No Org Listed'}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-[#6b7280] italic">Not Yet Assigned</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-red-500 py-8">Failed to load details.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}