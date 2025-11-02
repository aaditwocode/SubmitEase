"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions ---

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

// NEW: Helper for conference status
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

// NEW: Helper for combined date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

// --- Paper List Component (UPDATED with Search/Filter) ---
const PaperList = ({ papers }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState(""); // <-- NEW: Search state

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedAndFilteredPapers = useMemo(() => {
    // --- NEW: Filtering logic ---
    const filtered = (papers || []).filter(paper => {
        const lowerSearch = searchTerm.toLowerCase();
        const keywordsString = Array.isArray(paper.Keywords) ? paper.Keywords.join(' ').toLowerCase() : '';
        return (
            paper.Title?.toLowerCase().includes(lowerSearch) ||
            paper.id?.toString().includes(lowerSearch) ||
            paper.Conference?.name?.toLowerCase().includes(lowerSearch) ||
            paper.Status?.toLowerCase().includes(lowerSearch) ||
            keywordsString.includes(lowerSearch)
        );
    });

    // --- Existing sorting logic, applied to 'filtered' list ---
    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [papers, sortBy, sortOrder, searchTerm]); // <-- NEW: Added searchTerm


  if (!papers || papers.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
        No papers submitted to this conference yet.
      </p>
    );
  }
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      {/* --- NEW: Search Input --- */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search papers (Title, ID, Status, Keywords...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("id")}>
              Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("Title")}>
              Name {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("submittedAt")}>
              Submitted On {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
              Keywords
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("Status")}>
              Status {sortBy === "Status" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {/* --- NEW: Updated to use sortedAndFilteredPapers and show empty state --- */}
          {sortedAndFilteredPapers.length > 0 ? (
            sortedAndFilteredPapers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-[#1f2937]">{paper.Title}</p>
                    <p className="text-xs text-[#6b7280]">{paper.Conference?.name}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{formatDate(paper.submittedAt)}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {(paper.Keywords || []).slice(0, 2).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md">
                        {keyword}
                      </span>
                    ))}
                    {paper.Keywords && paper.Keywords.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-[#f3f4f6] text-[#6b7280] rounded">
                        +{paper.Keywords.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(paper.Status)}</td>
                <td className="py-3 px-4">
                  <button onClick={() => navigate(`/PaperDecision/${paper.id}`)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 py-4">
                {searchTerm ? "No papers match your search." : "No papers submitted to this conference yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- NEW: Registered Conference List Component ---
const RegisteredConferenceList = ({ conferences, onConferenceSelect }) => {
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

  const filteredAndSortedConferences = useMemo(() => {
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

      // Handle date sorting
      if (['startsAt', 'endAt', 'deadline'].includes(sortBy)) {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        if (dateA < dateB) return sortOrder === "asc" ? -1 : 1;
        if (dateA > dateB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }

      // Default string/number comparison
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
      {/* Search Input */}
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
                  <button 
                    onClick={() => onConferenceSelect(conf)} 
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


// --- Main Component ---
export default function ManageConferences() {
  const { user, setUser, setloginStatus } = useUserData();
  const navigate = useNavigate();

  const [conferences, setConferences] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [partnerInput, setPartnerInput] = useState("");

  const countries = [
    // ... (countries list unchanged)
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];

  const handlePortalClick = (portal) => {
    navigate(`/${portal}`);
  };

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const handleConferenceSelect = (conference) => {
    // ... (function logic unchanged)
    setSelectedConference(conference);
    const [city, country] = conference.location ? conference.location.split(', ') : ["", ""];
    const startsAt = new Date(conference.startsAt);
    const endAt = new Date(conference.endAt);
    const deadline = new Date(conference.deadline);

    setEditFormData({
      name: conference.name || "",
      city: city || "",
      country: country || "",
      startsAtDate: startsAt.toISOString().split('T')[0],
      startsAtTime: startsAt.toTimeString().substring(0, 5),
      endAtDate: endAt.toISOString().split('T')[0],
      endAtTime: endAt.toTimeString().substring(0, 5),
      deadlineDate: deadline.toISOString().split('T')[0],
      deadlineTime: deadline.toTimeString().substring(0, 5),
      link: conference.link || "",
      Partners: conference.Partners || [],
    });

    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSaveEdit = () => {
    // ... (function logic unchanged)
    const updatedConferenceData = {
      ...selectedConference,
      name: editFormData.name,
      location: `${editFormData.city}, ${editFormData.country}`,
      startsAt: new Date(`${editFormData.startsAtDate}T${editFormData.startsAtTime}`).toISOString(),
      endAt: new Date(`${editFormData.endAtDate}T${editFormData.endAtTime}`).toISOString(),
      deadline: new Date(`${editFormData.deadlineDate}T${editFormData.deadlineTime}`).toISOString(),
      link: editFormData.link,
      Partners: editFormData.Partners,
    };
    setSelectedConference(updatedConferenceData);
    setConferences(conferences.map(c => c.id === updatedConferenceData.id ? updatedConferenceData : c));
    setEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addPartner = () => {
    // ... (function logic unchanged)
    if (partnerInput.trim() && !editFormData.Partners.includes(partnerInput.trim())) {
      setEditFormData((prev) => ({
        ...prev,
        Partners: [...prev.Partners, partnerInput.trim()],
      }));
      setPartnerInput("");
    }
  };

  const removePartner = (partner) => {
    // ... (function logic unchanged)
    setEditFormData((prev) => ({
      ...prev,
      Partners: prev.Partners.filter((p) => p !== partner),
    }));
  };

  const handleKeyPress = (e) => {
    // ... (function logic unchanged)
    if (e.key === "Enter") {
      e.preventDefault();
      addPartner();
    }
  };

  useEffect(() => {
    // ... (effect logic unchanged)
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

  useEffect(() => {
    // ... (effect logic unchanged)
    if (selectedConference?.id) {
      const getPapers = async () => {
        try {
          const response = await fetch("http://localhost:3001/conference/papers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conferenceId: selectedConference.id }),
          });
          if (response.status === 404) {
            setPapers([]);
            return;
          }
          if (!response.ok) {
            throw new Error("Paper data fetch failed.");
          }
          const data = await response.json();
          setPapers(data.paper || []);
        } catch (err) {
          console.error(err);
        }
      };
      getPapers();
    }
  }, [selectedConference]);

  // --- RENDER LOGIC (View: Selected Conference) ---
  if (selectedConference) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {/* ... (header unchanged) ... */}
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

        <main className="container mx-auto px-4 py-8">
          <button onClick={() => setSelectedConference(null)} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
            &larr; Back to All Conferences
          </button>
          <div className="space-y-8">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
              <div className="p-8">
                {/* ... (Conference Details / Edit Form - all unchanged) ... */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#1f2937]">Conference Details</h2>
                  <div>
                    <span
                      className={`inline-block px-3 py-1 mr-6 text-l font-semibold rounded-full whitespace-nowrap 
          ${selectedConference.status === "Open"
                          ? "bg-[#059669]/10 text-[#059669]"
                          : "bg-red-100 text-red-700"}`}
                    >
                      Status: {selectedConference.status}
                    </span>
                    {editMode && (
                      <button onClick={() => setEditMode(false)} className="px-4 py-2 mr-2 rounded-md border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#f3f4f6] transition-colors">
                        Cancel
                      </button>
                    )}


                    <button onClick={editMode ? handleSaveEdit : handleEditToggle} className={`px-4 py-2 rounded-md transition-colors ${editMode ? "bg-[#059669] text-white hover:bg-[#059669]/90" : "border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#f3f4f6]"}`}>
                      {editMode ? "Save Changes" : "Edit"}
                    </button>
                  </div>
                </div>

                {!editMode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#6b7280] mb-1">Conference Name</label>
                        <p className="text-[#1f2937] font-semibold text-lg">{selectedConference.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6b7280] mb-1">Location</label>
                        <p className="text-[#1f2937]">{selectedConference.location}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6b7280] mb-1">Conference Website</label>
                        <a href={selectedConference.link} target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline break-all">
                          {selectedConference.link}
                        </a>
                      </div>

                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">Start Date</label>
                          <p className="text-[#1f2937]">{formatDate(selectedConference.startsAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">Start Time</label>
                          <p className="text-[#1f2937]">{formatTime(selectedConference.startsAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">End Date</label>
                          <p className="text-[#1f2937]">{formatDate(selectedConference.endAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">End Time</label>
                          <p className="text-[#1f2937]">{formatTime(selectedConference.endAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">Submission Due Date</label>
                          <p className="text-[#1f2937]">{formatDate(selectedConference.deadline)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6b7280] mb-1">Submission Due Time</label>
                          <p className="text-[#1f2937]">{formatTime(selectedConference.deadline)}</p>
                        </div>
                      </div>
                    </div>

                    {selectedConference.Partners && selectedConference.Partners.length > 0 && (
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-[#6b7280] mb-2">Conference Partners</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedConference.Partners.map((p, i) =>
                            <span key={i} className="px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">{p}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // EDIT MODE FORM
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ... (Edit form fields unchanged) ... */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Name *</label>
                        <input type="text" value={editFormData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">City *</label>
                        <input type="text" value={editFormData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">Country *</label>
                        <select value={editFormData.country} onChange={(e) => handleInputChange("country", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none appearance-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]">
                          <option value="">Select a country</option>
                          {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Website *</label>
                        <input type="url" value={editFormData.link} onChange={(e) => handleInputChange("link", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">Start Date *</label>
                          <input type="date" value={editFormData.startsAtDate} onChange={(e) => handleInputChange("startsAtDate", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">Start Time *</label>
                          <input type="time" value={editFormData.startsAtTime} onChange={(e) => handleInputChange("startsAtTime", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">End Date *</label>
                          <input type="date" value={editFormData.endAtDate} onChange={(e) => handleInputChange("endAtDate", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">End Time *</label>
                          <input type="time" value={editFormData.endAtTime} onChange={(e) => handleInputChange("endAtTime", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">Deadline Date *</label>
                          <input type="date" value={editFormData.deadlineDate} onChange={(e) => handleInputChange("deadlineDate", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1f2937] mb-2">Deadline Time *</label>
                          <input type="time" value={editFormData.deadlineTime} onChange={(e) => handleInputChange("deadlineTime", e.target.value)} className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Partners</label>
                      <div className="flex gap-2 mb-3">
                        <input type="text" value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter partner name" className="flex-1 px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb]" />
                        <button type="button" onClick={addPartner} className="px-6 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 font-medium">Add</button>
                      </div>
                      {editFormData.Partners.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editFormData.Partners.map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                              {p}
                              <button type="button" onClick={() => removePartner(p)} className="hover:bg-[#059669]/20 rounded-full p-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Submitted Papers</h3>
              {/* --- UPDATED PaperList component (with search) is rendered here --- */}
              <PaperList papers={papers} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER LOGIC (View: Main Conference List) ---
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {/* ... (header unchanged) ... */}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#1f2937]">Your Registered Conferences</h2>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            
            {/* --- REPLACED: Old card list is replaced with new table component --- */}
            <RegisteredConferenceList 
              conferences={conferences} 
              onConferenceSelect={handleConferenceSelect} 
            />

          </div>
        </div>
      </main>
    </div>
  );
}