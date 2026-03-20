import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

const mockUser: User = {
  uid: 'user1',
  displayName: 'John Doe',
  email: 'john@example.com',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({})
} as any;

const mockProfile: UserProfile = {
  uid: 'user1',
  email: 'john@example.com',
  displayName: 'John Doe',
  role: 'responder'
};

describe('Header', () => {
  it('renders correctly when user is not signed in', () => {
    render(
      <Header 
        user={null} 
        profile={null} 
        onSignIn={() => {}} 
        onSignOut={() => {}} 
      />
    );

    expect(screen.getByText('Guardian Bridge')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders correctly when user is signed in', () => {
    render(
      <Header 
        user={mockUser} 
        profile={mockProfile} 
        onSignIn={() => {}} 
        onSignOut={() => {}} 
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('responder')).toBeInTheDocument();
  });

  it('calls onSignIn when sign in button is clicked', () => {
    const handleSignIn = vi.fn();
    render(
      <Header 
        user={null} 
        profile={null} 
        onSignIn={handleSignIn} 
        onSignOut={() => {}} 
      />
    );

    fireEvent.click(screen.getByText('Sign In'));
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it('calls onSignOut when sign out button is clicked', () => {
    const handleSignOut = vi.fn();
    render(
      <Header 
        user={mockUser} 
        profile={mockProfile} 
        onSignIn={() => {}} 
        onSignOut={handleSignOut} 
      />
    );

    fireEvent.click(screen.getByLabelText('Sign Out'));
    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });
});
