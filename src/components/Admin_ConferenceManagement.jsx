"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext"; // Needed for the Header

// --- Restored Original Header Component ---
const Header = ({ user, handleLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const ROLE_CONFIG = {
        "Author": { label: "Author", path: "/journal" },
        "Journal Editor": { label: "Editor", path: "/journal/editor" },
        "Journal Reviewer": { label: "Reviewer", path: "/journal/ManageReviews" },
        "Global Admin": { label: "Admin Portal", path: "/admin" }
    };

    const availablePortals = useMemo(() => {
        if (!user || !user.role || !Array.isArray(user.role)) return [];
        return user.role
            .map(roleString => ROLE_CONFIG[roleString])
            .filter(Boolean);
    }, [user]);

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

export default function AdminConferences() {
    const navigate = useNavigate();
    const { user, setUser, setloginStatus, loading } = useUserData();

    const [activeTab, setActiveTab] = useState("stats");
    const [pendingConferences, setPendingConferences] = useState({ newPending: [] });
    const [conferenceStats, setConferenceStats] = useState([]);

    // Sort & Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    // Modal State
    const [showConfModal, setShowConfModal] = useState(false);
    const [selectedConf, setSelectedConf] = useState(null);
    const [isLoadingConf, setIsLoadingConf] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user || user.isAdmin != 1) { 
            setUser(null);
            setloginStatus(false);
            navigate("/home");
        } else {
            fetch('http://localhost:3001/admin/conferences/pending')
                .then(res => res.json())
                .then(data => setPendingConferences(data))
                .catch(err => console.error("Failed to fetch pending conferences:", err));

            fetch('http://localhost:3001/admin/conferences/stats')
                .then(res => res.json())
                .then(data => setConferenceStats(data.stats))
                .catch(err => console.error("Failed to fetch conference stats:", err));
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
            const res = await fetch('http://localhost:3001/admin/conferences/approve', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conferenceId: id })
            });
            if (res.ok) {
                setPendingConferences(prev => ({ ...prev, newPending: prev.newPending.filter(c => c.id !== id) }));
                fetch('http://localhost:3001/admin/conferences/stats').then(res => res.json()).then(data => setConferenceStats(data.stats));
            }
        } catch (error) { console.error(error); }
    };

    const handleViewConference = async (id) => {
        setShowConfModal(true);
        setIsLoadingConf(true);
        setSelectedConf(null);
        try {
            const response = await fetch('http://localhost:3001/get-conference-by-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conferenceId: id.toString() })
            });
            const data = await response.json();
            setSelectedConf(data.conference);
        } catch (error) {
            console.error("Failed to fetch conference details", error);
        } finally {
            setIsLoadingConf(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    // Memoized Sorting & Filtering
    const processedPending = useMemo(() => {
        let filtered = pendingConferences.newPending?.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.location?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
        return filtered.sort((a, b) => {
            let aVal = a[sortBy] || ""; let bVal = b[sortBy] || "";
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [pendingConferences, searchTerm, sortBy, sortOrder]);

    const processedStats = useMemo(() => {
        let filtered = conferenceStats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.sort((a, b) => {
            let aVal = sortBy === 'Paper' ? a._count?.Paper || 0 : a[sortBy];
            let bVal = sortBy === 'Paper' ? b._count?.Paper || 0 : b[sortBy];
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [conferenceStats, searchTerm, sortBy, sortOrder]);

    // Derived Extended Stats for the Analytical Grid
    const totalConfs = conferenceStats.length;
    const activeConfs = conferenceStats.filter(c => c.status === 'Open').length;
    const closedConfs = conferenceStats.filter(c => c.status === 'Closed').length;
    const pendingApprovalsCount = pendingConferences.newPending?.length || 0;

    const totalPapersAcrossConfs = conferenceStats.reduce((sum, conf) => sum + (conf._count?.Paper || 0), 0);
    const totalReviewersAcrossConfs = conferenceStats.reduce((sum, conf) => sum + (conf._count?.Reviewers || 0), 0);
    const totalTracksAcrossConfs = conferenceStats.reduce((sum, conf) => sum + (conf._count?.Tracks || 0), 0);
    const avgPapersPerConf = totalConfs > 0 ? Math.round(totalPapersAcrossConfs / totalConfs) : 0;

    const TabButton = ({ id, label, count }) => (
        <button onClick={() => setActiveTab(id)} className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === id ? "border-[#059669] text-[#059669]" : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"}`}>
            {label} {count > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#ffffff]">
            
            {/* Exact Header from your JournalPortal.jsx */}
            <Header user={user} handleLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937]">Conference Operations</h2>
                        <p className="text-[#6b7280] mt-1">Manage event approvals, monitor active tracks, and analyze platform-wide submission volumes.</p>
                    </div>
                </div>

                {/* EXTENDED 8-CARD STATS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Platform Events</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#1f2937]">{totalConfs}</p>
                            <span className="text-xs text-[#6b7280]">All time</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Active Events</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#059669]">{activeConfs}</p>
                            <span className="text-xs text-[#059669] bg-green-100 px-2 py-0.5 rounded">Running</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Pending Approvals</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#f59e0b]">{pendingApprovalsCount}</p>
                            <span className="text-xs text-[#f59e0b] bg-yellow-100 px-2 py-0.5 rounded">Action Req.</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Archived / Closed</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#1f2937]">{closedConfs}</p>
                            <span className="text-xs text-[#6b7280] bg-gray-200 px-2 py-0.5 rounded">Ended</span>
                        </div>
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Total Papers Hosted</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#1f2937]">{totalPapersAcrossConfs}</p>
                            <span className="text-xs text-[#6b7280]">Submissions</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Avg. Papers / Event</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#1f2937]">{avgPapersPerConf}</p>
                            <span className="text-xs text-[#6b7280]">Density</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Active Reviewers</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#3b82f6]">{totalReviewersAcrossConfs}</p>
                            <span className="text-xs text-[#3b82f6] bg-blue-100 px-2 py-0.5 rounded">Assigned</span>
                        </div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                        <h3 className="text-sm font-medium text-[#6b7280]">Total Tracks</h3>
                        <div className="flex items-end justify-between mt-1">
                            <p className="text-3xl font-bold text-[#1f2937]">{totalTracksAcrossConfs}</p>
                            <span className="text-xs text-[#6b7280]">Pathways</span>
                        </div>
                    </div>
                </div>

                {/* TABS (Pending Changes Removed) */}
                <div className="border-b border-[#e5e7eb] flex gap-6 mb-6">
                    <TabButton id="stats" label="All Conference Data" />
                    <TabButton id="new" label="Pending Approvals" count={pendingApprovalsCount} />
                </div>

                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg flex flex-col shadow-sm">
                    <div className="p-4 border-b border-[#e5e7eb]">
                        <input type="text" placeholder="Search conferences by name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e5e7eb] bg-white">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("name")}>
                                        Conference {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </th>
                                    {activeTab === "new" ? (
                                        <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Host Organizer</th>
                                    ) : (
                                        <>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("status")}>Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]" onClick={() => handleSort("Paper")}>Papers {sortBy === "Paper" && (sortOrder === "asc" ? "↑" : "↓")}</th>
                                        </>
                                    )}
                                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === "new" ? processedPending.map(conf => (
                                    <tr key={conf.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors bg-white">
                                        <td className="py-3 px-4 font-medium text-[#1f2937]">{conf.name} <br /><span className="text-xs text-[#6b7280] flex items-center gap-1 mt-1">📍 {conf.location}</span></td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm font-medium text-[#1f2937]">{conf.host?.firstname} {conf.host?.lastname}</p>
                                            <p className="text-xs text-[#6b7280]">{conf.host?.email}</p>
                                        </td>
                                        <td className="py-3 px-4 flex gap-2">
                                            <button onClick={() => handleViewConference(conf.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                            <button onClick={() => handleApprove(conf.id)} className="px-3 py-1.5 text-xs font-medium bg-[#059669] text-white rounded shadow hover:bg-[#047857] transition-colors">Approve</button>
                                        </td>
                                    </tr>
                                )) : processedStats.map(stat => (
                                    <tr key={stat.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors bg-white">
                                        <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{stat.name}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stat.status === 'Open' ? 'bg-green-100 text-green-800' : stat.status === 'Closed' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {stat.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{stat._count?.Paper || 0}</td>
                                        <td className="py-3 px-4">
                                            <button onClick={() => handleViewConference(stat.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                                {(activeTab === "new" && processedPending.length === 0) || (activeTab === "stats" && processedStats.length === 0) ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-[#6b7280] bg-white">No matching conferences found.</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* DETAILED CONFERENCE MODAL (With no Close Button at bottom, and Host/Chairs Data) */}
            {showConfModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb] bg-white rounded-t-lg">
                            <h3 className="text-xl font-bold text-[#1f2937]">Conference Details</h3>
                            <button onClick={() => setShowConfModal(false)} className="text-[#6b7280] hover:text-[#1f2937] text-2xl leading-none">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {isLoadingConf ? (
                                <p className="text-center text-[#6b7280] py-8">Loading complete details...</p>
                            ) : selectedConf ? (
                                <div className="space-y-8">
                                    {/* Header Info */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-3xl font-bold text-[#1f2937]">{selectedConf.name}</h4>
                                            <p className="text-[#6b7280] mt-1 flex items-center gap-2 font-medium">📍 {selectedConf.location}</p>
                                            {selectedConf.link && <a href={selectedConf.link} target="_blank" rel="noreferrer" className="text-sm text-[#059669] hover:underline mt-2 block font-medium">🔗 Visit Conference Website</a>}
                                        </div>

                                        {/* Status Badge & Approve Button */}
                                        <div className="flex flex-col items-end gap-3">
                                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border ${selectedConf.status === 'Open' ? 'bg-green-50 text-green-800 border-green-200' : selectedConf.status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                                {selectedConf.status}
                                            </span>

                                            {/* Show Approve Button ONLY if status is Pending Approval */}
                                            {selectedConf.status === 'Pending Approval' && (
                                                <button
                                                    onClick={() => {
                                                        handleApprove(selectedConf.id);
                                                        setShowConfModal(false); // Closes the modal after approval
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md shadow hover:bg-[#047857] transition-colors"
                                                >
                                                    ✓ Approve Conference
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Start Date</p>
                                            <p className="text-lg font-bold text-[#1f2937] mt-1">{formatDate(selectedConf.startsAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">End Date</p>
                                            <p className="text-lg font-bold text-[#1f2937] mt-1">{formatDate(selectedConf.endAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Submission Deadline</p>
                                            <p className="text-lg font-bold text-red-600 mt-1">{formatDate(selectedConf.deadline)}</p>
                                        </div>
                                    </div>

                                    {/* Organizers and Committee */}
                                    <div>
                                        <h5 className="text-sm font-bold text-[#1f2937] mb-4 uppercase tracking-wider border-b border-[#e5e7eb] pb-2">Core Organizers & Committee</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                            {/* Host Card */}
                                            <div className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                <p className="text-xs text-[#059669] font-bold mb-2 uppercase tracking-wider">Conference Host</p>
                                                {selectedConf.host ? (
                                                    <div>
                                                        <p className="text-base font-bold text-[#1f2937]">{selectedConf.host.firstname} {selectedConf.host.lastname}</p>
                                                        <p className="text-sm text-[#6b7280] mt-1">{selectedConf.host.email}</p>
                                                        <p className="text-xs text-[#6b7280] mt-1 italic">{selectedConf.host.organisation || 'No Org Listed'}</p>
                                                    </div>
                                                ) : <p className="text-sm text-[#6b7280] italic">None assigned</p>}
                                            </div>

                                            {/* Publication Chairs */}
                                            <div className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                <p className="text-xs text-[#059669] font-bold mb-2 uppercase tracking-wider">Publication Chairs</p>
                                                <div className="space-y-3">
                                                    {selectedConf.PublicationChairs?.length > 0 ? selectedConf.PublicationChairs.map(c => (
                                                        <div key={c.id}>
                                                            <p className="text-sm font-bold text-[#1f2937]">{c.firstname} {c.lastname}</p>
                                                            <p className="text-xs text-[#6b7280]">{c.organisation || 'No Org Listed'}</p>
                                                        </div>
                                                    )) : <p className="text-sm text-[#6b7280] italic">None assigned</p>}
                                                </div>
                                            </div>

                                            {/* Registration Chairs */}
                                            <div className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                <p className="text-xs text-[#059669] font-bold mb-2 uppercase tracking-wider">Registration Chairs</p>
                                                <div className="space-y-3">
                                                    {selectedConf.RegistrationChairs?.length > 0 ? selectedConf.RegistrationChairs.map(c => (
                                                        <div key={c.id}>
                                                            <p className="text-sm font-bold text-[#1f2937]">{c.firstname} {c.lastname}</p>
                                                            <p className="text-xs text-[#6b7280]">{c.organisation || 'No Org Listed'}</p>
                                                        </div>
                                                    )) : <p className="text-sm text-[#6b7280] italic">None assigned</p>}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Tracks and Track Chairs */}
                                    <div>
                                        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2 mb-4">
                                            <h5 className="text-sm font-bold text-[#1f2937] uppercase tracking-wider">Tracks & Dedicated Chairs</h5>
                                        </div>

                                        {selectedConf.Tracks && selectedConf.Tracks.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedConf.Tracks.map(t => (
                                                    <div key={t.id} className="bg-white p-4 border border-[#e5e7eb] rounded-lg shadow-sm">
                                                        <h6 className="text-base font-bold text-[#1f2937] mb-3 pb-2 border-b border-gray-100">{t.Name}</h6>
                                                        {t.Chairs && t.Chairs.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {t.Chairs.map(c => (
                                                                    <div key={c.id} className="flex flex-col">
                                                                        <p className="text-sm font-medium text-[#374151]">• {c.firstname} {c.lastname}</p>
                                                                        <p className="text-xs text-[#6b7280] ml-3">{c.organisation || 'No Org Listed'}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <p className="text-sm text-[#6b7280] italic">No chairs assigned to this track.</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-[#6b7280]">No specific tracks have been defined for this event.</p>}
                                    </div>

                                    {/* Partners */}
                                    {selectedConf.Partners && selectedConf.Partners.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-bold text-[#1f2937] mb-3 uppercase tracking-wider border-b border-[#e5e7eb] pb-2">Official Partners</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedConf.Partners.map((p, i) => <span key={i} className="px-3 py-1.5 text-sm font-medium bg-white border border-[#e5e7eb] rounded-full text-[#374151] shadow-sm">{p}</span>)}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <p className="text-center text-red-500 py-8">Failed to load details.</p>
                            )}
                        </div>
                        {/* The bottom "Close Viewer" button is entirely removed as requested */}
                    </div>
                </div>
            )}
        </div>
    );
}