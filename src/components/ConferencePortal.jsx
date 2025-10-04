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
      badgeClasses += "bg-red-100 text-red-700";
      break;
  }
  return <span className={badgeClasses}>{status}</span>;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PaperList = ({ papers }) => {
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");

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
                <button className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#e5e7eb] transition-colors">View</button>
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

export default function ConferencePage() {
  const { user, setUser, loginStatus, setloginStatus } = useUserData();
  const navigate = useNavigate();

  // Data state
  const [conferences, setConferences] = useState([]);
  const [papers, setPapers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // should contain full user objects

  // UI State
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Form State
  const [selectedConference, setSelectedConference] = useState("");
  const [confId, setConfId] = useState(null);
  const [conf, setConf] = useState(null);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // Authors now stores full user objects (compact info) in order
  const [authors, setAuthors] = useState([]);

  // --- Event Handlers ---
  const handlePortalClick = (portal) => navigate(`/${portal}`);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };

  const newSubmission = (conf) => {
    setSelectedConference(conf.name);
    setConf(conf);
    setConfId(conf.id);
    setTitle("");
    setAbstract("");
    setKeywords("");
    setPdfFile(null);
    // pre-fill authors with current user object (so their details show)
    if (user && user.id) {
      // make sure user object contains firstname/lastname/expertise/organisation — else fetch
      setAuthors([user]);
    } else {
      setAuthors([]);
    }
    setShowSubmissionForm(true);
  };

  // Add another author by user id
  const addAuthorById = (userId) => {
    if (!userId) return;
    const parsedId = parseInt(userId, 10);
    const userObj = allUsers.find(u => u.id === parsedId);
    if (!userObj) return;
    if (authors.some(a => a && a.id === userObj.id)) {
      alert('This author is already added.');
      return;
    }
    setAuthors(prev => [...prev, userObj]);
  };

  // Remove author at index (ensure at least 1 author remains)
  const handleRemoveAuthor = (indexToRemove) => {
    if (authors.length <= 1) {
      alert('At least one author is required.');
      return;
    }
    setAuthors(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newList = reorder(authors, result.source.index, result.destination.index);
    setAuthors(newList);
  };

  const handlePaperSubmit = async (event) => {
    event.preventDefault();

    // placeholder for file upload — replace with real upload logic and URL
    const paperUrl = "http://example.com/path/to/placeholder.pdf";

    const authorIds = authors.map(a => a.id);

    const payload = {
      title,
      confId,
      conf,
      abstract,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      authorIds,
      url: paperUrl,
    };

    try {
      const response = await fetch('http://localhost:3001/savepaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to Save Paper.');
      }

      alert('Paper submitted successfully!');
      setShowSubmissionForm(false);
      // refresh papers
      // call getPapers() manually if you expose it or refetch papers
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    const getConferences = async () => {
      try {
        const response = await fetch("http://localhost:3001/conferences");
        if (!response.ok) throw new Error("Conference data fetch failed.");
        const data = await response.json();
        setConferences(data.conference || []);
      } catch (err) { console.error(err); }
    };
    getConferences();
  }, []);

  useEffect(() => {
    const getPapers = async () => {
      if (user && user.id) {
        try {
          const response = await fetch(`http://localhost:3001/papers?authorId=${user.id}`);
          if (response.status === 404) { setPapers([]); return; }
          if (!response.ok) throw new Error("Paper data fetch failed.");
          const data = await response.json();
          setPapers(data.papers || []);
        } catch (err) { console.error(err); }
      }
    };
    getPapers();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // IMPORTANT: this endpoint should return full user objects: id, email, firstname, lastname, expertise[], organisation
        const response = await fetch('http://localhost:3001/users/emails');
        const data = await response.json();
        setAllUsers(data.users || []);
      } catch (error) { console.error("Failed to fetch users:", error); }
    };
    fetchUsers();
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePortalClick("journal")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Journal Portal</button>
            <button onClick={() => handlePortalClick("dashboard")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Dashboard</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#1f2937]">Conference Portal</h2>

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

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">Available Conferences</h3>
            <div className="space-y-4">
              {conferences.map((conf) => (
                <div key={conf.id} className="block p-4 border border-[#e5e7eb] rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-[#1f2937]">{conf.name}</h4>
                      <p className="text-sm text-[#6b7280]">{conf.location}</p>
                    </div>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${conf.status === "Open" ? "bg-[#059669]/10 text-[#059669]" : "bg-red-100 text-red-700"}`}>
                      Status: {conf.status}
                    </span>
                  </div>
                  <div className="flex flex-row flex-wrap justify-around items-center text-sm border-t border-b border-[#e5e7eb] py-3 my-3">
                    <p className="text-[#6b7280] text-center mx-2 my-1">
                      <span className="font-medium text-[#1f2937]">Starts On:</span>{' '}
                      {new Date(conf.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-[#6b7280] text-center mx-2 my-1">
                      <span className="font-medium text-[#1f2937]">Ends On:</span>{' '}
                      {new Date(conf.endAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-[#6b7280] text-center mx-2 my-1">
                      <span className="font-medium text-[#1f2937]">Submission Deadline:</span>{' '}
                      {new Date(conf.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-[#6b7280] text-center mx-2 my-1">
                      <span className="font-medium text-[#1f2937]">Website:</span>{' '}
                      <a href={conf.link} target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">{conf.link}</a>
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => newSubmission(conf)} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap">New Submission</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Submitted Papers --- */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">My Submissions</h3>
            <PaperList papers={papers} />
          </div>

          {showSubmissionForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#1f2937]">New Paper Submission</h3>
                  <button onClick={() => setShowSubmissionForm(false)} className="text-[#6b7280] hover:text-[#1f2937]">✕</button>
                </div>
                <form className="space-y-4" onSubmit={handlePaperSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Paper Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Conference</label>
                    <select value={selectedConference} disabled className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f3f4f6]">
                      <option value={selectedConference}>{selectedConference}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Abstract</label>
                    <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={4} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Keywords (comma-separated)</label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                  </div>

                  {/* --- Authors: draggable compact cards + add-author select --- */}
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Authors (drag to reorder)</label>

                    <div className="space-y-2">
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="authors-droppable">
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                              {authors.map((author, index) => (
                                <Draggable key={author?.id ?? `author-${index}`} draggableId={String(author?.id ?? `author-${index}`)} index={index}>
                                  {(prov) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-3 p-3 border rounded bg-white">
                                      <div {...prov.dragHandleProps} className="cursor-grab select-none text-[#6b7280]">☰</div>
                                      <div className="flex-1">
                                        <CompactAuthorCard author={author} />
                                      </div>
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => handleRemoveAuthor(index)} className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>

                      <div className="flex gap-2 items-center mt-2">
                        <select defaultValue="" onChange={(e) => { addAuthorById(e.target.value); e.target.value = ""; }} className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                          <option value="" disabled>-- Add another author by email --</option>
                          {allUsers
                            .filter(u => !authors.some(a => a && a.id === u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.email} — {u.firstname} {u.lastname}</option>
                            ))}
                        </select>
                        <button type="button" onClick={() => { /* optional: open a modal to invite new user */ }} className="px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">Invite</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">Upload Paper (PDF)</label>
                    <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} accept=".pdf" required className="w-full text-sm text-[#6b7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20" />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                    <button type="submit" className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90">Submit Paper</button>
                    <button type="button" onClick={() => setShowSubmissionForm(false)} className="px-4 py-2 border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6]">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
