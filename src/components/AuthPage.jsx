"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();
  const goToProfile = () => {
    navigate('/dashboard');
};
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Author",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

 const handleSignIn = async (e) => {
  e.preventDefault();

  try {
    // Replace this with your actual auth check later
    const response = await fetch("http://localhost:3001/users");
    const users = await response.json();

    const user = users.find(
      (u) => u.email === formData.email && u.password === formData.password
    );

    if (!user) {
      alert("Invalid credentials");
      return;
    }

    console.log("Signed in:", user);
    alert(`Welcome back, ${user.name}!`);
  } catch (err) {
    console.error(err);
    alert("Sign in failed. See console for details.");
  }
};


  const handleSignUp = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const err = await response.json();
      alert(`Error: ${err.error}`);
      return;
    }

    const user = await response.json();
    console.log("User created:", user);
    alert(`Welcome ${user.name}! Account created successfully.`);
    setIsSignUp(false); 
  } catch (err) {
    console.error("Sign up failed:", err);
    alert("Sign up failed. See console for details.");
  }
};


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">SubmitEase</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            
            <a
              href="/home"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
        <div className="flex-grow flex">
          {/* Left Panel - Branding & Information */}
          <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white p-12 flex-col justify-center">
            <div className="max-w-md">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-3xl font-bold leading-tight">An Integrated Platform for Scholarly Publishing.</span>
          </div>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Manage journal submissions, conference papers, and peer reviews in one seamless, intelligent environment.
          </p>
            </div>
          </div>

          {/* Right Panel - Authentication Form */}
        <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-background rounded-lg shadow-xl border border-border p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h3>
                <p className="text-muted-foreground">{isSignUp ? "Join the SubmitEase community" : "Sign in to your account"}</p>
              </div>

              {/* Sign In Form */}
              {!isSignUp && (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">
                      Forgot your password?
                    </a>
                  </div>

                  <button
                    type="submit" onClick={goToProfile}
                    className="w-full bg-emerald-500 text-primary-foreground py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200"
                  >
                    Sign In
                  </button>

                  <div className="text-center">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-emerald-600 hover:text-emerald-500 font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              )}

              {/* Sign Up Form */}
              {isSignUp && (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                      I am a...
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Author">Author</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Editor">Editor</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 text-primary-foreground py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200"
                  >
                    Create Account
                  </button>

                  <div className="text-center">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-emerald-600 hover:text-emerald-500 font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

