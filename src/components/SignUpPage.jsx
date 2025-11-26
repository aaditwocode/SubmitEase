"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useUserData } from "./UserContext"

export default function SignUpPage() {
  const navigate = useNavigate();
  const { setUser } = useUserData();
  // setUser(null); // Suggest moving this to useEffect on mount to avoid render loops

  // UI State
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verification
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  
  // Verification State
  const [otp, setOtp] = useState("");
  const [serverHash, setServerHash] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: [], // Assuming default handles "Author" internally or set here
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

  // --- Step 1: Initiate Signup (Send Email) ---
  const handleInitiateSignUp = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      setFeedback({ message: "Passwords do not match.", type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // Call backend to send email and get hash
      const response = await fetch("http://localhost:3001/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email,
          firstname: formData.firstName 
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to send verification code.");

      // Success: Store hash and move to next step
      setServerHash(data.hash);
      setStep(2); // Show OTP Modal
      setFeedback({ message: `Verification code sent to ${formData.email}`, type: 'success' });

    } catch (err) {
      console.error("Initiation failed:", err);
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Finalize Signup (Verify & Create) ---
  const handleFinalizeSignUp = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });
    setIsLoading(true);

    const expertiseArray = formData.expertise.split(',').map(item => item.trim()).filter(item => item);
    
    // Construct final payload with OTP and Hash
    const payload = {
      otp: otp,
      hash: serverHash, // Backend will compare otp vs hash using bcrypt
      email: formData.email,
      password: formData.password,
      firstname: formData.firstName,
      lastname: formData.lastName,
      role: ["Author"],
      expertise: expertiseArray,
      organisation: formData.organisation,
      country: formData.country,
      sub: "Welcome to SubmitEase!",
      msg: "Your account has been created successfully!"
    };

    try {
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const newUser = await response.json();
      if (!response.ok) throw new Error(newUser.message || "Verification failed.");

      console.log("User created:", newUser);
      setFeedback({ message: 'Account verified & created! Redirecting...', type: 'success' });
      setTimeout(() => navigate('/signin'), 2000);

    } catch (err) {
      console.error("Sign up failed:", err);
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] relative">
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
          <div className="w-full max-w-md relative">
            
            {/* Feedback Message */}
            {feedback.message && (
              <div className={`text-center p-3 mb-4 rounded-md text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {feedback.message}
              </div>
            )}

            {/* --- STEP 1: Registration Form --- */}
            {step === 1 && (
              <div className="bg-[#f9fafb] rounded-lg shadow-xl border border-[#e5e7eb] p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#1f2937] mb-2">Create Account</h3>
                  <p className="text-[#6b7280]">Join the SubmitEase community</p>
                </div>

                <form onSubmit={handleInitiateSignUp} className="space-y-4">
                  {/* ... Existing Inputs ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Organisation</label>
                    <input type="text" name="organisation" value={formData.organisation} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2d37] mb-2">Country *</label>
                    <select name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required>
                      <option value="">Select a country</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1f2937] mb-2">Areas of Expertise</label>
                    <input type="text" name="expertise" placeholder="AI, Machine Learning" value={formData.expertise} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1f2937] mb-2">Confirm Password</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md bg-[#f9fafb] focus:ring-[#059669]" required />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#059669] text-white py-2 px-4 rounded-md hover:bg-[#059669]/90 disabled:opacity-70 transition duration-200"
                  >
                    {isLoading ? "Sending Code..." : "Next: Verify Email"}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-[#6b7280]">Already have an account? </span>
                    <a href="/signin" className="text-[#059669] hover:text-[#059669]/80 font-medium">Sign in</a>
                  </div>
                </form>
              </div>
            )}

            {/* --- STEP 2: OTP Verification Modal/Card --- */}
            {step === 2 && (
              <div className="bg-[#f9fafb] rounded-lg shadow-xl border border-[#e5e7eb] p-8 text-center animate-fade-in-up">
                 <div className="mb-6">
                    <div className="w-16 h-16 bg-[#059669]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-[#1f2937]">Verify your Email</h3>
                    <p className="text-[#6b7280] mt-2">
                      We've sent a 6-digit code to <span className="font-semibold">{formData.email}</span>
                    </p>
                 </div>

                 <form onSubmit={handleFinalizeSignUp} className="space-y-6">
                    <div>
                      <input 
                        type="text" 
                        maxLength="6"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center text-3xl tracking-widest px-4 py-4 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#059669] focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        type="submit" 
                        disabled={isLoading || otp.length !== 6}
                        className="w-full bg-[#059669] text-white py-3 px-4 rounded-md hover:bg-[#059669]/90 disabled:opacity-50 transition duration-200 font-medium"
                      >
                        {isLoading ? "Verifying..." : "Verify & Create Account"}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-[#6b7280] hover:text-[#1f2937]"
                      >
                        Back to details
                      </button>
                    </div>
                 </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}