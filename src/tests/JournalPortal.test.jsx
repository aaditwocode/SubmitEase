import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import JournalPortal from '../components/JournalPortal';

// Mock the UserContext
vi.mock('../components/UserContext', () => ({
  useUserData: () => ({
    user: { id: 1, firstname: 'Test', role: ['Author'] }, 
    setUser: vi.fn(),
    setloginStatus: vi.fn(),
  }),
}));

// Mock useParams 
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ journalid: '123' }),
  };
});

describe('JournalPortal Component', () => {
  
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the main portal headers correctly', () => {
    render(
      <BrowserRouter>
        <JournalPortal />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Submission Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/All Manuscripts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ New Submission/i })).toBeInTheDocument();
  });

  it('displays all the dashboard statistic cards', () => {
    render(
      <BrowserRouter>
        <JournalPortal />
      </BrowserRouter>
    );

    expect(screen.getByText(/Total Submissions/i)).toBeInTheDocument();
    
    // Use getAllByText for terms that appear multiple times (tabs and cards)
    expect(screen.getAllByText(/Accepted/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rejected/i).length).toBeGreaterThan(0);
  });

  it('displays the document filtering tabs', () => {
    render(
      <BrowserRouter>
        <JournalPortal />
      </BrowserRouter>
    );

    expect(screen.getByText(/Pending Submission/i)).toBeInTheDocument();
    
    // Use getAllByText for terms that appear multiple times
    expect(screen.getAllByText(/Under Review/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sent Back To Author/i)).toBeInTheDocument();
  });
});