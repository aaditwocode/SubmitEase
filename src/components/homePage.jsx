"use client"

import { useState } from "react"
import { Zap, Shield, Users, ArrowRight, Star } from "lucide-react"
export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Author",
  })

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Web Developer",
      company: "TechStart Inc.",
      content: "SubmitEase transformed how we handle form submissions. Setup took minutes, not hours!",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Product Manager",
      company: "Digital Solutions",
      content: "The reliability and ease of use is outstanding. Our conversion rates improved by 30%.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Freelance Designer",
      company: "Creative Studio",
      content: "Finally, a form service that just works. My clients love the seamless experience.",
      rating: 5,
    },
  ]

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-emerald-500" />,
      title: "Lightning Fast Processing",
      description: "Process form submissions in milliseconds with our optimized infrastructure.",
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-500" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and GDPR compliance to keep your data safe.",
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-500" />,
      title: "24/7 Reliable Support",
      description: "Get help when you need it with our dedicated support team.",
    },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    console.log("Sign in attempt:", { email: formData.email, password: formData.password })
    // Add your sign in logic here
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }
    console.log("Sign up attempt:", formData)
    // Add your sign up logic here
  }

  return (
    <div className="min-h-screen bg-background">
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
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </a>
            <button
              onClick={() => {
                setIsSignUp(true)
                setShowAuthModal(true)
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-emerald-500 text-primary-foreground hover:bg-emerald-600"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Streamline Your Form Submissions with <span className="text-emerald-500">SubmitEase</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Effortless form handling for your website. No backend required, no complex setup. Just simple, reliable form
            processing that works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setIsSignUp(true)
                setShowAuthModal(true)
              }}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-500 text-primary-foreground hover:bg-emerald-600 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose SubmitEase?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for developers and businesses who need reliable form processing without the hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get Started in Minutes</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to transform your form handling</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Your Form</h3>
              <p className="text-muted-foreground">Design your form with any HTML or framework you prefer.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect to SubmitEase</h3>
              <p className="text-muted-foreground">Point your form to our secure endpoint with one line of code.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Collecting</h3>
              <p className="text-muted-foreground">Receive submissions instantly via email, webhook, or dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by Developers Worldwide</h2>
            <p className="text-xl text-muted-foreground">See what our customers have to say about SubmitEase</p>
          </div>

          <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm max-w-2xl mx-auto">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-emerald-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-card-foreground mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div>
                <div className="font-semibold text-card-foreground">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? "bg-emerald-500" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Simplify Your Forms?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who trust SubmitEase for their form processing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setIsSignUp(true)
                setShowAuthModal(true)
              }}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-500 text-primary-foreground hover:bg-emerald-600 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-emerald-500 rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-foreground">SubmitEase</span>
              </div>
              <p className="text-sm text-muted-foreground">Effortless form handling for modern websites.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SubmitEase. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-foreground">{isSignUp ? "Create Account" : "Welcome Back"}</h3>
                <button onClick={() => setShowAuthModal(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              {/* Sign In Form */}
              {!isSignUp && (
                <form onSubmit={handleSignIn} className="space-y-4">
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
                    <a href="#" className="text-sm text-emerald-500 hover:text-emerald-600">
                      Forgot your password?
                    </a>
                  </div>

                  <button type="submit" className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-emerald-500 text-primary-foreground hover:bg-emerald-600">
                    Sign In
                  </button>

                  <div className="text-center">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-emerald-500 hover:text-emerald-600 font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              )}

              {/* Sign Up Form */}
              {isSignUp && (
                <form onSubmit={handleSignUp} className="space-y-4">
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

                  <button type="submit" className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-emerald-500 text-primary-foreground hover:bg-emerald-600">
                    Create Account
                  </button>

                  <div className="text-center">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-emerald-500 hover:text-emerald-600 font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


