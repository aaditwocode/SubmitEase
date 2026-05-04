import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom'; // 1. Added Router for useNavigate()
import { vi } from 'vitest'; // 2. Added Vitest utilities
import SignInPage from '../components/SignInPage';

// 3. Fake the UserContext so destructuring { setUser } doesn't crash
vi.mock('../components/UserContext', () => ({
  useUserData: () => ({
    setUser: vi.fn(), // Provides a dummy function that does nothing
  }),
}));

describe('SignInPage Component', () => {
  it('renders sign-in form elements correctly', () => {
    // 4. Wrap the component in the Router
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );
    
    // Note: Make sure "Email address" matches the exact casing on your screen!
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('requires email and password fields to be filled before submission', () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );
    
    // Grab the inputs
    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    // Assert that they have the HTML5 'required' attribute
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});