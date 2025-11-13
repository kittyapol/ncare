import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { mockUser } from '@/tests/mocks/mockData';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // Clear localStorage
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user and tokens on login', () => {
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';

      useAuthStore.getState().login(accessToken, refreshToken, mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist auth data to localStorage', () => {
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      useAuthStore.getState().login(accessToken, refreshToken, mockUser);

      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear user and tokens on logout', () => {
      // First login
      useAuthStore.getState().login('token', 'refresh', mockUser);

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user', () => {
      const newUser = { ...mockUser, full_name: 'Updated User' };

      useAuthStore.getState().setUser(newUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(newUser);
    });
  });

  describe('persistence', () => {
    it('should persist state across store instances', () => {
      const accessToken = 'persisted-token';
      const refreshToken = 'persisted-refresh';

      // Login in first instance
      useAuthStore.getState().login(accessToken, refreshToken, mockUser);

      // Get state should include persisted data
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(accessToken);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('isAuthenticated computed value', () => {
    it('should return false when no user', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should return true when user exists', () => {
      useAuthStore.getState().login(mockUser, 'token', 'refresh');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should return false after logout', () => {
      useAuthStore.getState().login(mockUser, 'token', 'refresh');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
