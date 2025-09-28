"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function ManageConferences({ onBack }) {
    const navigate = useNavigate();
  const [selectedConference, setSelectedConference] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [sortBy, setSortBy] = useState("submittedOn");
  const [sortOrder, setSortOrder] = useState("desc");

  // Sample conferences data
  const conferences = [
    {
      id: 1,
      title: "International Conference on Machine Learning (ICML) 2025",
      city: "Vienna",
      country: "Austria",
      startDate: "2025-07-21",
      endDate: "2025-07-27",
      submissionDueDate: "2025-02-15",
      startTime: "09:00",
      webLink: "https://icml.cc/Conferences/2025",
      partners: ["Google Research", "Microsoft Research", "OpenAI"],
      status: "Active",
    },
    {
      id: 2,
      title: "Neural Information Processing Systems (NeurIPS) 2025",
      city: "New Orleans",
      country: "United States",
      startDate: "2025-12-08",
      endDate: "2025-12-14",
      submissionDueDate: "2025-05-22",
      startTime: "08:30",
      webLink: "https://neurips.cc/Conferences/2025",
      partners: ["DeepMind", "Facebook AI", "NVIDIA"],
      status: "Active",
    },
    {
      id: 3,
      title: "IEEE Computer Vision Conference (CVPR) 2025",
      city: "Seattle",
      country: "United States",
      startDate: "2025-06-16",
      endDate: "2025-06-20",
      submissionDueDate: "2025-11-15",
      startTime: "09:30",
      webLink: "https://cvpr2025.thecvf.com",
      partners: ["IEEE", "Amazon Research", "Apple"],
      status: "Planning",
    },
  ];

  // Sample submitted papers data
  const submittedPapers = {
    1: [
      {
        id: "P001",
        name: "Deep Learning Approaches for Medical Image Analysis",
        submittedOn: "2024-12-15",
        keywords: ["Deep Learning", "Medical Imaging", "Computer Vision"],
        status: "Accepted",
        author: "Dr. Sarah Johnson",
        email: "sarah.johnson@university.edu",
      },
      {
        id: "P002",
        name: "Federated Learning in Edge Computing Environments",
        submittedOn: "2024-12-10",
        keywords: ["Federated Learning", "Edge Computing", "Distributed Systems"],
        status: "Under Review",
        author: "Prof. Michael Chen",
        email: "m.chen@tech.edu",
      },
      {
        id: "P003",
        name: "Quantum Machine Learning Algorithms",
        submittedOn: "2024-12-08",
        keywords: ["Quantum Computing", "Machine Learning", "Algorithms"],
        status: "Rejected",
        author: "Dr. Emily Rodriguez",
        email: "e.rodriguez@research.org",
      },
      {
        id: "P004",
        name: "Transformer Architectures for Natural Language Processing",
        submittedOn: "2024-12-05",
        keywords: ["Transformers", "NLP", "Language Models"],
        status: "Under Review",
        author: "Dr. James Wilson",
        email: "j.wilson@ai.institute",
      },
    ],
    2: [
      {
        id: "P005",
        name: "Reinforcement Learning for Autonomous Systems",
        submittedOn: "2024-12-12",
        keywords: ["Reinforcement Learning", "Autonomous Systems", "Robotics"],
        status: "Accepted",
        author: "Dr. Lisa Zhang",
        email: "l.zhang@robotics.edu",
      },
    ],
    3: [],
  };

  const [editFormData, setEditFormData] = useState({});

  const handleConferenceSelect = (conference) => {
    setSelectedConference(conference);
    setEditFormData(conference);
    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditFormData(selectedConference);
    }
  };

  const handleSaveEdit = () => {
    // Here you would typically save to backend
    console.log("[v0] Saving conference edits:", editFormData);
    setSelectedConference(editFormData);
    setEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortedPapers = selectedConference
    ? [...(submittedPapers[selectedConference.id] || [])].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === "submittedOn") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      })
    : [];

  const getStatusBadge = (status) => {
    const statusStyles = {
      Accepted: "bg-[#059669]/10 text-[#059669] border-[#059669]/20",
      "Under Review": "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          statusStyles[status] || "bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const handlePortalClick = (portal) => navigate(`/${portal}`);

  const handleLogout = () => {
    setUser(null);
    setloginStatus(false);
    navigate("/home");
  };
  // Conference List View
  if (!selectedConference) {
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Conference Portal</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1f2937] mb-2">Conference Management</h1>
            <p className="text-[#6b7280]">
              Manage your hosted conferences, review submissions, and track conference progress.
            </p>
          </div>

          {/* Conference Cards */}
          <div className="grid gap-6">
            {conferences.map((conference) => (
              <div
                key={conference.id}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => handleConferenceSelect(conference)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#1f2937] mb-2">{conference.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7280]">
                      <span>
                        📍 {conference.city}, {conference.country}
                      </span>
                      <span>
                        📅 {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          conference.status === "Active"
                            ? "bg-[#059669]/10 text-[#059669]"
                            : "bg-[#f59e0b]/10 text-[#f59e0b]"
                        }`}
                      >
                        {conference.status}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors">
                    View
                  </button>
                </div>

                <div className="border-t border-[#e5e7eb] pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6b7280] mb-1">Partners</p>
                      <div className="flex flex-wrap gap-1">
                        {conference.partners.slice(0, 3).map((partner, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded">
                            {partner}
                          </span>
                        ))}
                        {conference.partners.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-[#f3f4f6] text-[#6b7280] rounded">
                            +{conference.partners.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#6b7280]">Submission Deadline</p>
                      <p className="text-sm font-medium text-[#1f2937]">
                        {formatDate(conference.submissionDueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {conferences.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#1f2937] mb-2">No Conferences Found</h3>
              <p className="text-[#6b7280]">
                You haven't created any conferences yet. Start by registering a new conference.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Conference Detail View
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handlePortalClick("conference")} className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#059669]/90">Return To Conference Portal</button>
            <button onClick={handleLogout} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f3f4f6]">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Conference Details */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1f2937]">Conference Details</h2>
              <button
                onClick={editMode ? handleSaveEdit : handleEditToggle}
                className={`px-4 py-2 rounded-md transition-colors ${
                  editMode
                    ? "bg-[#059669] text-white hover:bg-[#059669]/90"
                    : "border border-[#e5e7eb] bg-[#ffffff] text-[#1f2937] hover:bg-[#f3f4f6]"
                }`}
              >
                {editMode ? "Save" : "Edit"}
              </button>
            </div>

            <div className="space-y-6">
              {/* Conference Title */}
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-2">Conference Title</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editFormData.title || ""}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                  />
                ) : (
                  <p className="text-[#1f2937] font-medium">{selectedConference.title}</p>
                )}
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">City</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editFormData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{selectedConference.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">Country</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editFormData.country || ""}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{selectedConference.country}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">Start Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editFormData.startDate || ""}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{formatDate(selectedConference.startDate)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">End Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editFormData.endDate || ""}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{formatDate(selectedConference.endDate)}</p>
                  )}
                </div>
              </div>

              {/* Submission Due Date & Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">Submission Due Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editFormData.submissionDueDate || ""}
                      onChange={(e) => handleInputChange("submissionDueDate", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{formatDate(selectedConference.submissionDueDate)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-2">Starting Time</label>
                  {editMode ? (
                    <input
                      type="time"
                      value={editFormData.startTime || ""}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                    />
                  ) : (
                    <p className="text-[#1f2937]">{selectedConference.startTime}</p>
                  )}
                </div>
              </div>

              {/* Web Link */}
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-2">Web Link</label>
                {editMode ? (
                  <input
                    type="url"
                    value={editFormData.webLink || ""}
                    onChange={(e) => handleInputChange("webLink", e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937]"
                  />
                ) : (
                  <a
                    href={selectedConference.webLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#059669] hover:underline"
                  >
                    {selectedConference.webLink}
                  </a>
                )}
              </div>

              {/* Partners */}
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-2">Partners</label>
                <div className="flex flex-wrap gap-2">
                  {selectedConference.partners.map((partner, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-[#059669]/10 text-[#059669] rounded-full border border-[#059669]/20"
                    >
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Submitted Research Papers */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1f2937]">Submitted Research Papers</h2>
              <div className="text-sm text-[#6b7280]">
                {sortedPapers.length} submission{sortedPapers.length !== 1 ? "s" : ""}
              </div>
            </div>

            {sortedPapers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      <th
                        className="text-left py-3 px-2 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                        onClick={() => handleSort("id")}
                      >
                        Paper ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-left py-3 px-2 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                        onClick={() => handleSort("name")}
                      >
                        Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-left py-3 px-2 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                        onClick={() => handleSort("submittedOn")}
                      >
                        Submitted On {sortBy === "submittedOn" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-[#6b7280]">Keywords</th>
                      <th
                        className="text-left py-3 px-2 text-sm font-medium text-[#6b7280] cursor-pointer hover:text-[#1f2937]"
                        onClick={() => handleSort("status")}
                      >
                        Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-[#6b7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPapers.map((paper) => (
                      <tr key={paper.id} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]/50">
                        <td className="py-3 px-2 text-sm font-medium text-[#1f2937]">{paper.id}</td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-medium text-[#1f2937]">{paper.name}</p>
                            <p className="text-xs text-[#6b7280]">{paper.author}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-[#1f2937]">{formatDate(paper.submittedOn)}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {paper.keywords.slice(0, 2).map((keyword, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-[#f3f4f6] text-[#6b7280] rounded">
                                {keyword}
                              </span>
                            ))}
                            {paper.keywords.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-[#f3f4f6] text-[#6b7280] rounded">
                                +{paper.keywords.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(paper.status)}</td>
                        <td className="py-3 px-2">
                          <button className="px-3 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-[#f3f4f6] transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[#1f2937] mb-2">No Submissions Yet</h3>
                <p className="text-[#6b7280]">No papers have been submitted to this conference yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}