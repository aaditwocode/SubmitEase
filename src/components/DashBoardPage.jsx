"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashBoardPage() {
  const [activePortal, setActivePortal] = useState(null);
  const navigate = useNavigate();
  const goToProfile = () => {
    navigate("/conference");
  };
  const handlePortalClick = (portal) => {
    setActivePortal(portal);
    // Here you would typically navigate to the portal page
    console.log(`[v0] Navigating to ${portal} portal`);
    navigate(`/${portal}`);
  };

  const handleLogout = () => {
    console.log("[v0] Logging out user");
    navigate("/home");
  };
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>

            {/* Right side - Portal buttons and logout */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handlePortalClick("journal")}
                className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 transition-colors"
              >
                Journal Portal
              </button>
              <button
                onClick={() => handlePortalClick("conference")}
                className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 transition-colors"
              >
                Conference Portal
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Profile Information
            </h2>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img
                  src="https://placehold.co/128x128/059669/ffffff?text=SJ"
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#059669]/20 opacity-70"
                />
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">
                      Full Name
                    </label>
                    <p className="text-lg font-semibold text-[#1f2937]">
                      Dr. Sarah Johnson
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">
                      Email Address
                    </label>
                    <p className="text-lg text-[#1f2937]">
                      sarah.johnson@university.edu
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">
                      Organisation
                    </label>
                    <p className="text-lg text-[#1f2937]">
                      Stanford University
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6b7280] mb-1">
                      Research Area
                    </label>
                    <p className="text-lg text-[#1f2937]">
                      Machine Learning & AI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Academic Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">24</div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Conferences Attended
                </div>
              </div>
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">18</div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Papers Published
                </div>
              </div>
              <div className="text-center p-6 bg-[#059669]/[0.05] rounded-lg border border-[#059669]/20">
                <div className="text-3xl font-bold text-[#059669] mb-2">156</div>
                <div className="text-sm font-medium text-[#6b7280]">
                  Total Citations
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#f3f4f6]/30 rounded-lg">
                  <div>
                    <p className="font-medium text-[#1f2937]">
                      ICML 2024 Conference
                    </p>
                    <p className="text-sm text-[#6b7280]">
                      Presented paper on "Neural Architecture Search"
                    </p>
                  </div>
                  <span className="text-sm text-[#6b7280]">
                    2 weeks ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#f3f4f6]/30 rounded-lg">
                  <div>
                    <p className="font-medium text-[#1f2937]">
                      Nature Machine Intelligence
                    </p>
                    <p className="text-sm text-[#6b7280]">
                      Published "Advances in Deep Learning"
                    </p>
                  </div>
                  <span className="text-sm text-[#6b7280]">
                    1 month ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#f3f4f6]/30 rounded-lg">
                  <div>
                    <p className="font-medium text-[#1f2937]">NeurIPS 2024</p>
                    <p className="text-sm text-[#6b7280]">
                      Paper accepted for presentation
                    </p>
                  </div>
                  <span className="text-sm text-[#6b7280]">
                    2 months ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-[#f9fafb] rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-bold text-[#1f2937] mb-6">
              Access Portals
            </h2>
            <p className="text-[#6b7280] mb-8">
              Choose your portal to manage submissions, track progress, and
              access academic resources.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Conference Portal Button */}
              <div className="group">
                <button
                  type="submit"
                  onClick={() => {
                    handlePortalClick("conference");
                    onClick = { goToProfile };
                  }}
                  className="w-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg
                        className="w-8 h-8 text-[#059669]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">
                      Open Conference Portal
                    </h3>
                    <p className="text-[#6b7280]">
                      Submit papers, track conference submissions, and manage
                      your academic presentations.
                    </p>
                  </div>
                </button>
              </div>

              {/* Journal Portal Button */}
              <div className="group">
                <button
                  type="submit"
                  onClick={() => {
                    handlePortalClick("journal");
                  }}
                  className="w-full p-8 bg-[#059669]/[0.05] hover:bg-[#059669]/10 border-2 border-[#059669]/20 hover:border-[#059669]/40 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#059669]/30 transition-colors">
                      <svg
                        className="w-8 h-8 text-[#059669]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#059669] mb-2">
                      Open Journal Portal
                    </h3>
                    <p className="text-[#6b7280]">
                      Submit to journals, manage peer reviews, and track
                      publication status.
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

