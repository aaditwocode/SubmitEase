// src/pages/ConferenceDetailPage.js

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useUserData } from "./UserContext";
import { Base64 } from "js-base64"; // <-- Make sure to install: npm install js-base64

// ---
// --- HELPER FUNCTIONS & HOOKS ---
// ---

const getStatusBadge = (status) => {
  let badgeClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight ";
  switch (status) {
    case "Accepted":
      badgeClasses += "bg-green-100 text-green-700";
      break;
    case "Under Review":
      badgeClasses += "bg-yellow-100 text-yellow-700";
      break;
    case "Rejected":
      badgeClasses += "bg-red-100 text-red-700";
      break;
    default:
      badgeClasses += "bg-gray-100 text-gray-700";
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
    case "Pending Approval":
       badgeClasses += "bg-yellow-100 text-yellow-700";
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
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
};


/**
 * Reusable hook for sorting table data.
 */
const useSortableData = (items, config = { key: 'id', direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = useState(config);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Helper to get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return <span className="text-gray-400"> ↕</span>;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...(items || [])];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle nested keys like 'Tracks.Name'
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aVal = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, a);
          bVal = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, b);
        }

        // Handle special cases
        if (sortConfig.key === 'Keywords') {
            aVal = a.Keywords.join(', ');
            bVal = b.Keywords.join(', ');
        }
        
        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        // Type-aware comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else {
          // Default to string comparison
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
          if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  return { items: sortedItems, requestSort, getSortIndicator };
};


// ---
// --- INTEGRATED COMPONENTS ---
// ---

