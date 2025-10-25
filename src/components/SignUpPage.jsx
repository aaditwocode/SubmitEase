"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useUserData } from "./UserContext"
export default function SignUpPage() {
  const navigate = useNavigate();
  const { setUser } = useUserData();
  setUser(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: [],
    expertise: "",
    organisation: "",
    country: "",
  });
  const countries = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Japan",
    "Australia", "Netherlands", "Sweden", "Switzerland", "Singapore", "South Korea",
    "China", "India", "Brazil", "Italy", "Spain", "Norway", "Denmark", "Finland",
  ];
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const newRoles = checked
        ? [...prev.role, value]
        : prev.role.filter((r) => r !== value);
      return { ...prev, role: newRoles };
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ message: "Passwords do not match.", type: 'error' });
      return;
    }

    const expertiseArray = formData.expertise.split(',').map(item => item.trim()).filter(item => item);
    const payload = {
      email: formData.email,
      password: formData.password,
      firstname: formData.firstName,
      lastname: formData.lastName,
      role: ["Author"],
      expertise: expertiseArray,
      organisation: formData.organisation,
      country: formData.country,
      sub: "Welcome to SubmitEase!",
      msg: `<h1>Hello ${formData.firstName},</h1><p>Thank you for signing up at SubmitEase. We're excited to have you on board!</p><p>Best regards,<br/>The SubmitEase Team</p>`,
    };

    try {
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newUser = await response.json();
      if (!response.ok) throw new Error(newUser.message || "Sign up failed.");

      console.log("User created:", newUser);
      setFeedback({ message: 'Account created successfully! Please sign in.', type: 'success' });
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      console.error("Sign up failed:", err);
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

        {/* Right Panel - Sign Up Form */}
        <div className="w-full lg:w-1/2 bg-[#f3f4f6]/30 p-8 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="bg-[#f9fafb] rounded-lg shadow-xl border border-[#e5e7eb] p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">Create Account</h3>
                <p className="text-[#6b7280]">Join the SubmitEase community</p>
              </div>

              {feedback.message && (
                <div className={`text-center p-2 mb-4 rounded-md text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[#1f2937] mb-2">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[#1f2937] mb-2">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1f2937] mb-2">Email</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                </div>
                <div>
                  <label htmlFor="organisation" className="block text-sm font-medium text-[#1f2937] mb-2">Organisation</label>
                  <input type="text" id="organisation" name="organisation" placeholder="e.g., Jaypee Institute Of Information Technology" value={formData.organisation} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-[#1f2d37] mb-2">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] appearance-none focus:outline-none focus:ring-2 focus:ring-[#059669] ${formData.country ? "text-[#1f2937]" : "text-gray-400"
                      }`}
                    required
                  >
                    <option value="" >Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expertise" className="block text-sm font-medium text-[#1f2937] mb-2">Areas of Expertise</label>
                  <input type="text" id="expertise" name="expertise" placeholder="AI, Machine Learning, Data Science" value={formData.expertise} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                  <p className="text-xs text-[#6b7280] mt-1">Please separate values with a comma.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#1f2937] mb-2">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1f2937] mb-2">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#059669]" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#059669] text-white py-2 px-4 rounded-md hover:bg-[#059669]/90 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2 transition duration-200">
                  Create Account
                </button>
                <div className="text-center">
                  <span className="text-[#6b7280]">Already have an account? </span>
                  <a href="/signin" className="text-[#059669] hover:text-[#059669]/80 font-medium">
                    Sign in
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
