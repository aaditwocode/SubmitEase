"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ConferencePage() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const navigate = useNavigate();
  const handlePortalClick = (portal) => {
    navigate(`/${portal}`);
  };

  const handleLogout = () => {
    console.log("[v0] Logging out user");
    navigate("/home");
  };
  const conferences = [
    {
      id: 1,
      name: "International Conference on AI & ML 2024",
      deadline: "2024-10-15",
      status: "Open",
      location: "San Francisco, CA",
    },
    {
      id: 2,
      name: "IEEE Computer Vision Conference",
      deadline: "2024-11-20",
      status: "Open",
      location: "Boston, MA",
    },
  ];

  const submittedPapers = [
    {
      id: "P001",
      title: "Deep Learning Approaches for Medical Image Analysis",
      conference: "International Conference on AI & ML 2024",
      status: "Under Review",
      submissionDate: "2024-08-10",
      abstract:
        "This paper presents novel deep learning methodologies for analyzing medical images, focusing on improving diagnostic accuracy for various conditions through convolutional neural networks.",
      keywords: [
        "Deep Learning",
        "Medical Imaging",
        "Computer Vision",
        "Healthcare",
      ],
    },
    {
      id: "P002",
      title: "Federated Learning in Edge Computing",
      conference: "IEEE Computer Vision Conference",
      status: "Accepted",
      submissionDate: "2024-07-15",
      abstract:
        "We propose a federated learning framework optimized for edge computing environments, addressing challenges of data privacy and latency in distributed systems.",
      keywords: ["Federated Learning", "Edge Computing", "Distributed Systems"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
       <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handlePortalClick("journal")}
                className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 transition-colors"
              >
                Journal Portal
              </button>
              <button
                onClick={() => handlePortalClick("dashboard")}
                className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-[#059669]/90 transition-colors"
              >
                Return To Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] transition-colors"
              >
                Logout
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-[#1f2937]">
              Conference Portal
            </h2>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
            >
              New Submission
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">
                Total Submissions
              </h3>
              <p className="text-3xl font-bold text-[#059669]">
                {submittedPapers.length}
              </p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">
                Accepted Papers
              </h3>
              <p className="text-3xl font-bold text-[#059669]">
                {submittedPapers.filter((p) => p.status === "Accepted").length}
              </p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-sm font-medium text-[#6b7280]">
                Under Review
              </h3>
              <p className="text-3xl font-bold text-[#f59e0b]">
                {submittedPapers.filter((p) => p.status === "Under Review").length}
              </p>
            </div>
          </div>

          {/* Available Conferences */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">
              Available Conferences
            </h3>
            <div className="space-y-4">
              {conferences.map((conf) => (
                <div
                  key={conf.id}
                  className="flex justify-between items-center p-4 border border-[#e5e7eb] rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-[#1f2937]">
                      {conf.name}
                    </h4>
                    <p className="text-sm text-[#6b7280]">{conf.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1f2937]">
                      Deadline: {conf.deadline}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-full">
                      {conf.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submitted Papers */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#1f2937] mb-4">
              My Submissions
            </h3>
            <div className="space-y-4">
              {submittedPapers.map((paper) => (
                <div key={paper.id} className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-[#1f2937] mb-1">
                        {paper.title}
                      </h4>
                      <p className="text-sm text-[#6b7280]">
                        Paper ID: {paper.id}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        {paper.conference}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          paper.status === "Accepted"
                            ? "bg-[#059669]/10 text-[#059669]"
                            : "bg-[#f59e0b]/10 text-[#f59e0b]"
                        }`}
                      >
                        {paper.status}
                      </span>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Submitted: {paper.submissionDate}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-[#1f2937] leading-relaxed">
                      <strong>Abstract:</strong> {paper.abstract}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-[#1f2937] mb-2">
                      <strong>Keywords:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-[#059669]/10 text-[#059669] rounded-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-[#e5e7eb] pt-3 mt-3">
                    <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">
                      View Details
                    </button>
                    <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">
                      Download PDF
                    </button>
                    {paper.status === "Under Review" && (
                      <button className="px-3 py-1 text-sm border border-[#e5e7eb] rounded-md hover:bg-[#f3f4f6] transition-colors">
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Form Modal */}
          {showSubmissionForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#1f2937]">
                    New Paper Submission
                  </h3>
                  <button
                    onClick={() => setShowSubmissionForm(false)}
                    className="text-[#6b7280] hover:text-[#1f2937]"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      placeholder="Enter paper title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                      Conference
                    </label>
                    <select className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]">
                      <option value="">Select Conference</option>
                      {conferences.map((conf) => (
                        <option key={conf.id} value={conf.id}>
                          {conf.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                      Abstract
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      placeholder="Enter paper abstract"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                      Upload Paper (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="w-full text-sm text-[#1f2937] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#059669]/10 file:text-[#059669] hover:file:bg-[#059669]/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] mt-6">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#059669]/90 transition-colors"
                    >
                      Submit Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubmissionForm(false)}
                      className="px-4 py-2 border border-[#e5e7eb] rounded-md bg-[#ffffff] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors"
                    >
                      Cancel
                    </button>
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
