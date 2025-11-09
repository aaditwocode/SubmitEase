
"use client";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";
import { Base64 } from "js-base64"; // <-- Import Base64


const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  switch (status) {
    case "Accepted":
      badgeClasses += "bg-green-100 text-green-700";
      break;
    case "Under Review":
      badgeClasses += "bg-yellow-100 text-yellow-700";
      break;
    default:
      badgeClasses += "bg-red-100 text-red-700";
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};

const getConferenceStatusBadge = (status) => {
  let badgeClasses = "inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ";
  switch (status) {
    case "Open":
      badgeClasses += "bg-[#059669]/10 text-[#059669]";
      break;
    default: // Closed, etc.
      badgeClasses += "bg-red-100 text-red-700";
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone: "Asia/Kolkata",
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString("en-IN", {
    dateStyle: 'medium',
  });
};

// --- Header Component (Reusable) ---
const AppHeader = () => {
  const navigate = useNavigate();
  const { setUser, setloginStatus } = useUserData();
  const handlePortalClick = (portal) => navigate(`/${portal}`);
  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="/conference/registration" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Create a Conference</a>
            <a href="/conference/manage" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Conferences</a>
            <a href="/ManageReviews" className="text-[#6b7280] transition-colors hover:text-[#1f2937]">Manage Reviews</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Conference Portal</button>
          <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
        </div>
      </div>
    </header>
  );
};


// --- Conference List Component ---
const RegisteredConferenceList = ({ conferences }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // --- THIS IS THE KEY CHANGE ---
  // Encodes the ID and navigates to the detail page
  const handleManageClick = (conferenceId) => {
    const hashedId = Base64.encode(String(conferenceId));
    navigate(`/conference/manage/${hashedId}`);
  };

  const filteredAndSortedConferences = useMemo(() => {
    // ... (filtering and sorting logic unchanged) ...
     const filtered = (conferences || []).filter(c => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            c.name?.toLowerCase().includes(lowerSearch) ||
            c.location?.toLowerCase().includes(lowerSearch) ||
            c.status?.toLowerCase().includes(lowerSearch)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (['startsAt', 'endAt', 'deadline'].includes(sortBy)) {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        if (dateA < dateB) return sortOrder === "asc" ? -1 : 1;
        if (dateA > dateB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [conferences, sortBy, sortOrder, searchTerm]);

  if (!conferences || conferences.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
        No Registered Conferences Yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search conferences (Name, Location, Status...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>
      <table className="w-full">
        <thead>
          {/* ... (table head unchanged) ... */}
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("name")}>
              Conference Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("location")}>
              Location {sortBy === "location" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("status")}>
              Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("startsAt")}>
              Starts On {sortBy === "startsAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("deadline")}>
              Deadline {sortBy === "deadline" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Website</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedConferences.length > 0 ? (
            filteredAndSortedConferences.map((conf) => (
              <tr key={conf.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{conf.name}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{conf.location}</td>
                <td className="py-3 px-4">{getConferenceStatusBadge(conf.status)}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937] whitespace-nowrap">{formatDateTime(conf.startsAt)}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937] whitespace-nowrap">{formatDateTime(conf.deadline)}</td>
                <td className="py-3 px-4 text-sm">
                  <a href={conf.link} target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">Visit Site</a>
                </td>
                <td className="py-3 px-4">
                  {/* --- MODIFIED: Button now calls handleManageClick --- */}
                  <button 
                    onClick={() => handleManageClick(conf.id)} 
                    className="px-3 py-1 text-xs bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap"
                  >
                    Manage & View Papers
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center text-gray-500 py-4">No conferences match your search.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};


// --- Main Component for the LIST page ---
export default function ManageConferencesPage() {
  const { user } = useUserData();
  const [conferences, setConferences] = useState([]);

  useEffect(() => {
    if (user?.id) {
      const getConferences = async () => {
        try {
          const response = await fetch("http://localhost:3001/conference/registered", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          if (response.status === 404) {
            setConferences([]);
            return;
          }
          if (!response.ok) {
            throw new Error("Conference data fetch failed.");
          }
          const data = await response.json();
          setConferences(data.conference || []);
        } catch (err) {
          console.error(err);
        }
      };
      getConferences();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#1f2937]">Your Registered Conferences</h2>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <RegisteredConferenceList conferences={conferences} />
          </div>
        </div>
      </main>
    </div>
  );
}