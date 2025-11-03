"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useUserData } from "./UserContext";
export default function SignInPage() {
  const { setUser} = useUserData();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });

    try {
      setFeedback({ message: 'Signing In! Please Wait...', type: 'Signing In' });
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sign in failed.");
      setUser(data.user);
      setFeedback({ message: 'Sign In Successful! Redirecting...', type: 'Success' });
      setTimeout(() => navigate('/dashboard'), 200);
    } catch (err) {
      console.error(err);
      setFeedback({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#059669] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-[#1f2937]">SubmitEase</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/home" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f3f4f6] hover:text-[#1f2937]">
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white p-12 flex-col justify-center">
          <div className="max-w-md">
            <div className="flex items-center mb-6">
              <div className="w-25 h-15 bg-[#059669] rounded-lg flex items-center justify-center mr-5">
                <span className="text-white font-bold text-3xl">S</span>
              </div>
              <span className="text-3xl font-bold leading-tight">An Integrated Platform for Scholarly Publishing.</span>
            </div>
            <p className="text-white/80 text-lg leading-relaxed">
              Manage journal submissions, conference papers, and peer reviews in one seamless, intelligent environment.
            </p>
          </div>
        </div>

        {/* Right Panel - Sign In Form */}
        <div className="w-full lg:w-1/2 bg-[#f3f4f6]/30 p-8 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="bg-[#f9fafb] rounded-lg shadow-xl border border-[#e5e7eb] p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">Welcome Back</h3>
                <p className="text-[#6b7280]">Sign in to your account</p>
              </div>

              {feedback.message && (
                <div className={`text-center p-2 mb-4 rounded-md text-sm ${
                    feedback.type === 'error' ? 'bg-red-100 text-red-700' : feedback.type === 'Success' ?'bg-green-100 text-green-700': 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1f2937] mb-2">Email address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent" required />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#1f2937] mb-2">Password</label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent" required />
                </div>
                <div className="flex items-center justify-between">
                  <a href="#" className="text-sm text-[#059669] hover:text-[#059669]/80">Forgot your password?</a>
                </div>
                <button type="submit" className="w-full bg-[#059669] text-white py-2 px-4 rounded-md hover:bg-[#059669]/90 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2 transition duration-200">
                  Sign In
                </button>
                <div className="text-center">
                  <span className="text-[#6b7280]">Don't have an account? </span>
                  <a href="/signup" className="text-[#059669] hover:text-[#059669]/80 font-medium">
                    Sign up
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
