"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- HEADER COMPONENT ---
const Header = ({ user, handleLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenJournal, setIsDropdownOpenJournal] = useState(false);
  const navigate = useNavigate();

  // 1. Define the Master Config: Maps DB Role Strings -> Frontend Routes
  const ROLE_CONFIG = {
    "Author": { label: "Author", path: "/conference" },
    "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
    "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
    "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
    "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
    "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
  };

  const ROLE_CONFIG_JOURNAL = {
      "Author": { label: "Author", path: "/journal" },
      "Journal Editor": { label: "Editor", path: "/journal/editor" },
      "Journal Reviewer": { label: "Reviewer", path: "/journal/ManageReviews" },
      "Editor-in-Chief": { label: "Editor-In-Chief", path: "/eic/dashboard" },
  };

  // 2. Filter options based on the current user's roles
  const availablePortalOptions = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) return [];
    return user.role.map(roleString => ROLE_CONFIG[roleString]).filter(Boolean);
  }, [user]);

  const availablePortalOptionsJournal = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) return [];
    return user.role.map(roleString => ROLE_CONFIG_JOURNAL[roleString]).filter(Boolean);
  }, [user]);

  return (
    <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
        </div>

        {/* Right side - Portal buttons and logout */}
        <div className="flex items-center space-x-4">
          
          {/* Journal Portal Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpenJournal(!isDropdownOpenJournal)}
              onBlur={() => setTimeout(() => setIsDropdownOpenJournal(false), 200)}
              disabled={availablePortalOptionsJournal.length === 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 
                ${availablePortalOptionsJournal.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#059669] hover:bg-[#047857]'}`
              }
            >
              Journal Portal
              {availablePortalOptionsJournal.length > 0 && (
                <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpenJournal ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isDropdownOpenJournal && availablePortalOptionsJournal.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
                <h2 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 px-4 py-1">Sign in as</h2>
                {availablePortalOptionsJournal.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => { navigate(option.path); setIsDropdownOpenJournal(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669] transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Conference Portal Dropdown */}
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
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

// --- MAIN DASHBOARD PAGE ---
export default function DashBoardPage() {
  const { user, setUser } = useUserData();
  const navigate = useNavigate();
  
  // Dynamic Stats State
  const [stats, setStats] = useState({
    conferenceCount: 0,
    publishedCount: 0,
    totalSubmissions: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Logout Handler
  const handleLogout = () => {
    console.log("[v0] Logging out user");
    setUser(null);
    navigate("/home");
  };

  // Fetch Dynamic Stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`http://localhost:3001/api/user/dashboard-stats/${user.id}`);
        if (response.ok) {
            const data = await response.json();
            setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handlePortalClick = (portal) => {
    console.log(`[v0] Navigating to ${portal} portal`);
    navigate(`/${portal}`);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading user data...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} handleLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Profile Information Section --- */}
        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Profile Information
            </h2>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img
                  src={`https://placehold.co/128x128/059669/ffffff?text=${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#059669]/20 opacity-90"
                />
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Full Name</label>
                    <p className="text-lg font-semibold text-[#1f2937]">{user.firstname} {user.lastname}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Email Address</label>
                    <p className="text-lg text-[#1f2937]">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Organisation</label>
                    <p className="text-lg text-[#1f2937]">{user.organisation || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">Research Area</label>
                    <p className="text-lg text-[#1f2937]">
                      {Array.isArray(user.expertise) ? user.expertise.join(', ') : (user.expertise || 'Not specified')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Dynamic Academic Statistics Section --- */}
        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Academic Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stat 1: Unique Conferences */}
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.conferenceCount}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Unique Conferences
                </div>
              </div>

              {/* Stat 2: Total Submissions */}
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.totalSubmissions}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Total Submissions
                </div>
              </div>

              {/* Stat 3: Papers Published */}
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">
                  {loading ? "..." : stats.publishedCount}
                </div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Papers Published
                </div>
              </div>
            </div>

            {/* Dynamic Recent Activity */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {loading ? (
                    <p className="text-sm text-gray-500 italic">Loading activity...</p>
                ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-lg hover:shadow transition-shadow">
                            <div>
                                <p className="font-medium text-[#1f2937]">{activity.title}</p>
                                <p className="text-sm text-[#059669] font-medium mt-0.5">{activity.description}</p>
                            </div>
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap ml-4">
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

        {/* --- Access Portals Section --- */}
        <section>
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Access Portals
            </h2>
            <p className="text-[#6b7280] mb-8">
              Choose your portal to manage submissions, track progress, and access academic resources.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Conference Portal Button */}
              <div className="group">
                <button
                  onClick={() => handlePortalClick("conference")}
                  className="w-full h-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#059669]/20"
                >
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">
                      Open Conference Portal
                    </h3>
                    <p className="text-[#6b7280] text-sm">
                      Submit papers, track conference submissions, and manage your academic presentations.
                    </p>
                  </div>
                </button>
              </div>

              {/* Journal Portal Button */}
              <div className="group">
                <button
                  onClick={() => handlePortalClick("journal")}
                  className="w-full h-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#059669]/20"
                >
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">
                      Open Journal Portal
                    </h3>
                    <p className="text-[#6b7280] text-sm">
                      Submit to journals, manage peer reviews, and track publication status.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}