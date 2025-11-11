"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams
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

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone: "Asia/Kolkata",
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// --- Paper List Component ---
const PaperList = ({ papers }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedAndFilteredPapers = useMemo(() => {
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

    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [papers, sortBy, sortOrder, searchTerm]);


  if (!papers || papers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No papers submitted to this conference yet.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
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
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("id")}>
              Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("Title")}>
              Name {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("submittedAt")}>
              Submitted On {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Keywords</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap" onClick={() => handleSort("Status")}>
              Status {sortBy === "Status" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
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

// --- Main Component ---
export default function ConferemceDetails_TrackChair() {
  const {user,setUser } = useUserData();
  const navigate = useNavigate();
  
  // Get the hashed ID from the URL parameters
  // Assumes route is like: /conference/manage/:hashedconfid
  const { hashedConId } = useParams(); 

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conferenceId, setConferenceId] = useState(null);

  const handlePortalClick = (portal) => {
    navigate(`/${portal}`);
  };

  const handleLogout = () => {
    
    setUser(null);
    navigate("/home");
  };

  // 1. Decode the ID when component mounts or param changes
  useEffect(() => {
    if (hashedConId) {
      try {
        const decodedId = atob(hashedConId); // Base64 decode
        setConferenceId(decodedId);
      } catch (e) {
        setError("Invalid Conference URL");
        setLoading(false);
      }
    }
  }, [hashedConId]);

  // 2. Fetch papers once we have the decoded ID
  useEffect(() => {
    if (conferenceId) {
      const getPapers = async () => {
        setLoading(true);
        try {
          const response = await fetch("http://localhost:3001/conference/trackpapers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conferenceId: conferenceId, userId: user.id }),
          });
          if (response.status === 404) {
            setPapers([]);
            setLoading(false);
            return;
          }
          if (!response.ok) {
            throw new Error("Paper data fetch failed.");
          }
          const data = await response.json();
          setPapers(data.paper || []);
        } catch (err) {
          console.error(err);
          setError("Failed to load papers.");
        } finally {
          setLoading(false);
        }
      };
      getPapers();
    }
  }, [conferenceId]);

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
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

      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate("/conference/manage")} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
          &larr; Back to All Conferences
        </button>
        <div className="space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1f2937]">Submitted Papers</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          ) : (
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
              <PaperList papers={papers} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}