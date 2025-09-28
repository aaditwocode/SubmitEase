"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "./UserContext"; // Assuming you have a UserContext

export default function ConferencePage() {
  // --- State Declarations ---
  const { user, setUser, loginStatus, setloginStatus } = useUserData();
  const navigate = useNavigate();

  // Data state
  const [conferences, setConferences] = useState([]);
  const [papers, setPapers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // UI State
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Form State
  const [selectedConference, setSelectedConference] = useState('');
  const [confId, setConfId] = useState(null);
  const [conf, setConf] = useState(null);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
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
    setTitle('');
    setAbstract('');
    setKeywords('');
    setPdfFile(null);
    if (user && user.id) {
      setAuthors([user.id]);
    } else {
      setAuthors([]);
    }
    setShowSubmissionForm(true);
  };

  const handleAddAuthor = () => setAuthors([...authors, '']);

  const handleRemoveAuthor = (indexToRemove) => {
    if (indexToRemove > 0) {
      setAuthors(authors.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleAuthorChange = (indexToUpdate, newUserId) => {
    const updatedAuthors = authors.map((id, index) =>
      index === indexToUpdate ? parseInt(newUserId, 10) : id
    );
    setAuthors(updatedAuthors);
  };

  const handlePaperSubmit = async (event) => {
    event.preventDefault();
    // This is a placeholder for your file upload logic.
    // In a real app, you'd upload `pdfFile` to a service like S3 and get a URL back.
    const paperUrl = "http://example.com/path/to/placeholder.pdf";

    const authorIds = [...new Set(authors.filter(id => id))];

    const payload = {
      title,
      confId,
      conf,
      abstract,
      keywords: keywords.split(',').map(k => k.trim()),
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
      // Refresh the papers list after submission
      // getPapers(); // You would call the function that fetches papers here
    } catch (error) {
      console.error("Submission failed:", error);
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
                    <button onClick={() => newSubmission(conf)} className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors whitespace-nowrap">
                      New Submission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Submitted Papers --- */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">
              My Submissions
            </h3>
            <div className="space-y-4">
              {papers.map((paper) => (
                <div key={paper.id} className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-[#1f2937] mb-1">
                        {paper.Title}
                      </h4>
                      <p className="text-sm text-[#6b7280]">
                        Paper ID: {paper.id}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        Conference: {paper.Conference?.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${paper.Status === "Accepted" ? "bg-[#059669]/10 text-[#059669]" : paper.Status === "Under Review" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-red-100 text-red-700"}`}>
                        {paper.Status}
                      </span>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Submitted: {new Date(paper.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#1f2937] leading-relaxed">
                      <strong>Abstract:</strong> {paper.Abstract}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-[#1f2937] mb-2">
                      <strong>Keywords:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {paper.Keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-[#e5e7eb] pt-3 mt-3">
                    <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">View Details</button>
                    <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">Download PDF</button>
                    {paper.status === "Under Review" && (
                      <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">Withdraw</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Other Authors</label>
                    <div className="space-y-2">
                      {authors.slice(1).map((authorId, index) => {
                        const authorIndex = index + 1;
                        return (
                          <div key={authorIndex} className="flex items-center gap-2">
                            <select value={authorId} onChange={(e) => handleAuthorChange(authorIndex, e.target.value)} required className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#059669]">
                              <option value="" disabled>-- Select another author --</option>
                              {allUsers
                                .filter(u => u.id !== user.id) 
                                .map(u => (
                                  <option key={u.id} value={u.id}>{u.email}</option>
                                ))
                              }
                            </select>
                            <button type="button" onClick={() => handleRemoveAuthor(authorIndex)} className="px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50">Remove</button>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={handleAddAuthor} className="mt-2 px-4 py-2 text-sm font-medium bg-[#059669]/10 text-[#059669] rounded-lg hover:bg-[#059669]/20">
                      + Add Another Author
                    </button>
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