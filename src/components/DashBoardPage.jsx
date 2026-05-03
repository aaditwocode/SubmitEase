"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- HEADER COMPONENT ---
const Header = ({ user, handleLogout, openJournalModal }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenJournal, setIsDropdownOpenJournal] = useState(false);
  const navigate = useNavigate();

  const ROLE_CONFIG = {
    "Author": { label: "Author", path: "/conference" },
    "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
    "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
    "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
    "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
    "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
  };

  const availablePortalOptions = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) return [];
    return user.role.map(roleString => ROLE_CONFIG[roleString]).filter(Boolean);
  }, [user]);

  const activeJournals = user?.activeJournals || [];

  return (
    <header className="sticky top-0 z-[100] border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
        </div>

        <div className="flex items-center space-x-4">

          {/* --- JOURNAL PORTAL DROPDOWN --- */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpenJournal(!isDropdownOpenJournal)}
              onBlur={() => setTimeout(() => setIsDropdownOpenJournal(false), 200)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#059669] rounded-lg transition-colors flex items-center gap-2 hover:bg-[#047857]"
            >
              Journal Portal
              <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpenJournal ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpenJournal && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-[#e5e7eb] py-2 z-[110]">
                <h2 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 px-4 py-1">Log in to your Journal</h2>

                <div className="max-h-48 overflow-y-auto">
                  {activeJournals.length > 0 ? (
                    activeJournals.map((journal, index) => (
                      <button
                        key={index}
                        onClick={() => { navigate(`/journal/${journal.journalId}/author`); setIsDropdownOpenJournal(false); }}
                        className="block w-full text-left px-4 py-2 hover:bg-[#f3f4f6] transition-colors"
                      >
                        <p className="text-sm font-bold text-[#1f2937] truncate">{journal.journalName}</p>
                        <p className="text-xs text-[#059669] truncate mt-0.5">Role: {journal.roles.join(', ')}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-500 italic">No registered journals found.</p>
                  )}
                </div>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={() => { setIsDropdownOpenJournal(false); openJournalModal(); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#059669] font-bold hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    Discover & Register Journals
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- CONFERENCE PORTAL DROPDOWN --- */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              disabled={availablePortalOptions.length === 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 
                ${availablePortalOptions.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#059669] hover:bg-[#047857]'}`
              }
            >
              Conference Portal
              {availablePortalOptions.length > 0 && (
                <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isDropdownOpen && availablePortalOptions.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#e5e7eb] py-2 z-[110]">
                <h2 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 px-4 py-1">Sign in as</h2>
                {availablePortalOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => { navigate(option.path); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669] transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default function DashBoardPage() {
  const { user, setUser } = useUserData();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    conferenceCount: 0,
    journalCount: 0,
    publishedCount: 0,
    totalSubmissions: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ organisation: '', expertise: '' });

  // Email Update Modal State
  const [emailModal, setEmailModal] = useState({ open: false, step: 'input', newEmail: '', otp: '', hash: '', error: '' });

  // Journal Portal Modal States
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalModalTab, setJournalModalTab] = useState('discover');
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [myJournals, setMyJournals] = useState([]);
  const [recommendedJournals, setRecommendedJournals] = useState([]);
  const [availableJournals, setAvailableJournals] = useState([]);
  const [journalSearchQuery, setJournalSearchQuery] = useState('');

  // States for the Big Portal Buttons
  const [bigConfDropdown, setBigConfDropdown] = useState(false);
  const [bigJournalDropdown, setBigJournalDropdown] = useState(false);

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({
        organisation: user.organisation || '',
        expertise: Array.isArray(user.expertise) ? user.expertise.join(', ') : (user.expertise || '')
      });
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    navigate("/home");
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`http://localhost:3001/user/dashboard-stats/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) { } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (isJournalModalOpen && user?.id) {
      fetchJournalPortalData();
    }
  }, [isJournalModalOpen, user]);

  const fetchJournalPortalData = async () => {
    setLoadingJournals(true);
    try {
      const resRegistered = await fetch(`http://localhost:3001/user/${user.id}/registered-journals`);
      let registeredIds = [];
      if (resRegistered.ok) {
        const data = await resRegistered.json();
        setMyJournals(data);
        registeredIds = data.map(j => j.id);
      }

      const expertiseArray = Array.isArray(user.expertise)
        ? user.expertise
        : (user.expertise ? user.expertise.split(',').map(e => e.trim()) : []);

      const resDiscover = await fetch(`http://localhost:3001/journals/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertise: expertiseArray })
      });
      if (resDiscover.ok) {
        const dataDiscover = await resDiscover.json();
        const recs = (dataDiscover.recommended || []).filter(j => !registeredIds.includes(j.id));
        const avails = (dataDiscover.available || []).filter(j => !registeredIds.includes(j.id));

        setRecommendedJournals(recs);
        setAvailableJournals(avails);
      }
    } catch (e) {
      console.error("Error fetching journal portal data", e);
    } finally {
      setLoadingJournals(false);
    }
  };

  const saveProfileDetails = async () => {
    try {
      const res = await fetch(`http://localhost:3001/user/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation: editForm.organisation,
          expertise: editForm.expertise.split(',').map(e => e.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsEditingProfile(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      alert("Network error updating profile");
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setEmailModal(prev => ({ ...prev, error: '' }));
    try {
      const res = await fetch('http://localhost:3001/user/request-email-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: emailModal.newEmail, firstname: user.firstname })
      });

      if (res.ok) {
        const data = await res.json();
        setEmailModal(prev => ({ ...prev, step: 'verify', hash: data.hash }));
      } else {
        const errorText = await res.text();
        setEmailModal(prev => ({ ...prev, error: errorText }));
      }
    } catch (err) {
      setEmailModal(prev => ({ ...prev, error: 'Network error.' }));
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setEmailModal(prev => ({ ...prev, error: '' }));
    try {
      const res = await fetch('http://localhost:3001/user/verify-email-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newEmail: emailModal.newEmail,
          otp: emailModal.otp,
          hash: emailModal.hash
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEmailModal({ open: false, step: 'input', newEmail: '', otp: '', hash: '', error: '' });
        alert("Email address updated successfully!");
      } else {
        const errorText = await res.text();
        setEmailModal(prev => ({ ...prev, error: errorText }));
      }
    } catch (err) {
      setEmailModal(prev => ({ ...prev, error: 'Network error.' }));
    }
  };

  const handleRegisterJournal = async (journalId) => {
    try {
      const res = await fetch('http://localhost:3001/journals/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, journalId })
      });
      if (res.ok) {
        alert("Successfully registered for this journal!");
        fetchJournalPortalData();
        fetchStats(); // Refresh the stats grid so "Journals Registered" updates
      } else {
        alert("Failed to register.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  const ROLE_CONFIG = {
    "Author": { label: "Author", path: "/conference" },
    "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
    "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
    "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
    "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
    "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
  };

  const availablePortalOptions = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) return [];
    return user.role.map(roleString => ROLE_CONFIG[roleString]).filter(Boolean);
  }, [user]);

  const activeJournals = user?.activeJournals || [];

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading user data...</p></div>;
  }

  const filteredAvailableJournals = availableJournals.filter(j =>
    j.name.toLowerCase().includes(journalSearchQuery.toLowerCase()) ||
    (j.Publication && j.Publication.toLowerCase().includes(journalSearchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#ffffff]">

      <Header
        user={user}
        handleLogout={handleLogout}
        openJournalModal={() => {
          setIsJournalModalOpen(true);
          setJournalModalTab('discover');
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* --- PROFILE SECTION --- */}
        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8 relative z-10">

            <div className="absolute top-8 right-8">
              {!isEditingProfile ? (
                <div className="flex gap-2">
                  <button onClick={() => setEmailModal({ ...emailModal, open: true })} className="px-4 py-2 bg-white border border-emerald-200 text-sm font-medium text-[#059669] rounded-md hover:bg-emerald-50 transition-colors shadow-sm">
                    Change Email
                  </button>
                  <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 bg-white border border-emerald-200 text-sm font-medium text-[#059669] rounded-md hover:bg-emerald-50 transition-colors shadow-sm">
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveProfileDetails} className="px-4 py-2 bg-[#059669] text-white text-sm font-medium rounded-md hover:bg-[#047857] shadow-sm transition-colors">
                    Save
                  </button>
                  <button onClick={() => { setIsEditingProfile(false); setEditForm({ organisation: user.organisation || '', expertise: Array.isArray(user.expertise) ? user.expertise.join(', ') : (user.expertise || '') }); }} className="px-4 py-2 bg-white border border-[#e5e7eb] text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">Profile Information</h2>

            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              <div className="flex-shrink-0">
                <img
                  src={`https://placehold.co/128x128/059669/ffffff?text=${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#059669]/20 opacity-90"
                />
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Full Name</label>
                    <p className="text-lg font-semibold text-[#1f2937] py-1">{user.firstname} {user.lastname}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Email Address</label>
                    <p className="text-lg text-[#1f2937] py-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Organisation</label>
                    {isEditingProfile ? (
                      <input type="text" value={editForm.organisation} onChange={(e) => setEditForm({ ...editForm, organisation: e.target.value })} className="w-full px-3 py-1.5 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:outline-none" />
                    ) : (
                      <p className="text-lg text-[#1f2937] py-1">{user.organisation || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Research Area (Comma separated)</label>
                    {isEditingProfile ? (
                      <input type="text" value={editForm.expertise} onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })} className="w-full px-3 py-1.5 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:outline-none" />
                    ) : (
                      <p className="text-lg text-[#1f2937] py-1">
                        {Array.isArray(user.expertise) ? user.expertise.join(', ') : (user.expertise || 'Not specified')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- STATS SECTION --- */}
        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">Academic Statistics</h2>

            {/* UPDATED: Grid to 4 columns to fit the new Journal stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.conferenceCount}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">Registered Conferences</div>
              </div>

              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.journalCount}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">Journals Registered</div>
              </div>

              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.totalSubmissions}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">Total Submissions</div>
              </div>

              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.publishedCount}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">Paper Accepted</div>
              </div>

            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500 italic">Loading activity...</p>
                ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-lg hover:shadow transition-shadow">

                      {activity.isDefault ? (
                        <div>
                          <p className="font-medium text-[#1f2937]">{activity.title}</p>
                          <p className="text-sm text-[#059669] font-medium mt-0.5">{activity.description}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-[#1f2937]">
                            <span className="text-xs font-bold text-gray-400 mr-2 border border-gray-200 px-1.5 py-0.5 rounded">#{activity.id}</span>
                            {activity.title}
                          </p>
                          <p className="text-sm text-[#059669] font-medium mt-1">
                            Status: <span className="font-bold text-[#1f2937]">{activity.status}</span>
                            <span className="text-gray-300 mx-2">|</span>
                            <span className="text-[#6b7280]">📚 {activity.journalName}</span>
                          </p>
                        </div>
                      )}

                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full whitespace-nowrap ml-4">
                        {activity.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white border border-gray-100 rounded-lg text-center">
                    <p className="text-sm text-[#6b7280] italic">No recent activity found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- PORTALS SECTION --- */}
        <section>
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">Access Portals</h2>
            <p className="text-[#6b7280] mb-8">Choose your portal to manage submissions, track progress, and access academic resources.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* BIG CONFERENCE BUTTON */}
              <div className="relative group h-full">
                <button
                  onClick={() => setBigConfDropdown(!bigConfDropdown)}
                  onBlur={() => setTimeout(() => setBigConfDropdown(false), 200)}
                  className="w-full h-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#059669]/20"
                >
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">Open Conference Portal</h3>
                    <p className="text-[#6b7280] text-sm">Submit papers, track conference submissions, and manage your academic presentations.</p>
                  </div>
                </button>

                {bigConfDropdown && availablePortalOptions.length > 0 && (
                  <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-lg shadow-2xl border border-[#e5e7eb] py-3 z-[60]">
                    <h2 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 px-5 py-1">Sign in as</h2>
                    {availablePortalOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(option.path)}
                        className="block w-full text-left px-5 py-3 text-sm font-medium text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669] transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* BIG JOURNAL BUTTON */}
              <div className="relative group h-full">
                <button
                  onClick={() => setBigJournalDropdown(!bigJournalDropdown)}
                  onBlur={() => setTimeout(() => setBigJournalDropdown(false), 200)}
                  className="w-full h-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#059669]/20"
                >
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477-4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">Open Journal Portal</h3>
                    <p className="text-[#6b7280] text-sm">Submit to journals, discover publications, and track publication status.</p>
                  </div>
                </button>

                {bigJournalDropdown && (
                  <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-lg shadow-2xl border border-[#e5e7eb] py-3 z-[60]">
                    <h2 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 px-5 py-1">Log in to your Journal</h2>

                    <div className="max-h-48 overflow-y-auto">
                      {activeJournals.length > 0 ? (
                        activeJournals.map((journal, index) => (
                          <button
                            key={index}
                            onClick={() => navigate(`/journal/${journal.journalId}/author`)}
                            className="block w-full text-left px-5 py-3 hover:bg-[#f3f4f6] transition-colors"
                          >
                            <p className="text-sm font-bold text-[#1f2937] truncate">{journal.journalName}</p>
                            <p className="text-xs text-[#059669] truncate mt-1">Role: {journal.roles.join(', ')}</p>
                          </button>
                        ))
                      ) : (
                        <p className="px-5 py-3 text-sm text-gray-500 italic">No registered journals found.</p>
                      )}
                    </div>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => { setIsJournalModalOpen(true); setJournalModalTab('discover'); }}
                        className="w-full text-left px-5 py-3 text-sm text-[#059669] font-bold hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        Discover & Register Journals
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* --- JOURNAL ACCESS MODAL --- */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#f9fafb] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb] bg-white">
              <div>
                <h3 className="text-xl font-bold text-[#1f2937]">Journal Access Portal</h3>
                <p className="text-[#6b7280] text-sm mt-1">Manage your active journals or discover new publications.</p>
              </div>
              <button onClick={() => setIsJournalModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e5e7eb] bg-white px-6">
              <button
                onClick={() => setJournalModalTab('my-journals')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${journalModalTab === 'my-journals' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                My Registered Journals
              </button>
              <button
                onClick={() => setJournalModalTab('discover')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${journalModalTab === 'discover' ? 'border-[#059669] text-[#059669]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Search & Discover
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingJournals ? (
                <div className="flex justify-center py-12">
                  <p className="text-[#6b7280] italic">Loading journal data...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: MY JOURNALS */}
                  {journalModalTab === 'my-journals' && (
                    <div className="space-y-4">
                      {myJournals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myJournals.map(journal => (
                            <div key={journal.id} className="bg-white p-5 border border-[#e5e7eb] rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-[#1f2937]">{journal.name}</h4>
                                <p className="text-sm text-[#6b7280] mt-1">{journal.Publication}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {journal.roles.map(role => (
                                    <span key={role} className="px-2 py-1 bg-emerald-50 text-[#059669] text-xs font-semibold rounded-md border border-emerald-100">{role}</span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => navigate(`/journal/${journal.id}/author`)}
                                className="mt-5 w-full py-2 bg-[#059669]/10 text-[#059669] font-semibold text-sm rounded hover:bg-[#059669]/20 transition-colors"
                              >
                                Log In to Portal
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                          <p className="text-[#6b7280]">You are not currently registered in any journals.</p>
                          <button onClick={() => setJournalModalTab('discover')} className="mt-3 text-[#059669] hover:underline font-medium text-sm">Discover Journals</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DISCOVER */}
                  {journalModalTab === 'discover' && (
                    <div className="space-y-8">
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search journals by name or publisher..."
                          value={journalSearchQuery}
                          onChange={(e) => setJournalSearchQuery(e.target.value)}
                          className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#059669] focus:outline-none pl-10 shadow-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>

                      {/* Recommended Section */}
                      {!journalSearchQuery && recommendedJournals.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-[#1f2937] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="text-yellow-500">★</span> Recommended For Your Expertise
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {recommendedJournals.map(journal => (
                              <div key={journal.id} className="bg-gradient-to-r from-emerald-50 to-white p-4 border border-emerald-100 rounded-lg flex justify-between items-center">
                                <div>
                                  <h5 className="font-bold text-[#1f2937]">{journal.name}</h5>
                                  <p className="text-xs text-[#6b7280]">{journal.Publication}</p>
                                  {journal.link && (
                                    <a href={journal.link} target="_blank" rel="noreferrer" className="text-xs text-[#059669] hover:underline flex items-center gap-1 mt-1 font-medium">
                                      🔗 Visit Website
                                    </a>
                                  )}
                                </div>
                                <button onClick={() => handleRegisterJournal(journal.id)} className="px-4 py-1.5 bg-[#059669] text-white text-sm font-medium rounded hover:bg-[#047857] shadow-sm transition-colors">
                                  Register
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available Journals List */}
                      <div>
                        <h4 className="text-sm font-bold text-[#1f2937] uppercase tracking-wider mb-3">
                          {journalSearchQuery ? 'Search Results' : 'All Available Journals'}
                        </h4>
                        <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
                          <ul className="divide-y divide-[#e5e7eb]">
                            {filteredAvailableJournals.length > 0 ? (
                              filteredAvailableJournals.map(journal => (
                                <li key={journal.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                    <h5 className="font-bold text-[#1f2937]">{journal.name}</h5>
                                    <p className="text-xs text-[#6b7280]">{journal.Publication}</p>
                                    {journal.link && (
                                      <a href={journal.link} target="_blank" rel="noreferrer" className="text-xs text-[#059669] hover:underline flex items-center gap-1 mt-1 font-medium">
                                        🔗 Visit Website
                                      </a>
                                    )}
                                  </div>
                                  <button onClick={() => handleRegisterJournal(journal.id)} className="px-4 py-1.5 border border-[#059669] text-[#059669] text-xs font-medium rounded hover:bg-emerald-50 transition-colors">
                                    Register
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="p-6 text-center text-[#6b7280] text-sm">No journals match your search.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- EMAIL UPDATE OTP MODAL --- */}
      {emailModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <h3 className="text-lg font-bold text-[#1f2937]">Update Email Address</h3>
              <button onClick={() => setEmailModal({ open: false, step: 'input', newEmail: '', otp: '', hash: '', error: '' })} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-5">
              {emailModal.error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{emailModal.error}</div>}

              {emailModal.step === 'input' ? (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <p className="text-sm text-gray-600">Enter your new email address. We will send a 6-digit OTP to verify you own this inbox.</p>
                  <input
                    type="email"
                    required
                    placeholder="new.email@example.com"
                    value={emailModal.newEmail}
                    onChange={e => setEmailModal({ ...emailModal, newEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:ring-[#059669] focus:outline-none"
                  />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857]">Send OTP</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="text-sm text-gray-600">Enter the 6-digit code sent to <strong>{emailModal.newEmail}</strong>.</p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={emailModal.otp}
                    onChange={e => setEmailModal({ ...emailModal, otp: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-center text-xl tracking-widest focus:ring-[#059669] focus:outline-none"
                  />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEmailModal({ ...emailModal, step: 'input', otp: '', hash: '', error: '' })} className="px-4 py-2 bg-white border border-[#e5e7eb] text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50">Back</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-[#059669] text-white font-medium text-sm rounded-md hover:bg-[#047857]">Verify & Update</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}