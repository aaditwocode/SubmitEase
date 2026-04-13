"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JournalEditorRevisionDetails() {
    const { paperId } = useParams();
    const navigate = useNavigate();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevision = async () => {
            try {
                const res = await fetch(`http://localhost:3001/journal/getpaperbyid/${paperId}`);
                const data = await res.json();
                setPaper(data.paper);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchRevision();
    }, [paperId]);

    if (loading) return <div className="p-8 text-center">Loading Revision...</div>;
    if (!paper) return <div className="p-8 text-center">Revision not found.</div>;

    const files = paper.additionalFilesUrls || [];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="text-[#059669] font-medium">← Back to Paper Management</button>
                
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    {/* Formatting from ViewRevisionPaper.jsx */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                            <h3 className="text-lg font-bold">Revision Documents</h3>
                            <div className="space-y-4">
                                <div className="p-3 border rounded bg-green-50">
                                    <p className="text-xs font-bold text-green-700 uppercase">1. Clean Manuscript</p>
                                    <a href={paper.URL} target="_blank" className="text-sm text-blue-600 underline truncate block">{paper.Title}.pdf</a>
                                </div>
                                {files[0] && (
                                    <div className="p-3 border rounded bg-amber-50">
                                        <p className="text-xs font-bold text-amber-700 uppercase">2. Response to Reviewers</p>
                                        <a href={files[0]} target="_blank" className="text-sm text-blue-600 underline truncate block">Response_Sheet.pdf</a>
                                    </div>
                                )}
                                {files[1] && (
                                    <div className="p-3 border rounded bg-purple-50">
                                        <p className="text-xs font-bold text-purple-700 uppercase">3. Marked-up Manuscript</p>
                                        <a href={files[1]} target="_blank" className="text-sm text-blue-600 underline truncate block">Tracked_Changes.pdf</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-white border rounded-lg shadow-sm h-[80vh] p-4">
                        <iframe src={paper.URL} className="w-full h-full border rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}