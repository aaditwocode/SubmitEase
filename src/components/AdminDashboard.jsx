"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

export default function AdminDashboard() {
  const { user, setUser, setloginStatus, loading } = useUserData();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  
  // Modal State for Conferences
  const [showConfModal, setShowConfModal] = useState(false);
  const [selectedConf, setSelectedConf] = useState(null);
  const [isLoadingConf, setIsLoadingConf] = useState(false);

  // Modal State for Journals
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);

useEffect(() => {
    // 1. If the context is still loading, DO NOTHING. Just wait.
    if (loading) return;

    // 2. Only check the user AFTER loading is completely finished.
    if (!user || user.isAdmin != 1) { // Make sure the casing matches your DB (isAdmin vs isadmin)
       setUser(null);
       setloginStatus(false);
       navigate("/home");
    } else {
       // 3. User is fully verified as Admin, fetch the data!
       fetchGlobalStats();
    }
  }, [user, loading, navigate, setUser, setloginStatus]);

  // Show a spinner while checking auth (Must be placed AFTER the useEffect)
  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <p className="text-lg text-[#6b7280] font-medium">Checking Admin Credentials...</p>
          </div>
      );
  }

  const fetchGlobalStats = () => {
    fetch('http://localhost:3001/admin/global-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // --- CONFERENCE HANDLERS ---
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

  const handleApprove = async (id) => {
    try {
      const res = await fetch('http://localhost:3001/admin/conferences/approve', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ conferenceId: id })
      });
      if (res.ok) {
        setShowConfModal(false);
        fetchGlobalStats(); 
      }
    } catch (error) { 
      console.error("Approval failed", error); 
    }
  };

  // --- JOURNAL HANDLERS ---
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

  const handleApproveJournal = async (id) => {
      try {
          const res = await fetch('http://localhost:3001/admin/journals/approve', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ journalId: id })
          });
          if (res.ok) {
              setShowJournalModal(false);
              fetchGlobalStats(); 
          }
      } catch (error) { console.error("Journal Approval failed", error); }
  };

  const handleRejectJournal = async (id) => {
      const isConfirmed = window.confirm("Are you sure you want to reject this journal request? This action will notify the user.");
      if (!isConfirmed) return;

      try {
          const res = await fetch('http://localhost:3001/admin/journals/reject', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ journalId: id })
          });
          if (res.ok) {
              setShowJournalModal(false);
              fetchGlobalStats();
          }
      } catch (error) { console.error(error); }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase Admin</span>
            </div>
            <nav className="flex items-center gap-3">
              <button onClick={() => navigate('/admin/conferences')} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]">Conference Admin</button>
              <button onClick={() => navigate('/admin/journal')} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#047857]">Journal Admin</button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-[#1f2937]">Platform Overview</h2>
                <p className="text-[#6b7280] mt-1">Monitor system health, recent activity, and platform growth.</p>
            </div>
            <div className="text-sm font-medium text-[#059669] bg-[#059669]/10 px-3 py-1 rounded-full">System Status: Online</div>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <h3 className="text-sm font-medium text-[#6b7280]">Total Conferences</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-4xl font-bold text-[#1f2937]">{stats.conferences.total}</p>
                    <span className="text-xs font-semibold text-[#f59e0b] bg-yellow-100 px-2 py-1 rounded">{stats.conferences.pending} Pending</span>
                </div>
              </div>

              {/* UPDATED: Journals Count matches Conferences styling */}
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <h3 className="text-sm font-medium text-[#6b7280]">Registered Journals</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-4xl font-bold text-[#1f2937]">{stats.journals?.total || 0}</p>
                    <span className="text-xs font-semibold text-[#f59e0b] bg-yellow-100 px-2 py-1 rounded">{stats.journals?.pending || 0} Pending</span>
                </div>
              </div>
              
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <h3 className="text-sm font-medium text-[#6b7280]">Registered Users</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-4xl font-bold text-[#1f2937]">{stats.users.total}</p>
                    <span className="text-xs font-semibold text-[#059669] bg-green-100 px-2 py-1 rounded">Platform Wide</span>
                </div>
              </div>

              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <h3 className="text-sm font-medium text-[#6b7280]">Journal Submissions</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-4xl font-bold text-[#1f2937]">{stats.papers.journalTotal}</p>
                    <span className="text-xs font-semibold text-[#3b82f6] bg-blue-100 px-2 py-1 rounded">{stats.papers.journalAccepted} Accepted</span>
                </div>
              </div>

              {/* UPDATED: Conference Papers matches Journal Submissions styling */}
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <h3 className="text-sm font-medium text-[#6b7280]">Conference Papers</h3>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-4xl font-bold text-[#1f2937]">{stats.papers.conferenceTotal}</p>
                    <span className="text-xs font-semibold text-[#3b82f6] bg-blue-100 px-2 py-1 rounded">{stats.papers.conferenceAccepted} Accepted</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
                      <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-[#1f2937]">Recently Created Conferences</h3>
                          <button onClick={() => navigate('/admin/conferences')} className="text-sm text-[#059669] hover:underline font-medium">View All &rarr;</button>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">ID</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Conference Name</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Starts At</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5e7eb]">
                                  {stats.recentActivity.conferences.map(conf => (
                                      <tr key={conf.id} className="hover:bg-[#f9fafb] transition-colors">
                                          <td className="p-3 text-sm text-[#6b7280]">#{conf.id}</td>
                                          <td className="p-3 text-sm font-medium text-[#1f2937]">
                                            {conf.name}
                                            <span className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${conf.status === 'Open' ? 'bg-green-100 text-green-800' : conf.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {conf.status}
                                            </span>
                                          </td>
                                          <td className="p-3 text-sm text-[#6b7280]">{formatDate(conf.startsAt)}</td>
                                          <td className="p-3">
                                              <button onClick={() => handleViewConference(conf.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                          </td>
                                      </tr>
                                  ))}
                                  {stats.recentActivity.conferences.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500 text-sm">No conferences found.</td>
                                    </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
                      <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-[#1f2937]">Recently Registered Journals</h3>
                          <button onClick={() => navigate('/admin/journal')} className="text-sm text-[#059669] hover:underline font-medium">View All &rarr;</button>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">ID</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Journal Name</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Publisher</th>
                                      <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5e7eb]">
                                  {stats.recentActivity.journals?.map(journal => (
                                      <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                          <td className="p-3 text-sm text-[#6b7280]">#{journal.id}</td>
                                          <td className="p-3 text-sm font-medium text-[#1f2937]">
                                            {journal.name}
                                            <span className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${journal.status === 'Open' || journal.status === 'Active' ? 'bg-green-100 text-green-800' : journal.status === 'Pending' || journal.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {journal.status}
                                            </span>
                                          </td>
                                          <td className="p-3 text-sm text-[#6b7280]">{journal.Publication}</td>
                                          <td className="p-3">
                                              <button onClick={() => handleViewJournal(journal.id)} className="px-3 py-1.5 text-xs font-medium text-[#059669] border border-[#059669]/30 rounded bg-[#059669]/5 hover:bg-[#059669]/10 transition-colors">View Details</button>
                                          </td>
                                      </tr>
                                  ))}
                                  {(!stats.recentActivity.journals || stats.recentActivity.journals.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500 text-sm">No journals found.</td>
                                    </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>

              <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => navigate('/admin/conferences')} className="bg-white border border-[#e5e7eb] rounded-lg p-5 text-left hover:border-[#059669] hover:shadow-md transition-all group">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-bold text-[#1f2937] group-hover:text-[#059669]">Conference Admin</h3>
                              <span className="text-[#059669] bg-[#059669]/10 p-2 rounded-lg group-hover:scale-110 transition-transform">📅</span>
                          </div>
                          <p className="text-sm text-[#6b7280]">Manage pending requests, event tracks, and organizers.</p>
                      </button>

                      <button onClick={() => navigate('/admin/journal')} className="bg-white border border-[#e5e7eb] rounded-lg p-5 text-left hover:border-[#059669] hover:shadow-md transition-all group">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-bold text-[#1f2937] group-hover:text-[#059669]">Journal Admin</h3>
                              <span className="text-[#059669] bg-[#059669]/10 p-2 rounded-lg group-hover:scale-110 transition-transform">📖</span>
                          </div>
                          <p className="text-sm text-[#6b7280]">Oversee Editor-in-Chief roles and final publications.</p>
                      </button>
                  </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-[#e5e7eb] rounded-lg">
             <p className="text-lg text-[#6b7280] font-medium">Fetching platform data...</p>
          </div>
        )}
      </main>

      {/* DETAILED CONFERENCE MODAL */}
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
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="text-3xl font-bold text-[#1f2937]">{selectedConf.name}</h4>
                          <p className="text-[#6b7280] mt-1 flex items-center gap-2 font-medium">📍 {selectedConf.location}</p>
                          {selectedConf.link && <a href={selectedConf.link} target="_blank" rel="noreferrer" className="text-sm text-[#059669] hover:underline mt-2 block font-medium">🔗 Visit Conference Website</a>}
                       </div>
                       <div className="flex flex-col items-end gap-3">
                           <span className={`px-4 py-1.5 text-sm font-bold rounded-full border ${selectedConf.status === 'Open' ? 'bg-green-50 text-green-800 border-green-200' : selectedConf.status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                              {selectedConf.status}
                           </span>
                           {selectedConf.status === 'Pending Approval' && (
                             <button onClick={() => handleApprove(selectedConf.id)} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-md shadow hover:bg-[#047857] transition-colors">✓ Approve Event</button>
                           )}
                       </div>
                    </div>
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
                         <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Deadline</p>
                         <p className="text-lg font-bold text-red-600 mt-1">{formatDate(selectedConf.deadline)}</p>
                       </div>
                    </div>
                    <div>
                       <h5 className="text-sm font-bold text-[#1f2937] mb-4 uppercase tracking-wider border-b border-[#e5e7eb] pb-2">Core Organizers & Committee</h5>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>
      )}

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
                                                onClick={() => handleRejectJournal(selectedJournal.id)}
                                                className="px-4 py-2 text-sm font-medium bg-white text-red-600 border border-red-600 rounded-md shadow-sm hover:bg-red-50 transition-colors"
                                            >
                                                ✕ Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveJournal(selectedJournal.id)}
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