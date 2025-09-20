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
  };

  const handleLogout = () => {
    console.log("[v0] Logging out user");
    // Handle logout logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">SubmitEase</h1>
            </div>

            {/* Center - Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button className="text-foreground hover:text-primary transition-colors">
                About Us
              </button>
              <button className="text-foreground hover:text-primary transition-colors">
                My Submissions
              </button>
            </nav>

            {/* Right side - Portal buttons and logout */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handlePortalClick("journal")}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Journal Portal
              </button>
              <button
                onClick={() => handlePortalClick("conference")}
                className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Conference Portal
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <div className="bg-card rounded-xl shadow-sm border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Profile Information
            </h2>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img
                  src="/professional-woman-scientist.png"
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Full Name
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      Dr. Sarah Johnson
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email Address
                    </label>
                    <p className="text-lg text-foreground">
                      sarah.johnson@university.edu
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Institution
                    </label>
                    <p className="text-lg text-foreground">
                      Stanford University
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Department
                    </label>
                    <p className="text-lg text-foreground">Computer Science</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Research Area
                    </label>
                    <p className="text-lg text-foreground">
                      Machine Learning & AI
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      ORCID ID
                    </label>
                    <p className="text-lg text-foreground">
                      0000-0002-1825-0097
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-card rounded-xl shadow-sm border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Academic Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">24</div>
                <div className="text-sm font-medium text-muted-foreground">
                  Conferences Attended
                </div>
              </div>
              <div className="text-center p-6 bg-secondary/5 rounded-lg border border-secondary/20">
                <div className="text-3xl font-bold text-secondary mb-2">18</div>
                <div className="text-sm font-medium text-muted-foreground">
                  Papers Published
                </div>
              </div>
              <div className="text-center p-6 bg-accent/5 rounded-lg border border-accent/20">
                <div className="text-3xl font-bold text-accent mb-2">156</div>
                <div className="text-sm font-medium text-muted-foreground">
                  Total Citations
                </div>
              </div>
              <div className="text-center p-6 bg-chart-1/5 rounded-lg border border-chart-1/20">
                <div className="text-3xl font-bold text-chart-1 mb-2">8.2</div>
                <div className="text-sm font-medium text-muted-foreground">
                  H-Index
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      ICML 2024 Conference
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Presented paper on "Neural Architecture Search"
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    2 weeks ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      Nature Machine Intelligence
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Published "Advances in Deep Learning"
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    1 month ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">NeurIPS 2024</p>
                    <p className="text-sm text-muted-foreground">
                      Paper accepted for presentation
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    2 months ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-card rounded-xl shadow-sm border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Access Portals
            </h2>
            <p className="text-muted-foreground mb-8">
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
                  className="w-full p-8 bg-primary/5 hover:bg-primary/10 border-2 border-primary/20 hover:border-primary/40 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                      <svg
                        className="w-8 h-8 text-primary"
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
                    <h3 className="text-xl font-bold text-primary mb-2">
                      Open Conference Portal
                    </h3>
                    <p className="text-muted-foreground">
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
                  className="w-full p-8 bg-secondary/5 hover:bg-secondary/10 border-2 border-secondary/20 hover:border-secondary/40 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/30 transition-colors">
                      <svg
                        className="w-8 h-8 text-secondary"
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
                    <h3 className="text-xl font-bold text-secondary mb-2">
                      Open Journal Portal
                    </h3>
                    <p className="text-muted-foreground">
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
