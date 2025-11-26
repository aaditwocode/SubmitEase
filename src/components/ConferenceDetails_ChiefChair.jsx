// src/pages/ConferenceDetailPage.js

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useUserData } from "./UserContext";
import { Base64 } from "js-base64"; // <-- Make sure to install: npm install js-base64
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
const TrackList = ({ tracks, onAssignChairClick, onCreateTrack, onRemoveChair }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = tracks.filter(track =>
    track.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="p-4 flex justify-between items-center bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search tracks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
        <button onClick={onCreateTrack} className="ml-4 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors">
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
              <div className="flex justify-between items-center mb-3">
                 <h4 className="text-sm font-medium text-[#6b7280]">Track Chairs</h4>
                 <button
                    onClick={() => onAssignChairClick(track)}
                    className="px-3 py-1 text-sm bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
                  >
                    Manage Chairs
                  </button>
              </div>
             
              {/* --- Track Chair Table --- */}
              <div className="overflow-x-auto border border-[#e5e7eb] rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {track.Chairs && track.Chairs.length > 0 ? (
                      track.Chairs.map((chair) => (
                        <tr key={chair.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {chair.firstname} {chair.lastname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.organisation || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => onRemoveChair(track.id, chair.id)}
                              className="text-red-600 hover:text-red-900 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No chairs assigned to this track.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <TrackStatistics papers={track.Paper} />
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-10">
          <p>No tracks found matching your search.</p>
        </div>
      )}
    </div>
  );
};


// --- Verdict Section Component ---
const VerdictSection = ({ papers, onBulkDecision, navigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [trackFilter, setTrackFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());

  // 1. Pre-process papers to calculate Average Rating from Reviews
  const processedPapers = useMemo(() => {
    const rawPapers = Array.isArray(papers) ? papers : [];
    
    return rawPapers.map(paper => {
      const reviews = paper.Reviews || [];
      // Filter out reviews that might not have a score yet if necessary
      const validReviews = reviews.filter(r => typeof r.avgScore === 'number');
      
      const sum = validReviews.reduce((acc, curr) => acc + curr.avgScore, 0);
      const avg = validReviews.length > 0 ? sum / validReviews.length : 0;

      return {
        ...paper,
        calculatedAvgRating: avg // Store calculated average here
      };
    });
  }, [papers]);

  // Get unique values for filters based on processed papers
  const tracks = useMemo(() =>
    [...new Set(processedPapers.map(p => p.Tracks?.Name || 'N/A'))].sort(),
    [processedPapers]
  );
  const statuses = useMemo(() =>
    [...new Set(processedPapers.map(p => p.Status))].sort(),
    [processedPapers]
  );

  // 2. Filter papers based on search and filters
  const filteredPapers = useMemo(() => {
    return processedPapers.filter(paper => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = paper.Title.toLowerCase().includes(lowerSearch) ||
        paper.id.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || paper.Status === statusFilter;
      const matchesTrack = trackFilter === 'All' || (paper.Tracks?.Name || 'N/A') === trackFilter;
      
      // Use the calculated average for filtering
      const matchesRating = ratingFilter === 0 || paper.calculatedAvgRating >= ratingFilter;

      return matchesSearch && matchesStatus && matchesTrack && matchesRating;
    });
  }, [processedPapers, searchTerm, statusFilter, trackFilter, ratingFilter]);

  // 3. Sort the filtered papers (Requires useSortableData hook, assumed to be imported or available)
  // Note: key 'calculatedAvgRating' is used for sorting now
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
      const allVisibleIds = sortedPapers.map(p => p.id);
      
      // Check if all currently visible papers are selected
      const allVisibleSelected = allVisibleIds.every(id => prevSelected.has(id));
      
      const newSelected = new Set(prevSelected);
      
      if (allVisibleSelected) {
        // Deselect all visible
        allVisibleIds.forEach(id => newSelected.delete(id));
      } else {
        // Select all visible (filtering out final papers if needed, logic preserved)
        // Assuming we only select non-final papers or all depending on requirements.
        // Based on previous code:
        sortedPapers.forEach(p => {
            if(!p.isFinal) newSelected.add(p.id); 
        });
      }
      return newSelected;
    });
  };

  // --- HANDLER FOR BULK DECISIONS ---
  const handleBulkDecision = (decision) => {
    if (selectedPaperIds.size === 0) {
      alert("Please select at least one paper.");
      return;
    }
    onBulkDecision(Array.from(selectedPaperIds), decision);
    setSelectedPaperIds(new Set());
  };

  // --- Checkbox state for "Select All" ---
  const allVisibleSelected = useMemo(() => {
    if (sortedPapers.length === 0) return false;
    // Only check selectable papers (e.g., those not final, if that's the logic)
    const selectablePapers = sortedPapers.filter(p => !p.isFinal);
    if (selectablePapers.length === 0) return false;
    return selectablePapers.every(p => selectedPaperIds.has(p.id));
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
                // Disable if no papers or all visible papers are final (and thus not selectable for decision)
                disabled={sortedPapers.length === 0 || sortedPapers.every(p => p.isFinal)}
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
              {/* Changed Sort Key to calculatedAvgRating */}
              <button onClick={() => requestSort('calculatedAvgRating')} className="flex items-center gap-1 hover:text-[#1f2937]">
                Avg Rating {getSortIndicator('calculatedAvgRating')}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPapers.length > 0 ? (
            sortedPapers.map((paper, index) => (
              <tr
                key={paper.id}
                className={`border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors ${selectedPaperIds.has(paper.id) ? 'bg-green-50' : ''
                  }`}
              >
                <td className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedPaperIds.has(paper.id)}
                    onChange={() => handleSelectOne(paper.id)}
                    disabled={paper.isFinal}
                    className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{index + 1}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.Title}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.Tracks?.Name || 'N/A'}</td>
                <td className="py-3 px-4">{getStatusBadge(paper.Status)}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">
                  {/* Display the calculated average */}
                  {paper.calculatedAvgRating > 0 ? paper.calculatedAvgRating.toFixed(1) : 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify">
                    <button onClick={() => navigate(`/PaperDecision/${paper.id}`)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center text-gray-500 py-4">
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


const ProceedingsTab = ({ conferenceId }) => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());

  useEffect(() => {
    const fetchProceedingsPapers = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3001/conference/proceedings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conferenceId }),
        });
        if (!response.ok) throw new Error("Failed to fetch proceedings papers.");
        const data = await response.json();
        setPapers(data.paper || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (conferenceId) {
      fetchProceedingsPapers();
    }
  }, [conferenceId]);

  // Helper to fetch blob from URL
  const fetchBlob = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.blob();
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedPaperIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPaperIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPaperIds.size === papers.length) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(papers.map(p => p.id)));
    }
  };

  // --- Bulk Download (Flat list: 1.pdf, 2.pdf...) ---
  const handleBulkDownload = async () => {
    if (selectedPaperIds.size === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("proceedings");
    const selectedPapers = papers.filter(p => selectedPaperIds.has(p.id));

    let count = 0;
    for (const paper of selectedPapers) {
      if (paper.URL) {
        try {
          const blob = await fetchBlob(paper.URL);
          // Simple sequential naming
          const fileName = `${count + 1}.pdf`;
          folder.file(fileName, blob);
          count++;
        } catch (err) {
          console.error(`Error downloading paper ${paper.id}:`, err);
        }
      }
    }

    if (count > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "proceedings_all.zip");
    }
  };

  // --- UPDATED: Track-wise Download (Folders by Track, reset counter per folder) ---
  const handleTrackDownload = async () => {
    if (selectedPaperIds.size === 0) return;

    const zip = new JSZip();
    const selectedPapers = papers.filter(p => selectedPaperIds.has(p.id));

    // Object to keep track of file counts per track name
    // Example: { "AI_Track": 2, "Cybersecurity": 5 }
    const trackCounts = {}; 
    let globalCount = 0; // To check if we downloaded anything at all

    for (const paper of selectedPapers) {
      if (paper.URL) {
        try {
          const blob = await fetchBlob(paper.URL);
          
          // Get Track Name
          const trackName = paper.Tracks?.Name || "General_Track";
          // Sanitize Track Name for folder creation
          const safeTrackName = trackName.replace(/[^a-z0-9 _-]/gi, '_');

          // Initialize counter for this specific track if it doesn't exist
          if (!trackCounts[safeTrackName]) {
            trackCounts[safeTrackName] = 0;
          }
          
          // Increment counter for this track
          trackCounts[safeTrackName]++;
          
          // Name file: 1.pdf, 2.pdf... inside that specific folder
          const fileName = `${trackCounts[safeTrackName]}.pdf`;
          
          // Add to zip: Folder(Track) -> 1.pdf
          zip.folder(safeTrackName).file(fileName, blob);
          
          globalCount++;
        } catch (err) {
          console.error(`Error downloading paper ${paper.id}:`, err);
        }
      }
    }

    if (globalCount > 0) {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "proceedings_by_track.zip");
    } else {
      alert("No valid files found to download.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading proceedings...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1f2937]">Proceedings</h3>
        
        <div className="flex gap-2">
            <button
                onClick={handleTrackDownload}
                disabled={selectedPaperIds.size === 0}
                className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
                Download Track-wise
            </button>

            <button
                onClick={handleBulkDownload}
                disabled={selectedPaperIds.size === 0}
                className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
                Download Selected ({selectedPaperIds.size})
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <tr>
              <th className="py-3 px-4 text-center w-12">
                <input
                  type="checkbox"
                  checked={selectedPaperIds.size === papers.length && papers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50"
                />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Title</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Authors</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Status</th>
            </tr>
          </thead>
          <tbody>
            {papers.length > 0 ? (
              papers.map((paper) => (
                <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedPaperIds.has(paper.id)}
                      onChange={() => handleSelectOne(paper.id)}
                      className="rounded border-gray-300 text-[#059669] focus:ring-[#059669]/50"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.Title}</td>
                  <td className="py-3 px-4 text-sm text-[#6b7280]">
                    {paper.Authors ? paper.Authors.map(a => `${a.firstname} ${a.lastname}`).join(", ") : "N/A"}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6b7280]">{paper.Tracks?.Name || "N/A"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ready
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-8">
                  No papers found ready for proceedings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Publication & Registration Management Component ---
const PublicationRegistrationManagement = ({
  conference,
  allUsers,
  onAssignPublicationChairs,
  onAssignRegistrationChairs,
  onRemovePublicationChair,
  onRemoveRegistrationChair
}) => {
  const [selectedPublicationChairs, setSelectedPublicationChairs] = useState([]);
  const [selectedRegistrationChairs, setSelectedRegistrationChairs] = useState([]);
  const [isPubModalOpen, setIsPubModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  useEffect(() => {
    if (conference?.PublicationChairs) {
      setSelectedPublicationChairs(conference.PublicationChairs);
    }
    if (conference?.RegistrationChairs) {
      setSelectedRegistrationChairs(conference.RegistrationChairs);
    }
  }, [conference]);

  

  return (
    <div className="space-y-6">
      {/* Chairs Assignment Section - Vertical Stack */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Publication Chairs */}
        <div className="bg-white rounded-lg shadow border border-[#e5e7eb] overflow-hidden">
          <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1f2937]">Publication Chairs</h3>
            <button 
              onClick={() => setIsPubModalOpen(true)} 
              className="px-4 py-2 bg-[#059669] text-white rounded-md text-sm hover:bg-[#059669]/90 transition-colors"
            >
              Assign Publication Chairs
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedPublicationChairs.length > 0 ? (
                  selectedPublicationChairs.map(chair => (
                    <tr key={chair.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chair.firstname} {chair.lastname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.organisation || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => onRemovePublicationChair(chair.id)} className="text-red-600 hover:text-red-900 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No publication chairs assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration Chairs */}
        <div className="bg-white rounded-lg shadow border border-[#e5e7eb] overflow-hidden">
          <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1f2937]">Registration Chairs</h3>
            <button 
              onClick={() => setIsRegModalOpen(true)} 
              className="px-4 py-2 bg-[#059669] text-white rounded-md text-sm hover:bg-[#059669]/90 transition-colors"
            >
              Assign Registration Chairs
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedRegistrationChairs.length > 0 ? (
                  selectedRegistrationChairs.map(chair => (
                    <tr key={chair.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chair.firstname} {chair.lastname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chair.organisation || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => onRemoveRegistrationChair(chair.id)} className="text-red-600 hover:text-red-900 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No registration chairs assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {isPubModalOpen && <AssignChairModal track={{ id: null, Name: 'Publication Chairs' }} allUsers={allUsers} onClose={() => setIsPubModalOpen(false)} onAssign={(_, ids) => { onAssignPublicationChairs(ids); setIsPubModalOpen(false); }} />}
      {isRegModalOpen && <AssignChairModal track={{ id: null, Name: 'Registration Chairs' }} allUsers={allUsers} onClose={() => setIsRegModalOpen(false)} onAssign={(_, ids) => { onAssignRegistrationChairs(ids); setIsRegModalOpen(false); }} />}
    </div>
  );
};

// --- Assign Conference Role Modal Component ---
const AssignConferenceRoleModal = ({ title, allUsers, selectedUsers, onAssign, onClose }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const userMap = useMemo(() =>
    new Map(allUsers.map(user => [user.id, user])),
    [allUsers]
  );

  const currentSelectedUsers = useMemo(() =>
    selectedUserIds.map(id => userMap.get(id)).filter(Boolean),
    [selectedUserIds, userMap]
  );

  useEffect(() => {
    if (selectedUsers) {
      setSelectedUserIds(selectedUsers.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [selectedUsers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(selectedUserIds);
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-4">
          {title}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">Selected Chairs</label>
            <div className="p-2 min-h-[40px] border border-[#e5e7eb] rounded-md bg-white flex flex-wrap gap-2">
              {currentSelectedUsers.length > 0 ? (
                currentSelectedUsers.map(user => (
                  <span key={user.id} className="inline-flex items-center gap-2 px-3 py-1 bg-[#059669]/10 text-[#059669] rounded-full text-sm">
                    {user.firstname} {user.lastname}
                    <button
                      type="button"
                      onClick={() => removeChair(user.id)}
                      className="hover:bg-[#059669]/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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

// ---
// --- HEADER COMPONENT ---
// ---
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
export default function ConferenceDetails_ChiefChair() {
  const navigate = useNavigate();
  const { hashedConId } = useParams();
  const {user, setUser, setloginStatus} = useUserData();
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
        setTracks(data.tracks || []);
      } else {
        throw new Error("Track data fetch failed.");
      }
    } catch (err) {
      console.error(err);
      setTracks([]);
    }
  };

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
        const response = await fetch(`http://localhost:3001/get-conference-by-id`, {
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
          Tracks: []
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

  useEffect(() => {
    if (tracks.length > 0 || conference?.Tracks?.length > 0) {
      setEditFormData((prev) => ({
        ...prev,
        Tracks: tracks
      }));
    }
  }, [tracks, conference]);

  const tracksWithPapers = useMemo(() => {
    return tracks.map(track => {
      const papersForThisTrack = papers.filter(paper => paper.TrackId === track.id);
      return {
        ...track,
        Paper: papersForThisTrack,
      };
    });
  }, [tracks, papers]);

  // ---
  // --- EVENT HANDLERS (Conference Edit) ---
  // ---
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
      const isConfirmed = window.confirm(
        "Please Note: This will close your conference for submission and will be transferred to Admin for 'Approval'.\n\nDo you want to proceed?"
      );

      if (!isConfirmed) {
        return;
      }

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
        ...prev,
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
      setTracks(data.tracks || []);

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
      setTracks(data.tracks || []);

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
  const runSingleDecisionAPI = async (paperId, decision) => {
    try {
      const response = await fetch(`http://localhost:3001/final-paper-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: paperId,
          decision: decision,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update decision');
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to save decision for paper ${paperId}:`, error);
      throw error;
    }
  };

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
      fetchPapers(decodedConferenceId);
    }
  };

  // ---
  // --- PUBLICATION/REGISTRATION HANDLERS ---
  // ---
  const handleAssignPublicationChairs = async (userIds) => {
    try {
      const response = await fetch(`http://localhost:3001/conference/assign-publication-chairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: decodedConferenceId,
          userIds: userIds,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to assign publication chairs");
      }

      const data = await response.json();
      setConference(data.conference);
      alert('Publication chairs updated successfully!');
    } catch (error) {
      console.error("Error assigning publication chairs:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRemovePublicationChair = async (userId) => {
    if (!window.confirm("Remove this Publication Chair?")) return;
    try {
      const res = await fetch('http://localhost:3001/conference/remove-publication-chair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conferenceId: decodedConferenceId, userId })
      });
      if (res.ok) {
        const d = await res.json();
        // Update conference state to remove the chair from the list
        setConference(d.conference);
      }
    } catch (e) { console.error(e); }
  };

  const handleAssignRegistrationChairs = async (userIds) => {
    try {
      const response = await fetch(`http://localhost:3001/conference/assign-registration-chairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceId: decodedConferenceId,
          userIds: userIds,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to assign registration chairs");
      }

      const data = await response.json();
      setConference(data.conference);
      alert('Registration chairs updated successfully!');
    } catch (error) {
      console.error("Error assigning registration chairs:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRemoveRegistrationChair = async (userId) => {
    if (!window.confirm("Remove this Registration Chair?")) return;
    try {
      const res = await fetch('http://localhost:3001/conference/remove-registration-chair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conferenceId: decodedConferenceId, userId })
      });
      if (res.ok) {
        const d = await res.json();
        // Update conference state to remove the chair from the list
        setConference(d.conference);
      }
    } catch (e) { console.error(e); }
  };
  // ---
  // --- RENDER LOGIC ---
  // ---
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

  const Header = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  
    // 1. Configuration: Maps DB Role Strings -> Frontend Routes
    const ROLE_CONFIG = {
      "Author": { label: "Author", path: "/conference" },
      "Conference Host": { label: "Conference Host", path: "/conference/manage/chiefchair" },
      "Reviewer": { label: "Reviewer", path: "/ManageReviews" },
      "Track Chair": { label: "Track Chair", path: "/conference/manage/trackchair" },
      "Publication Chair": { label: "Publication Chair", path: "/conference/manage/publicationchair" },
      "Registration Chair": { label: "Registration Chair", path: "/conference/manage/registrationchair" }
    };
  
    // 2. Filter options based on the current user's roles
    const availablePortals = useMemo(() => {
      if (!user || !user.role || !Array.isArray(user.role)) return [];
      return user.role
        .map(roleString => ROLE_CONFIG[roleString])
        .filter(Boolean);
    }, [user]);
  
    const handleLogout = () => {
      setUser(null);
      setloginStatus(false);
      navigate("/home");
    };
  
    return (
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left Side: Logo & Register Tab */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#059669]">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
            </div>
  
            {/* Clean Navbar - Only Register remains */}
            <nav className="hidden items-center md:flex">
              <button 
                onClick={() => navigate('/conference/registration')}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#059669] hover:bg-green-50 px-3 py-2 rounded-md"
              >
                Register a Conference
              </button>
            </nav>
          </div>
  
          {/* Right Side: Actions */}
          <div className="flex items-center gap-3">
            
            {/* 1. Dynamic "Switch Portal" Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="group flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors bg-white"
              >
                Switch Portal
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
  
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#e5e7eb] py-2 z-50">
  
                  {/* Divider if we have dynamic roles */}
                  {availablePortals.length > 0 && (
                    <div className="border-gray-100 my-1"></div>
                  )}
  
                  {/* Dynamic Links based on User Roles */}
                  {availablePortals.length > 0 && (
                    <>
                      <h6 className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Your Roles
                      </h6>
                      {availablePortals.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(option.path);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f3f4f6] hover:text-[#059669]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
  
            {/* 2. Return to Dashboard */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:block rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90"
            >
              Return To Dashboard
            </button>
  
            {/* 3. Logout */}
            <button 
              onClick={handleLogout} 
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate("/conference/manage/chiefchair")} className="mb-4 text-[#059669] hover:text-[#047857] font-medium">
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
                      <button onClick={handleEditDetailsClick} disabled={conference.status != "Open"} className="ml-6 px-4 py-2 rounded-md border border-[#e5e7eb] bg-[#059669] text-white hover:bg-[#059669]/90 transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed">
                        Edit Conference Details
                      </button>
                      <button onClick={handleEditDeadlineClick} disabled={conference.status != "Open"} className="ml-2 px-4 py-2 rounded-md border border-[#e5e7eb] bg-[#059669] text-white hover:bg-[#059669]/90 transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed">
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
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <div className="border-b border-[#e5e7eb]">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("tracks")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "tracks"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                    }`}
                >
                  Track Management
                </button>
                <button
                  onClick={() => setActiveTab("verdicts")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "verdicts"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                    }`}
                >
                  Final Verdicts (All Papers)
                </button>
                <button
                  onClick={() => setActiveTab("pubreg")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "pubreg"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                    }`}
                >
                  Publication & Registration
                </button>
                <button
                  onClick={() => setActiveTab("proceedings")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "proceedings"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                    }`}
                >
                  Proceedings
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === "tracks" && (
                <div className="space-y-6">
                  {/* Conference-Wide Statistics Block */}
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
                      <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => p.Status === 'Under Review').length}</p>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
                      <h3 className="text-sm font-medium text-[#6b7280]">Total Track Chairs</h3>
                      <p className="text-3xl font-bold text-[#059669]">
                        {new Set(tracks.flatMap(t => t.Chairs ? t.Chairs.map(c => c.id) : [])).size}
                      </p>
                    </div>
                  </div>

                  <TrackList
                    tracks={tracksWithPapers}
                    onAssignChairClick={handleAssignChairClick}
                    onCreateTrack={handleCreateTrack}
                  />
                </div>
              )}

              {activeTab === "verdicts" && (
                <div className="space-y-6">
                  <VerdictSection
                    papers={papers}
                    onBulkDecision={handleBulkDecisionRequest}
                    navigate={navigate}
                  />
                </div>
              )}

              {activeTab === "pubreg" && (
                <div className="space-y-6">
                  <PublicationRegistrationManagement
                    conference={conference}
                    allUsers={allUsers}
                    onAssignPublicationChairs={handleAssignPublicationChairs}
                    onAssignRegistrationChairs={handleAssignRegistrationChairs}
                    onRemovePublicationChair={handleRemovePublicationChair}
                    onRemoveRegistrationChair={handleRemoveRegistrationChair}
                  />
                </div>
              )}

              {activeTab === "proceedings" && (
                <div className="space-y-6">
                  <ProceedingsTab conferenceId={decodedConferenceId} />
                </div>
              )}
            </div>
          </div>
          {/* --- END OF TABBED SECTION --- */}

        </div >
      </main >

      {/* --- MODALS --- */}
      {
        showCreateTrackForm && (
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
        )
      }

      {
        isAssignModalOpen && (
          <AssignChairModal
            track={selectedTrackForAssignment}
            allUsers={allUsers}
            onClose={handleCloseModal}
            onAssign={handleAssignChairs}
          />
        )
      }
    </div >
  );
}