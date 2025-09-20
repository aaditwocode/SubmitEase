"use client";

import { useState } from "react";

export default function ConferencePortal() {

  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Sample conference data
  const conferences = [
    {
      id: 1,
      name: "International Conference on AI & ML 2024",
      deadline: "2024-03-15",
      status: "Open",
      location: "San Francisco, CA",
    },
    {
      id: 2,
      name: "IEEE Computer Vision Conference",
      deadline: "2024-04-20",
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
      submissionDate: "2024-02-10",
      abstract:
        "This paper presents novel deep learning methodologies for analyzing medical images...",
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
      submissionDate: "2024-01-15",
      abstract:
        "We propose a federated learning framework optimized for edge computing environments...",
      keywords: ["Federated Learning", "Edge Computing", "Distributed Systems"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-card-foreground">
          Conference Portal
        </h2>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          New Submission
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Submissions
          </h3>
          <p className="text-2xl font-bold text-primary">
            {submittedPapers.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Accepted Papers
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {submittedPapers.filter((p) => p.status === "Accepted").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Under Review
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {submittedPapers.filter((p) => p.status === "Under Review").length}
          </p>
        </div>
      </div>

      {/* Available Conferences */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Available Conferences
        </h3>
        <div className="space-y-3">
          {conferences.map((conf) => (
            <div
              key={conf.id}
              className="flex justify-between items-center p-3 border border-border rounded-md"
            >
              <div>
                <h4 className="font-medium text-card-foreground">
                  {conf.name}
                </h4>
                <p className="text-sm text-muted-foreground">{conf.location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">
                  Deadline: {conf.deadline}
                </p>
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {conf.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submitted Papers */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          My Submissions
        </h3>
        <div className="space-y-4">
          {submittedPapers.map((paper) => (
            <div key={paper.id} className="border border-border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground mb-1">
                    {paper.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Paper ID: {paper.id}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {paper.conference}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      paper.status === "Accepted"
                        ? "bg-green-100 text-green-800"
                        : paper.status === "Under Review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {paper.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {paper.submissionDate}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-card-foreground">
                  <strong>Abstract:</strong> {paper.abstract}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-card-foreground mb-1">
                  <strong>Keywords:</strong>
                </p>
                <div className="flex flex-wrap gap-1">
                  {paper.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors">
                  View Details
                </button>
                <button className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors">
                  Download PDF
                </button>
                {paper.status === "Under Review" && (
                  <button className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                New Paper Submission
              </h3>
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="text-muted-foreground hover:text-card-foreground"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Paper Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Enter paper title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Conference
                </label>
                <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                  <option value="">Select Conference</option>
                  {conferences.map((conf) => (
                    <option key={conf.id} value={conf.id}>
                      {conf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Abstract
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Enter paper abstract"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Upload Paper (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Submit Paper
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmissionForm(false)}
                  className="px-4 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
