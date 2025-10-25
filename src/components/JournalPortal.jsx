"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext";

// --- Helper Functions & Table Component for Paper List ---
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
      badgeClasses += "bg-red-100 text-red-700"; // Includes 'Pending Submission'
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// --- Paper List Component ---
const PaperList = ({ papers }) => {
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate(); // Moved hook to the top

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedPapers = useMemo(() => {
    if (!papers) return [];
    const sorted = [...papers].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // Handle date sorting (assuming submittedAt is a date string or object)
      if (sortBy === 'submittedAt') {
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
  }, [papers, sortBy, sortOrder]);

  if (!papers || papers.length === 0) {
    return <p className="text-center text-gray-500 py-4">No papers submitted yet.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("id")}
            >
              Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("Title")}
            >
              Name {sortBy === "Title" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("submittedAt")}
            >
              Submitted On {sortBy === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Keywords</th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937] whitespace-nowrap"
              onClick={() => handleSort("Status")}
            >
              Status {sortBy === "Status" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPapers.map((paper) => (
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
                  {(paper.Keywords || []).map((keyword, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md">
                      {keyword}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">{getStatusBadge(paper.Status)}</td>
              <td className="py-3 px-4">
                <button onClick={() => navigate(`/paper/${paper.id}`)} className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Small reusable author card (compact) ---
const CompactAuthorCard = ({ author }) => {
  if (!author) return null;
  return (
    <div className="p-3 border rounded-md bg-white">
      <p className="text-sm font-semibold text-[#1f2937]">{author.firstname} {author.lastname} <span className="text-xs text-gray-500">({author.email})</span></p>
      <p className="text-xs text-[#6b7280]">Expertise: {Array.isArray(author.expertise) ? author.expertise.join(', ') : (author.expertise || '—')}</p>
      <p className="text-xs text-[#6b7280]">Organisation: {author.organisation || '—'}</p>
    </div>
  );
};

// --- Utility to reorder array on drag end ---
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// --- Main Component ---
export default function JournalPortal() {
  const { user, setUser, loginStatus, setloginStatus } = useUserData();
  const navigate = useNavigate();

  // --- Data state ---
  const [papers, setPapers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // --- UI State ---
  const [showSubmissionForm, setShowSubmissionForm] = useState(false); // Controls modal visibility

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authors, setAuthors] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);

  // --- Invite Form State ---
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrg, setInviteOrg] = useState("");
  const [inviteCountry, setInviteCountry] = useState("");
  const countries = [ // Example list, replace or fetch dynamically if needed
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];

  // --- Event Handlers ---
  const handlePortalClick = (portal) => navigate(`/${portal}`);
  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  // --- NEW SUBMISSION FORM LOGIC ---
  const newSubmission = () => {
    setTitle("");
    setAbstract("");
    setKeywords("");
    setPdfFile(null);
    setShowInviteForm(false);
    setInviteFirstName("");
    setInviteLastName("");
    setInviteEmail("");
    setInviteOrg("");
    setInviteCountry("");

    if (user && user.id) {
      setAuthors([user]); // Start with the logged-in user
    } else {
      setAuthors([]);
      console.warn("Attempting to create submission without a logged-in user.");
    }
    setShowSubmissionForm(true);
  };

  // --- Author Management Handlers ---
  const addAuthorById = (userId) => {
    if (!userId) return;
    const parsedId = parseInt(userId, 10);
    const userObj = allUsers.find(u => u.id === parsedId);
    if (!userObj) {
      console.warn("Selected user not found in allUsers list.");
      return;
    }
    if (authors.some(a => a && a.id === userObj.id)) {
      alert('This author is already added.');
      return;
    }
    setAuthors(prev => [...prev, userObj]);
  };

  const handleRemoveAuthor = (indexToRemove) => {
    if (authors.length <= 1) {
      alert('At least one author is required.');
      return;
    }
    setAuthors(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setAuthors(reorder(authors, result.source.index, result.destination.index));
  };

  // --- Invite Author Handler ---
  const handleInviteAuthor = async (e) => {
    // Prevent default needed if button type="submit", not needed for type="button" + onClick
    e?.preventDefault(); 
    if (!inviteEmail || !inviteFirstName || !inviteLastName || !inviteCountry) {
        alert("Please fill in first name, last name, email, and country.");
        return;
    }
    try {
        const response = await fetch('http://localhost:3001/users', { // Use the create user endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: inviteEmail,
                firstname: inviteFirstName,
                lastname: inviteLastName,
                organisation: inviteOrg,
                country: inviteCountry,
                password: "defaultPassword123", // Set a default/temporary password
                role: "AUTHOR", // Or appropriate role
                expertise: [] // Default empty expertise
            }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to invite user.");
        }
        const newUser = await response.json();

        
        // Add user to BOTH lists immediately
        setAuthors(prev => [...prev, newUser]);
        setAllUsers(prev => [...prev, newUser]); 

        // Reset and hide invite form
        setShowInviteForm(false);
        setInviteEmail(""); setInviteFirstName(""); setInviteLastName(""); setInviteOrg(""); setInviteCountry("");
    } catch (error) {
        console.error("Invite failed:", error);
        alert(`Error inviting user: ${error.message}`);
    }
  };

  // --- Initial Paper Save Handler ---
  const handlePaperSubmit = async (event) => {
    event.preventDefault();
    if (!pdfFile) {
        alert("Please select a PDF file to upload.");
        return;
    }
    if (authors.length === 0) {
        alert("At least one author is required.");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)));
    // Send ordered author IDs
    formData.append('authorIds', JSON.stringify(authors.map(a => a.id)));
    formData.append('pdfFile', pdfFile);


    try {
      const response = await fetch('http://localhost:3001/savepaper', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to Save Paper.');
      }
      const savedPaper = await response.json();
      alert('Paper Saved Successfully! You can view/edit it from "My Submissions".');
      setShowSubmissionForm(false);
      // Refresh the papers list after successful save
      await getPapers(); // Call the fetch function directly
    } catch (error) {
        console.error('Submission failed:', error);
        alert(`Error: ${error.message}`);
    }
  };

  // --- Data Fetching Effects ---
  // Define getPapers outside useEffect so it can be called manually
  const getPapers = async () => {
      if (user && user.id) {
          try {
              const response = await fetch(`http://localhost:3001/papers?authorId=${user.id}`);
              if (response.status === 404) {
                  console.log("No papers found for user, setting empty array.");
                  setPapers([]); return;
              }
              if (!response.ok) throw new Error("Paper data fetch failed.");
              const data = await response.json();
              setPapers(data.papers || []);
          } catch (err) { console.error("Error fetching papers:", err); setPapers([]); } // Set empty on error
      } else {
          console.log("No user logged in, clearing papers.");
          setPapers([]); // Clear papers if no user
      }
  };
    useEffect(() => { getPapers(); }, [user]); // Fetch papers when user changes

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Ensure this route returns FULL user objects
        const response = await fetch('http://localhost:3001/users/emails');
        if (!response.ok) throw new Error("User data fetch failed.");
        const data = await response.json();
        setAllUsers(data.users || []);
      } catch (error) { console.error("Error fetching users:", error); }
    };
    fetchUsers();
  }, []); // Fetch users only once on component mount

  // --- RENDER ---
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
          <h2 className="text-3xl font-bold text-[#1f2937]">Journal Portal</h2>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Total Submissions</h3>
              <p className="text-3xl font-bold text-[#059669]">{papers.length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Accepted Papers</h3>
              <p className="text-3xl font-bold text-[#059669]">{papers.filter((p) => p.Status === "Accepted").length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Under Review</h3>
              <p className="text-3xl font-bold text-[#f59e0b]">{papers.filter((p) => p.Status === "Under Review").length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Rejected</h3>
              <p className="text-3xl font-bold text-red-700">{papers.filter((p) => p.Status === "Rejected").length}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">Pending Submission</h3>
              <p className="text-3xl font-bold text-red-700">{papers.filter((p) => p.Status === "Pending Submission").length}</p>
            </div>
          </div>

          {/* My Submissions Section */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">My Submissions</h3>
            <PaperList papers={papers} />
          </div>
        </div>
      </main>

      {/* --- MODAL with NEW Submission Form --- */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          {/* Modal Container */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#1f2937]">New Paper Submission</h3>
              <button onClick={() => setShowSubmissionForm(false)} className="text-[#6b7280] hover:text-[#1f2937]">✕</button>
            </div>

            {/* --- Form adapted from ViewPaper --- */}
            <form className="space-y-4" onSubmit={handlePaperSubmit}>
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                       className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={4}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords (comma-separated)</label>
                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} required
                       className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
              </div>

              {/* --- Authors Section --- */}
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors (drag to reorder)</label>
                <div className="space-y-2">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="authors-droppable-new">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {authors.map((author, index) => (
                            <Draggable key={author?.id ?? `new-author-${index}`} draggableId={String(author?.id ?? `new-author-${index}`)} index={index}>
                              {(prov) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                  <div {...prov.dragHandleProps} className="cursor-grab select-none text-[#6b7280]">☰</div>
                                  <div className="flex-1"><CompactAuthorCard author={author} /></div>
                                  <button type="button" onClick={() => handleRemoveAuthor(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* --- Add/Invite Author UI --- */}
                  {!showInviteForm && (
                    <div className="flex gap-2 items-center mt-2">
                      <select defaultValue="" onChange={(e) => { addAuthorById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                        <option value="" disabled>-- Add another author by email --</option>
                        {allUsers
                          .filter(u => u && u.id && !authors.some(a => a && a.id === u.id)) // Added checks for u and u.id
                          .map(u => ( <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option> ))}
                      </select>
                      <button type="button" onClick={() => setShowInviteForm(true)} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                    </div>
                  )}

                  {/* --- Invite New Author Form (using div instead of form) --- */}
                  {showInviteForm && (
                    <div className="p-4 border border-dashed border-[#059669] rounded-lg space-y-3 bg-white mt-4">
                       <h4 className="font-medium text-[#1f2937]">Invite New Author</h4>
                       <div className="grid grid-cols-2 gap-3">
                         <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="First Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                         <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Last Name*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                       </div>
                       <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email Address*" required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                       <input type="text" value={inviteOrg} onChange={e => setInviteOrg(e.target.value)} placeholder="Organisation" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                       <select id="country-invite" value={inviteCountry} onChange={e => setInviteCountry(e.target.value)} required className={`w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] appearance-none focus:outline-none focus:ring-2 focus:ring-[#059669] ${inviteCountry ? "text-[#1f2937]" : "text-gray-400"}`}>
                         <option value="">Select a country*</option>
                         {countries.map((country) => ( <option key={country} value={country}>{country}</option> ))}
                       </select>
                       <div className="flex gap-3">
                         <button type="button" onClick={handleInviteAuthor} className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90">Add User as Author</button>
                         <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* --- File Upload --- */}
              <div>
                <label className="block text-sm font-medium text-[#1f2937] mb-1">Upload Paper (PDF)</label>
                <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" required className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20" />
              </div>

              {/* --- Action Buttons --- */}
              <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                <button type="submit" className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Save Paper</button>
                <button type="button" onClick={() => setShowSubmissionForm(false)} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
              </div>
            </form>
          </div> {/* End Modal Content */}
        </div> // End Modal Backdrop
      )}
    </div> // End Main Div
  );
}