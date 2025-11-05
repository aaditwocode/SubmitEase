"use client";
import React, { useState, useEffect } from "react";
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
    case "Rejected":
      badgeClasses += "bg-red-100 text-red-700";
      break;
    default:
      badgeClasses += "bg-gray-100 text-gray-700";
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};

// --- Track List Component ---
const TrackList = ({ tracks, onTrackSelect, onCreateTrack }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = tracks.filter(track => 
    track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.id.toString().includes(searchTerm)
  );

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search tracks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
        <button 
          onClick={onCreateTrack}
          className="ml-4 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
        >
          Create New Track
        </button>
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Papers</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track Chair</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => (
              <tr key={track.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{track.id}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{track.name}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{track.paperCount || 0}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">
                  {track.chair ? `${track.chair.firstname} ${track.chair.lastname}` : 'Not Assigned'}
                </td>
                <td className="py-3 px-4">
                  <button 
                    onClick={() => onTrackSelect(track)}
                    className="px-3 py-1 text-xs bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors mr-2"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 py-4">No tracks found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Role Assignment Component ---
const RoleAssignment = ({ track, users, onAssignRole, onRemoveRole }) => {
  const [selectedRole, setSelectedRole] = useState("trackChair");
  const [selectedUser, setSelectedUser] = useState("");

  const handleAssignRole = () => {
    if (!selectedUser) {
      alert("Please select a user");
      return;
    }
    
    const user = users.find(u => u.id === parseInt(selectedUser));
    if (!user) return;
    
    onAssignRole(track.id, selectedRole, user);
    setSelectedUser("");
  };

  const roleDisplayNames = {
    trackChair: "Track Chair",
    reviewer: "Reviewer",
    author: "Author"
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Role Assignment for {track.name}</h3>
      
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#1f2937] mb-1">Role</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
          >
            <option value="trackChair">Track Chair</option>
            <option value="reviewer">Reviewer</option>
            <option value="author">Author</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#1f2937] mb-1">User</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstname} {user.lastname} ({user.email})
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button 
            onClick={handleAssignRole}
            className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
          >
            Assign Role
          </button>
        </div>
      </div>
      
      {/* Display assigned roles */}
      <div className="space-y-4">
        {Object.entries(roleDisplayNames).map(([roleKey, roleName]) => (
          <div key={roleKey}>
            <h4 className="font-medium text-[#1f2937] mb-2">{roleName}s</h4>
            <div className="flex flex-wrap gap-2">
              {track.roles && track.roles[roleKey] && track.roles[roleKey].length > 0 ? (
                track.roles[roleKey].map(user => (
                  <div key={user.id} className="flex items-center gap-2 px-3 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-md">
                    <span className="text-sm">
                      {user.firstname} {user.lastname} ({user.email})
                    </span>
                    <button 
                      onClick={() => onRemoveRole(track.id, roleKey, user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No {roleName.toLowerCase()}s assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Verdict Section Component ---
const VerdictSection = ({ papers, onFinalDecision }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.id.toString().includes(searchTerm)
  );

  const handleDecisionChange = (paperId, decision) => {
    onFinalDecision(paperId, decision);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search papers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]"
        />
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Paper Title</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Track Decision</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Avg Rating</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">Final Decision</th>
          </tr>
        </thead>
        <tbody>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                <td className="py-3 px-4 text-sm font-medium text-[#1f2937]">{paper.title}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">{paper.trackName || 'N/A'}</td>
                <td className="py-3 px-4">{getStatusBadge(paper.trackDecision)}</td>
                <td className="py-3 px-4 text-sm text-[#1f2937]">
                  {paper.avgRating ? paper.avgRating.toFixed(1) : 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecisionChange(paper.id, 'Accepted')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        paper.finalDecision === 'Accepted' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecisionChange(paper.id, 'Rejected')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        paper.finalDecision === 'Rejected' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 py-4">No papers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Chief Chair Component ---
export default function ChiefChair() {
  const { user, setUser, loginStatus, setloginStatus } = useUserData();
  const navigate = useNavigate();

  // Data state
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [papers, setPapers] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState("tracks"); // "tracks", "roles", "verdicts"
  const [showCreateTrackForm, setShowCreateTrackForm] = useState(false);
  const [newTrackName, setNewTrackName] = useState("");

  // Event Handlers
  const handlePortalClick = (portal) => navigate(`/${portal}`);
  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const handleTrackSelect = (track) => {
    setSelectedTrack(track);
    setActiveTab("roles");
  };

  const handleCreateTrack = () => {
    setShowCreateTrackForm(true);
  };

  // API CALL: Create new track
  const handleSaveTrack = async () => {
    if (!newTrackName.trim()) {
      alert("Please enter a track name");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTrackName,
          conferenceId: 1, // You might want to make this dynamic
        }),
      });

      if (!response.ok) throw new Error("Failed to create track");

      const newTrack = await response.json();
      setTracks(prev => [...prev, newTrack]);
      setNewTrackName("");
      setShowCreateTrackForm(false);
      alert('Track created successfully!');
    } catch (error) {
      console.error("Error creating track:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // API CALL: Assign role to track
  const handleAssignRole = async (trackId, role, user) => {
    try {
      const response = await fetch(`http://localhost:3001/tracks/${trackId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          userId: user.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign role");

      // Update local state
      setTracks(prev => prev.map(track => {
        if (track.id === trackId) {
          const updatedRoles = { ...track.roles };
          if (!updatedRoles[role]) updatedRoles[role] = [];
          updatedRoles[role].push(user);
          return { ...track, roles: updatedRoles };
        }
        return track;
      }));

      if (selectedTrack && selectedTrack.id === trackId) {
        setSelectedTrack(prev => {
          const updatedRoles = { ...prev.roles };
          if (!updatedRoles[role]) updatedRoles[role] = [];
          updatedRoles[role].push(user);
          return { ...prev, roles: updatedRoles };
        });
      }

      alert(`Role assigned successfully!`);
    } catch (error) {
      console.error("Error assigning role:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // API CALL: Remove role from track
  const handleRemoveRole = async (trackId, role, userId) => {
    try {
      const response = await fetch(`http://localhost:3001/tracks/${trackId}/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove role");

      // Update local state
      setTracks(prev => prev.map(track => {
        if (track.id === trackId && track.roles && track.roles[role]) {
          const updatedRoles = { ...track.roles };
          updatedRoles[role] = updatedRoles[role].filter(u => u.id !== userId);
          return { ...track, roles: updatedRoles };
        }
        return track;
      }));

      if (selectedTrack && selectedTrack.id === trackId) {
        setSelectedTrack(prev => {
          const updatedRoles = { ...prev.roles };
          if (updatedRoles[role]) {
            updatedRoles[role] = updatedRoles[role].filter(u => u.id !== userId);
          }
          return { ...prev, roles: updatedRoles };
        });
      }

      alert('Role removed successfully!');
    } catch (error) {
      console.error("Error removing role:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // API CALL: Update final decision for paper
  const handleFinalDecision = async (paperId, decision) => {
    try {
      const response = await fetch(`http://localhost:3001/papers/${paperId}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalDecision: decision,
        }),
      });

      if (!response.ok) throw new Error("Failed to update decision");

      // Update local state
      setPapers(prev => prev.map(paper => 
        paper.id === paperId ? { ...paper, finalDecision: decision } : paper
      ));

      alert(`Paper ${decision.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating decision:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // API CALL: Fetch all tracks
  const fetchTracks = async () => {
    try {
      const response = await fetch("http://localhost:3001/tracks");
      if (!response.ok) throw new Error("Track data fetch failed.");
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (err) { 
      console.error("Error fetching tracks:", err); 
      // If API fails, show empty state
      setTracks([]);
    }
  };

  // API CALL: Fetch all users for role assignment
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users');
      if (!response.ok) throw new Error("User data fetch failed.");
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) { 
      console.error("Error fetching users:", error); 
      setAllUsers([]);
    }
  };

  // API CALL: Fetch all papers for verdicts
  const fetchPapers = async () => {
    try {
      const response = await fetch('http://localhost:3001/papers');
      if (!response.ok) throw new Error("Paper data fetch failed.");
      const data = await response.json();
      setPapers(data.papers || []);
    } catch (error) { 
      console.error("Error fetching papers:", error); 
      setPapers([]);
    }
  };

  // Data Fetching Effects
  useEffect(() => {
    fetchTracks();
    fetchUsers();
    fetchPapers();
  }, []);

  return (
    <div className="min-h-screen bg-[#ffffff]">
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
            <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Conference Portal</button>
            <button onClick={() => handlePortalClick("dashboard")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#1f2937]">Chief Chair Portal</h2>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Tracks</h3>
              <p className="text-3xl font-bold text-[#059669]">{tracks.length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Papers for Review</h3>
              <p className="text-3xl font-bold text-[#059669]">{papers.length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Pending Decisions</h3>
              <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter(p => !p.finalDecision).length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Assigned Reviewers</h3>
              <p className="text-3xl font-bold text-[#059669]">
                {tracks.reduce((count, track) => 
                  count + (track.roles && track.roles.reviewer ? track.roles.reviewer.length : 0), 0)}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
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
                onClick={() => setActiveTab("roles")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "roles"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                }`}
                disabled={!selectedTrack && activeTab !== "roles"}
              >
                Role Assignment {selectedTrack && `- ${selectedTrack.name}`}
              </button>
              <button
                onClick={() => setActiveTab("verdicts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "verdicts"
                    ? "border-[#059669] text-[#059669]"
                    : "border-transparent text-[#6b7280] hover:text-[#1f2937] hover:border-[#e5e7eb]"
                }`}
              >
                Final Verdicts
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "tracks" && (
              <div className="space-y-6">
                <TrackList 
                  tracks={tracks} 
                  onTrackSelect={handleTrackSelect}
                  onCreateTrack={handleCreateTrack}
                />
              </div>
            )}

            {activeTab === "roles" && (
              <div className="space-y-6">
                {selectedTrack ? (
                  <RoleAssignment 
                    track={selectedTrack}
                    users={allUsers}
                    onAssignRole={handleAssignRole}
                    onRemoveRole={handleRemoveRole}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">Please select a track to manage roles.</p>
                    <button 
                      onClick={() => setActiveTab("tracks")}
                      className="mt-4 px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
                    >
                      Back to Tracks
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "verdicts" && (
              <div className="space-y-6">
                <VerdictSection 
                  papers={papers}
                  onFinalDecision={handleFinalDecision}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Track Modal */}
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
    </div>
  );
}