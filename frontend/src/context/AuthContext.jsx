
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      return response.data;
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  // Stage 1: Verify password and request an email OTP.
  async function login(email, password) {
    // Remove any previous authenticated session.
    localStorage.removeItem("access_token");
    setUser(null);

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // No access token is issued at this stage.
    return response.data;
  }

  // Stage 2: Verify OTP and obtain the actual access token.
  async function verifyOTP(challengeId, otp, preAuthToken) {
    const response = await api.post(
      "/auth/verify-otp",
      {
        challenge_id: challengeId,
        otp,
      },
      {
        headers: {
          Authorization: `Bearer ${preAuthToken}`,
        },
      }
    );

    localStorage.setItem(
      "access_token",
      response.data.access_token
    );

    const authenticatedUser = await loadUser();

    if (!authenticatedUser) {
      throw new Error("Authentication succeeded, but user loading failed.");
    }

    return authenticatedUser;
  }

  // Request a replacement OTP.
  async function resendOTP(challengeId, preAuthToken) {
    const response = await api.post(
      "/auth/resend-otp",
      {
        challenge_id: challengeId,
      },
      {
        headers: {
          Authorization: `Bearer ${preAuthToken}`,
        },
      }
    );

    return response.data;
  }

  // Signup creates the account but does not automatically log in.
  async function register(email, password) {
    await api.post("/auth/signup", {
      email,
      password,
    });
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOTP,
        resendOTP,
        register,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