// --- Assign Chair Modal Component ---
// ... (AssignChairModal component remains unchanged) ...
const AssignChairModal = ({ track, allUsers, onClose, onAssign }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const userMap = useMemo(() => 
    new Map(allUsers.map(user => [user.id, user])), 
    [allUsers]
  );
  
  const selectedUsers = useMemo(() => 
    selectedUserIds.map(id => userMap.get(id)).filter(Boolean),
    [selectedUserIds, userMap]
  );

  useEffect(() => {
    if (track && track.Chairs) {
      setSelectedUserIds(track.Chairs.map(c => c.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [track]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(track.id, selectedUserIds);
  };

  const addChair = (userId) => {
    if (!selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
    setSearchTerm("");
  };

  const removeChair = (userId) => {
    setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
  };

  const availableUsers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return allUsers.filter(user => 
      !selectedUserIds.includes(user.id) && (
        user.firstname.toLowerCase().includes(lowerSearch) ||
        user.lastname.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch)
      )
    );
  }, [allUsers, selectedUserIds, searchTerm]);

  if (!track) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">
          Assign Track Chairs for: <span className="text-[#059669]">{track.Name}</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">Selected Chairs</label>
            <div className="p-2 min-h-[40px] border border-[#e5e7eb] rounded-md bg-white flex flex-wrap gap-2">
              {selectedUsers.length > 0 ? (
                selectedUsers.map(user => (
                  <span key={user.id} className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                    {user.firstname} {user.lastname}
                    <button 
                      type="button" 
                      onClick={() => removeChair(user.id)} 
                      className="hover:bg-[#059669]/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400 px-2 py-1">No chairs selected.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-1">Find Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>

          <div className="w-full h-60 overflow-y-auto border border-[#e5e7eb] rounded-md bg-white">
            {availableUsers.length > 0 ? (
              availableUsers.map(user => (
                <div 
                  key={user.id}
                  onClick={() => addChair(user.id)}
                  className="p-3 border-b border-[#e5e7eb] last:border-b-0 hover:bg-[#f3f4f6] cursor-pointer"
                >
                  <p className="font-medium text-[#1f2937]">{user.firstname} {user.lastname}</p>
                  <p className="text-sm text-[#6b7280]">{user.email}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center p-4">
                {searchTerm ? "No users match your search." : "All users are selected."}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90"
            >
              Save Changes
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};


/**
 * --- NEW Statistics Component for Tracks ---
 * This component calculates and displays paper stats for a single track.
 */
const TrackStatistics = ({ papers }) => {
  const papersInTrack = Array.isArray(papers) ? papers : [];

  const total = papersInTrack.length;
  const accepted = papersInTrack.filter(p => p.Status === 'Accepted').length;
  const underReview = papersInTrack.filter(p => p.Status === 'Under Review').length;
  const rejected = papersInTrack.filter(p => p.Status === 'Rejected').length;

  return (
    <div className="p-4 border-b border-t border-[#e5e7eb]">
      <h4 className="text-sm font-medium text-[#6b7280] mb-3">Paper Statistics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium text-[#6b7280]">Total Submitted</h3>
          <p className="text-2xl font-bold text-[#1f2937]">{total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium text-green-700">Accepted</h3>
          <p className="text-2xl font-bold text-green-700">{accepted}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium text-yellow-700">Under Review</h3>
          <p className="text-2xl font-bold text-yellow-700">{underReview}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium text-red-700">Rejected</h3>
          <p className="text-2xl font-bold text-red-700">{rejected}</p>
        </div>
      </div>
    </div>
  );
};


// --- Track List Component ---
/**
 * MODIFIED:
 * - Removed `onBulkDecision` from props.
 * - Replaced `TrackPaperTable` with `TrackStatistics`.
 */
const TrackList = ({ tracks, onAssignChairClick, onCreateTrack }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = tracks.filter(track => 
    track.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="p-4 flex justify-between items-center bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search tracks by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
        <button 
          onClick={onCreateTrack}
          className="ml-4 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap"
        >
          Create New Track
        </button>
      </div>
      
      {filteredTracks.length > 0 ? (
        filteredTracks.map((track) => (
          <div key={track.id} className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#1f2937]">{track.Name}</h3>
            </div>
            <div className="p-4 border-b border-[#e5e7eb]">
              <h4 className="text-sm font-medium text-[#6b7280] mb-2">Track Chairs</h4>
              <div className="flex flex-wrap gap-2">
                {track.Chairs && track.Chairs.length > 0 ? (
                  track.Chairs.map(chair => (
                    <span key={chair.id} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {chair.firstname} {chair.lastname}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No track chairs assigned.</p>
                )}
              </div>
            </div>
            
            {/* --- MODIFIED: Replaced paper table with stats --- */}
            <TrackStatistics papers={track.Paper} />
            {/* --- END OF MODIFICATION --- */}

            <div className="p-4 bg-[#f9fafb] border-t border-[#e5e7eb] text-right">
              <button 
                onClick={() => onAssignChairClick(track)}
                className="px-4 py-2 text-sm bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
              >
                Assign Track Chairs
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">
          <p>No tracks found matching your search.</p>
        </div>
      )}
    </div>
  );
};

// --- Verdict Section Component ---
/**
 * MODIFIED:
 * - Changed prop `onFinalDecision` to `onBulkDecision` for clarity.
 * - Updated local `handleBulkDecision` to call this prop.
 */
const VerdictSection = ({ papers, onBulkDecision }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [trackFilter, setTrackFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState(0); 
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());
  
  const safePapers = Array.isArray(papers) ? papers : [];

  // Get unique values for filters
  const tracks = useMemo(() => 
    [...new Set(safePapers.map(p => p.Tracks?.Name || 'N/A'))].sort(), 
    [safePapers]
  );
  const statuses = useMemo(() => 
    [...new Set(safePapers.map(p => p.Status))].sort(), 
    [safePapers]
  );

  // 1. Filter papers based on search and filters
  const filteredPapers = useMemo(() => {
    return safePapers.filter(paper => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = paper.Title.toLowerCase().includes(lowerSearch) ||
                            paper.id.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || paper.Status === statusFilter;
      const matchesTrack = trackFilter === 'All' || (paper.Tracks?.Name || 'N/A') === trackFilter;
      const matchesRating = ratingFilter === 0 || (paper.avgRating || 0) >= ratingFilter;
      
      return matchesSearch && matchesStatus && matchesTrack && matchesRating;
    });
  }, [safePapers, searchTerm, statusFilter, trackFilter, ratingFilter]); 

  // 2. Sort the filtered papers
  const { items: sortedPapers, requestSort, getSortIndicator } = useSortableData(
    filteredPapers,
    { key: 'id', direction: 'ascending' }
  );

  // --- HANDLERS FOR SELECTION ---
  const handleSelectOne = (paperId) => {
    setSelectedPaperIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(paperId)) {
        newSelected.delete(paperId);
      } else {
        newSelected.add(paperId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    setSelectedPaperIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      const allVisibleIds = sortedPapers.map(p => p.id);
      
      const allVisibleSelected = allVisibleIds.every(id => newSelected.has(id));
      
      if (allVisibleSelected) {
        allVisibleIds.forEach(id => newSelected.delete(id));
      } else {
        allVisibleIds.forEach(id => newSelected.add(id));
      }
      return newSelected;
    });
  };

  // --- HANDLER FOR BULK DECISIONS (NOW CALLS PROP) ---
  const handleBulkDecision = (decision) => {
    if (selectedPaperIds.size === 0) {
      alert("Please select at least one paper.");
      return;
    }
    // Call the prop from the parent component
    onBulkDecision(Array.from(selectedPaperIds), decision);
    // Clear selection locally
    setSelectedPaperIds(new Set());
  };
  
  // --- Checkbox state for "Select All" ---
  const allVisibleSelected = useMemo(() => {
    if (sortedPapers.length === 0) return false;
    return sortedPapers.every(p => selectedPaperIds.has(p.id));
  }, [sortedPapers, selectedPaperIds]);


  const selectClasses = "px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white text-sm";
  const inputClasses = "px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white text-sm";

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      {/* --- Filter Bar --- */}
      <div className="p-4 flex flex-wrap gap-4 items-center border-b border-[#e5e7eb]">
        <input
          type="text"
          placeholder="Search by Paper ID or Title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full max-w-xs ${inputClasses}`}
        />
        <div>
          <label htmlFor="statusFilter" className="text-sm font-medium text-[#6b7280] mr-2">Status:</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClasses}>
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="trackFilter" className="text-sm font-medium text-[#6b7280] mr-2">Track:</label>
          <select id="trackFilter" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className={selectClasses}>
            <option value="All">All Tracks</option>
            {tracks.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ratingFilter" className="text-sm font-medium text-[#6b7280] mr-2">Min Rating:</label>
          <input
            id="ratingFilter"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(parseFloat(e.target.value) || 0)}
            className={`${inputClasses} w-24`}
          />
        </div>
      </div>
      
      {/* --- Bulk Actions Bar --- */}
      <div className="p-4 flex flex-wrap gap-4 items-center bg-[#f9fafb] border-b border-[#e5e7eb]">
        <span className="text-sm font-medium text-[#1f2937]">
          {selectedPaperIds.size} selected
        </span>
        <button
          onClick={() => handleBulkDecision('Accepted')}
          disabled={selectedPaperIds.size === 0}
          className="px-3 py-1 text-xs rounded-md transition-colors bg-[#059669] text-white hover:bg-[#059669]/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Accept Selected
        </button>
        <button
          onClick={() => handleBulkDecision('Rejected')}
          disabled={selectedPaperIds.size === 0}
          className="px-3 py-1 text-xs rounded-md transition-colors bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Reject Selected
        </button>
        <button
          onClick={() => setSelectedPaperIds(new Set())}
          disabled={selectedPaperIds.size === 0}
          className="px-3 py-1 text-xs rounded-md transition-colors border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Selection
        </button>
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="border-b border-t border-[#e5e7eb]">
            <th className="py-3 px-4">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={handleSelectAll}
                disabled={sortedPapers.length === 0}
                className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50"
              />
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">#</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('id')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Paper ID {getSortIndicator('id')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('Title')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Paper Title {getSortIndicator('Title')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('Tracks.Name')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Track {getSortIndicator('Tracks.Name')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('Status')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Status {getSortIndicator('Status')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
              <button onClick={() => requestSort('avgRating')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Avg Rating {getSortIndicator('avgRating')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPapers.length > 0 ? (
            sortedPapers.map((paper, index) => (
              <tr 
                key={paper.id} 
                className={`border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors ${
                  selectedPaperIds.has(paper.id) ? 'bg-green-50' : ''
                }`}
              >
                <td className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedPaperIds.has(paper.id)}
                    onChange={() => handleSelectOne(paper.id)}
                    className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{index + 1}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.Title}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.Tracks?.Name || 'N/A'}</td>
                <td className="py-3 px-4">{getStatusBadge(paper.Status)}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">
                  {paper.avgRating ? paper.avgRating.toFixed(1) : 'N/A'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              {/* --- MODIFIED: colSpan updated to 7 --- */}
              <td colSpan="7" className="text-center text-gray-500 py-4">
                {searchTerm || statusFilter !== 'All' || trackFilter !== 'All' || ratingFilter > 0
                  ? 'No papers match your filters.' 
                  : 'No papers found.'
                }
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};


// ---
// --- HEADER COMPONENT ---
// ---
// ... (AppHeader component remains unchanged) ...
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


// ---
// --- MAIN DETAIL PAGE COMPONENT ---
// ---
export default function ConferenceDetailPage() {
  const navigate = useNavigate();
  const { hashedConId } = useParams();
  
  const [conference, setConference] = useState(null);
  const [papers, setPapers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [decodedConferenceId, setDecodedConferenceId] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editModeType, setEditModeType] = useState('details'); 

  const [editFormData, setEditFormData] = useState({});
  const [partnerInput, setPartnerInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("tracks");
  const [showCreateTrackForm, setShowCreateTrackForm] = useState(false);
  const [newTrackName, setNewTrackName] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrackForAssignment, setSelectedTrackForAssignment] = useState(null);

  const countries = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];

  // ---
  // --- DATA FETCHING ---
  // ---
  // ... (fetchUsers, fetchPapers, fetchTracks functions remain unchanged) ...
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users/emails');
      if (!response.ok) throw new Error("User data fetch failed.");
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) { 
      console.error("Error fetching users:", error); 
      setAllUsers([]);
    }
  };

  const fetchPapers = async (confId) => {
    if (!confId) return;
    try {
      const response = await fetch("http://localhost:3001/conference/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conferenceId: confId }),
      });
      if (response.status === 404) setPapers([]);
      else if (response.ok) {
        const data = await response.json();
        setPapers(data.paper || []);
      } else {
         throw new Error("Paper data fetch failed.");
      }
    } catch (err) {
      console.error(err);
      setPapers([]);
    }
  };

  const fetchTracks = async (confId) => {
    if (!confId) return;
    try {
      const response = await fetch("http://localhost:3001/conference/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conferenceId: confId }),
      });
      if (response.status === 404) setTracks([]);
      else if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []); // Set the 'tracks' state
      } else {
         throw new Error("Track data fetch failed.");
      }
    } catch (err) {
      console.error(err);
      setTracks([]);
    }
  };

  // ... (main useEffect for getConference remains unchanged) ...
  useEffect(() => {
    let conferenceId;
    try {
      conferenceId = Base64.decode(hashedConId);
      setDecodedConferenceId(conferenceId);
    } catch (e) {
      console.error("Invalid ID format:", e);
      setError("Invalid conference ID.");
      setLoading(false);
      return;
    }
    if (!conferenceId) return;

    const getConference = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/get-conference-by-id`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conferenceId: conferenceId }),
        });
        if (!response.ok) throw new Error("Failed to fetch conference details.");
        
        const data = await response.json();
        const conf = data.conference;
        setConference(conf);

        const [city, country] = conf.location ? conf.location.split(', ') : ["", ""];
        const startsAt = new Date(conf.startsAt);
        const endAt = new Date(conf.endAt);
        const deadline = new Date(conf.deadline);

        setEditFormData({
          name: conf.name || "",
          city: city || "",
          country: country || "",
          startsAtDate: startsAt.toISOString().split('T')[0],
          endAtDate: endAt.toISOString().split('T')[0],
          deadlineDate: deadline.toISOString().split('T')[0],
          deadlineTime: deadline.toTimeString().substring(0, 5),
          link: conf.link || "",
          Partners: conf.Partners || [],
          Tracks: [] // Will be populated by the useEffect below
        });
        setEditMode(false);
        
        fetchUsers();
        fetchPapers(conferenceId);
        fetchTracks(conferenceId); 
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    getConference();
  }, [hashedConId]);

  // ... (useEffect for syncing tracks to editFormData remains unchanged) ...
  useEffect(() => {
    // Only update if tracks have been loaded
    if (tracks.length > 0 || conference?.Tracks?.length > 0) {
      setEditFormData((prev) => ({
        ...prev,
        Tracks: tracks
      }));
    }
  }, [tracks, conference]); // Added conference to handle initial load


  // ... (useMemo for tracksWithPapers remains unchanged) ...
  const tracksWithPapers = useMemo(() => {
    return tracks.map(track => {
      // Find all papers that belong to this track
      const papersForThisTrack = papers.filter(paper => paper.TrackId === track.id);
      return {
        ...track,
        Paper: papersForThisTrack,
      };
    });
  }, [tracks, papers]); // Re-run whenever tracks or papers change


  // ---
  // --- EVENT HANDLERS (Conference Edit) ---
  // ---
  // ... (all conference edit handlers: handleEditDetailsClick, handleEditDeadlineClick, handleSaveEdit, handleInputChange, addPartner, removePartner, handleKeyPress remain unchanged) ...
  const handleEditDetailsClick = () => {
    setEditModeType('details');
    setEditMode(true);
  };
  const handleEditDeadlineClick = () => {
    setEditModeType('deadline');
    setEditMode(true);
  };

const handleSaveEdit = async () => {
    let endpoint = '';
    let payload = {};

    if (editModeType === 'details') {
      // --- MODIFICATION: Changed alert to confirm and added a check ---
      const isConfirmed = window.confirm(
        "Please Note: This will close your conference for submission and will be transferred to Admin for 'Approval'.\n\nDo you want to proceed?"
      );
      
      // If user clicks "Cancel", stop the function
      if (!isConfirmed) {
        return; 
      }
      // --- END MODIFICATION ---
      
      payload = {
        id: decodedConferenceId,
        name: editFormData.name,
        location: `${editFormData.city}, ${editFormData.country}`,
        startsAt: new Date(`${editFormData.startsAtDate}T00:00:00Z`).toISOString(),
        endAt: new Date(`${editFormData.endAtDate}T23:59:59Z`).toISOString(),
        link: editFormData.link,
        Partners: editFormData.Partners,
        status: 'Pending Approval',
      };
      endpoint = `http://localhost:3001/conference/update-details`;
    
    } else if (editModeType === 'deadline') {
      payload = {
        id: decodedConferenceId,
        deadline: new Date(`${editFormData.deadlineDate}T${editFormData.deadlineTime}`).toISOString(),
      };
      endpoint = `http://localhost:3001/conference/update-deadline`;
    }
    
    // The try/catch block only runs if the user confirms (or if type is 'deadline')
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save changes.');
      }

      const updatedConference = await response.json();
      
      setConference(updatedConference); 
      
      const [city, country] = updatedConference.location ? updatedConference.location.split(', ') : ["", ""];
      const startsAt = new Date(updatedConference.startsAt);
      const endAt = new Date(updatedConference.endAt);
      const deadline = new Date(updatedConference.deadline);

      setEditFormData(prev => ({
        ...prev, // Keep existing tracks
        name: updatedConference.name || "",
        city: city || "",
        country: country || "",
        startsAtDate: startsAt.toISOString().split('T')[0],
        endAtDate: endAt.toISOString().split('T')[0],
        deadlineDate: deadline.toISOString().split('T')[0],
        deadlineTime: deadline.toTimeString().substring(0, 5),
        link: updatedConference.link || "",
        Partners: updatedConference.Partners || [],
      }));

      setEditMode(false);
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Error saving changes: ${error.message}`);
    }
  };
  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Partner Management
  const addPartner = () => {
    if (partnerInput.trim() && !editFormData.Partners.includes(partnerInput.trim())) {
      setEditFormData((prev) => ({
        ...prev,
        Partners: [...prev.Partners, partnerInput.trim()],
      }));
      setPartnerInput("");
    }
  };

  const removePartner = (partner) => {
    setEditFormData((prev) => ({
      ...prev,
      Partners: prev.Partners.filter((p) => p !== partner),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPartner();
    }
  };


  // ---
  // --- EVENT HANDLERS (Track/Verdict tabs) ---
  // ---
  // ... (handleCreateTrack, handleAssignChairClick, handleCloseModal, handleSaveTrack, handleAssignChairs remain unchanged) ...
  const handleCreateTrack = () => {
    setShowCreateTrackForm(true);
  };

  const handleAssignChairClick = (track) => {
    setSelectedTrackForAssignment(track);
    setIsAssignModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAssignModalOpen(false);
    setSelectedTrackForAssignment(null);
  };

  const handleSaveTrack = async () => {
    if (!newTrackName.trim()) {
      alert("Please enter a track name");
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/conference/new-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTrackName,
          conferenceId: decodedConferenceId
        }),
      });
      if (!response.ok) {
         const err = await response.json();
        throw new Error(err.message || "Failed to create track");
      }
      
      const data = await response.json();
      setTracks(data.tracks || []); // Update tracks state
      
      setNewTrackName("");
      setShowCreateTrackForm(false);
      alert('Track Created Successfully!');
    } catch (error) {
      console.error("Error creating track:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleAssignChairs = async (trackId, userIds) => {
    try {
      const response = await fetch(`http://localhost:3001/conference/tracks/assign-chairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: trackId,
          userIds: userIds, 
          conferenceId: decodedConferenceId
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to assign track chairs");
      }

      const data = await response.json();
      setTracks(data.tracks || []); // Update tracks state
      
      handleCloseModal(); 
      alert(`Track chairs updated successfully!`);
    } catch (error) {
      console.error("Error assigning chairs:", error);
      alert(`Error: ${error.message}`);
    }
  };


  // ---
  // --- BULK DECISION LOGIC ---
  // ---

  // This is the core API call. It does NOT refetch.
  const runSingleDecisionAPI = async (paperId, decision) => {
    try {
      const response = await fetch(`http://localhost:3001/paper/decision/${paperId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: decision,
          conferenceId: decodedConferenceId
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update decision');
      }
      return await response.json(); // Return success
    } catch (error) {
      console.error(`Failed to save decision for paper ${paperId}:`, error);
      throw error; // Re-throw for Promise.allSettled
    }
  };

  /**
   * This is the function passed to child components.
   * It runs all API calls in parallel and refetches *once*.
   */
  const handleBulkDecisionRequest = async (paperIds, decision) => {
    if (!paperIds || paperIds.length === 0) {
      alert("No papers selected.");
      return;
    }
    
    const promises = paperIds.map(paperId => runSingleDecisionAPI(paperId, decision));
    
    try {
      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      alert(`Bulk update complete.
Success: ${successCount}
Failed: ${failCount}`);

    } catch (error) {
      console.error("Bulk update failed:", error);
      alert("An error occurred during the bulk update.");
    } finally {
      // Refetch papers ONCE, after all are processed.
      fetchPapers(decodedConferenceId);
    }
  };


  // ---
  // --- RENDER LOGIC ---
  // ---

  // ... (Loading and Error states remain unchanged) ...
  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <p>Loading conference details...</p>
        </main>
      </div>
    );
  }

  if (error || !conference) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-red-600">{error || "Conference not found."}</p>
          <button onClick={() => navigate("/conference/manage")} className="mt-4 text-[#059669] hover:text-[#047857] font-medium">
            &larr; Back to All Conferences
          </button>
        </main>
      </div>
    );
  }

  // ... (Main component render, AppHeader, and Conference Detail/Edit section remain unchanged) ...
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate("/conference/manage")} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
          &larr; Back to All Conferences
        </button>
        <div className="space-y-8">
          {/* --- CONFERENCE DETAIL/EDIT SECTION --- */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1f2937]">Conference Details</h2>
                <div className="flex-shrink-0 flex items-center">
                  {getConferenceStatusBadge(conference.status)}
                  
                  {!editMode ? (
                    <>
                      <button onClick={handleEditDetailsClick} disabled={conference.status!="Open"} className="ml-6 px-4 py-2 rounded-md border border-[#e5e7eb] bg-[#059669] text-white hover:bg-[#059669]/90 transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed">
                        Edit Conference Details
                      </button>
                      <button onClick={handleEditDeadlineClick} disabled={conference.status!="Open"} className="ml-2 px-4 py-2 rounded-md border border-[#e5e7eb] bg-[#059669] text-white hover:bg-[#059669]/90 transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed">
                        Edit Submission Deadline
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditMode(false)} className="ml-6 px-4 py-2 mr-2 rounded-md border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#f3f4f6] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleSaveEdit} className={`px-4 py-2 rounded-md transition-colors bg-[#059669] text-white hover:bg-[#059669]/90`}>
                        Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!editMode ? (
                // --- VIEW MODE ---
                // ... (View mode remains unchanged) ...
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">Conference Name</label>
                      <p className="text-[#1f2937] font-semibold text-lg">{conference.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">Location</label>
                      <p className="text-[#1f2937]">{conference.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">Conference Website</label>
                      <a href={conference.link} target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline break-all">
                        {conference.link}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">Start Date</label>
                      <p className="text-[#1f2937]">{formatDate(conference.startsAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">End Date</label>
                      <p className="text-[#1f2937]">{formatDate(conference.endAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6b7280] mb-1">Submission Deadline</label>
                      <p className="text-[#1f2937]">{formatDateTime(conference.deadline)}</p>
                    </div>
                  </div>
                  
                  {conference.Partners && conference.Partners.length > 0 && (
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-[#6b7280] mb-2">Conference Partners</label>
                      <div className="flex flex-wrap gap-2">
                        {conference.Partners.map((p, i) =>
                          <span key={i} className="px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">{p}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {tracks && tracks.length > 0 && (
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-[#6b7280] mb-2">Conference Tracks</label>
                      <div className="flex flex-wrap gap-2">
                        {tracks.map((track) =>
                          <span key={track.id} className="px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                            {track.Name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // --- EDIT MODE FORM ---
                // ... (Edit mode form remains unchanged) ...
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Name *</label>
                      <input 
                        type="text" 
                        value={editFormData.name} 
                        onChange={(e) => handleInputChange("name", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        disabled={editModeType === 'deadline'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">City *</label>
                      <input 
                        type="text" 
                        value={editFormData.city} 
                        onChange={(e) => handleInputChange("city", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        disabled={editModeType === 'deadline'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Country *</label>
                      <select 
                        value={editFormData.country} 
                        onChange={(e) => handleInputChange("country", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none appearance-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={editModeType === 'deadline'}
                      >
                        <option value="">Select a country</option>
                        {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Website *</label>
                      <input 
                        type="url" 
                        value={editFormData.link} 
                        onChange={(e) => handleInputChange("link", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        disabled={editModeType === 'deadline'}
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Start Date *</label>
                      <input 
                        type="date" 
                        value={editFormData.startsAtDate} 
                        onChange={(e) => handleInputChange("startsAtDate", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={editModeType === 'deadline'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">End Date *</label>
                      <input 
                        type="date" 
                        value={editFormData.endAtDate} 
                        onChange={(e) => handleInputChange("endAtDate", e.target.value)} 
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={editModeType === 'deadline'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">Deadline Date *</label>
                        <input 
                          type="date" 
                          value={editFormData.deadlineDate} 
                          onChange={(e) => handleInputChange("deadlineDate", e.target.value)} 
                          className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                          disabled={editModeType === 'details'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1f2937] mb-2">Deadline Time *</label>
                        <input 
                          type="time" 
                          value={editFormData.deadlineTime} 
                          onChange={(e) => handleInputChange("deadlineTime", e.target.value)} 
                          className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                          disabled={editModeType === 'details'}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`lg:col-span-2 ${editModeType === 'deadline' ? 'opacity-50' : ''}`}>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Partners</label>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={partnerInput} 
                        onChange={(e) => setPartnerInput(e.target.value)} 
                        onKeyPress={handleKeyPress} 
                        placeholder="Enter partner name" 
                        className="flex-1 px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        disabled={editModeType === 'deadline'}
                      />
                      <button 
                        type="button" 
                        onClick={addPartner} 
                        className="px-6 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 font-medium disabled:opacity-50"
                        disabled={editModeType === 'deadline'}
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.Partners && editFormData.Partners.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editFormData.Partners.map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                            {p}
                            <button 
                              type="button" 
                              onClick={() => removePartner(p)} 
                              className="hover:bg-[#059669]/20 rounded-full p-0.5 disabled:opacity-50"
                              disabled={editModeType === 'deadline'}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 opacity-50">
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Conference Tracks</label>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="Tracks are managed in the 'Track Management' tab below" 
                        className="flex-1 px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 border-[#e5e7eb] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={true}
                      />
                      <button 
                        type="button" 
                        className="px-6 py-3 bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 font-medium disabled:opacity-50"
                        disabled={true}
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.Tracks && editFormData.Tracks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editFormData.Tracks.map((track, i) => (
                          <span key={track.id || `new-${i}`} className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                            {track.Name}
                            <button 
                              type="button" 
                              className="hover:bg-[#059669]/20 rounded-full p-0.5 disabled:opacity-50"
                              disabled={true}
                            >
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

          {/* --- TABBED MANAGEMENT SECTION --- */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <div className="border-b border-[#e5e7eb]">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("tracks")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "tracks"
                      ? "border-[#059669] text-[#059669]"
                      : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                  }`}
                >
                  Track Management
                </button>
                <button
                  onClick={() => setActiveTab("verdicts")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "verdicts"
                      ? "border-[#059669] text-[#059669]"
                      : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                  }`}
                >
                  Final Verdicts (All Papers)
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === "tracks" && (
                <div className="space-y-6">
                
                  {/* --- ADDED: Conference-Wide Statistics Block --- */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
                      <h3 className="text-sm font-medium text-[#6b7280]">Total Tracks</h3>
                      <p className="text-3xl font-bold text-[#059669]">{tracks.length}</p>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
                      <h3 className="text-sm font-medium text-[#6b7280]">Total Papers Submitted</h3>
                      <p className="text-3xl font-bold text-[#059669]">
                        {papers.length}
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
                      <h3 className="text-sm font-medium text-[#6b7280]">Pending Decisions</h3>
                      {/* Using "Under Review" as the equivalent of "Pending" */}
                      <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => p.Status === 'Under Review').length}</p>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
                      <h3 className="text-sm font-medium text-[#6b7280]">Total Track Chairs</h3>
                      <p className="text-3xl font-bold text-[#059669]">
                        {new Set(tracks.flatMap(t => t.Chairs ? t.Chairs.map(c => c.id) : [])).size}
                      </p>
                    </div>
                  </div>
                  {/* --- END: Conference-Wide Statistics Block --- */}

                  {/* --- MODIFIED: Removed onBulkDecision prop --- */}
                  <TrackList 
                    tracks={tracksWithPapers}
                    onAssignChairClick={handleAssignChairClick}
                    onCreateTrack={handleCreateTrack}
                  />
                </div>
              )}

              {activeTab === "verdicts" && (
                <div className="space-y-6">
                  {/* --- MODIFIED: Renamed prop to onBulkDecision --- */}
                  <VerdictSection 
                    papers={papers}
                    onBulkDecision={handleBulkDecisionRequest}
                  />
                </div>
              )}
            </div>
          </div>
          {/* --- END OF TABBED SECTION --- */}

        </div>
      </main>

      {/* --- MODALS --- */}
      {/* ... (Create Track Modal and Assign Chair Modal remain unchanged) ... */}
      {showCreateTrackForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Create New Track</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Track Name</label>
                <input 
                  type="text" 
                  value={newTrackName} 
                  onChange={(e) => setNewTrackName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" 
                  placeholder="Enter track name"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSaveTrack}
                  className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90"
                >
                  Create Track
                </button>
                <button 
                  onClick={() => setShowCreateTrackForm(false)}
                  className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <AssignChairModal
          track={selectedTrackForAssignment}
          allUsers={allUsers}
          onClose={handleCloseModal}
          onAssign={handleAssignChairs}
        />
      )}
    </div>
  );
}