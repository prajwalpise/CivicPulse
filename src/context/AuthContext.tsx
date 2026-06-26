import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { auth, isFirebaseConfigured, googleProvider, disableFirebase } from "../services/firebase";
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getUserProfile, createUserProfile } from "../services/db";
import { DEMO_USERS } from "../services/seedData";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  simulateLogin: (demoUserId: string) => Promise<void>;
  simulateCustomLogin: (name: string, email: string) => Promise<void>;
  signUpWithEmailAndPassword: (email: string, password: string, name: string) => Promise<void>;
  logInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  refreshUser: () => Promise<void>;
  loginAsDemoUser: (demoUser: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Load from local storage for quick guest/demo persistence
  useEffect(() => {
    const fetchSession = async () => {
      if (isFirebaseConfigured && auth) {
        try {
          onAuthStateChanged(auth, async (fbUser) => {
            try {
              if (fbUser) {
                // Check if profile exists in db
                let profile = await getUserProfile(fbUser.uid);
                if (!profile) {
                  profile = {
                    id: fbUser.uid,
                    name: fbUser.displayName || "Civic Hero",
                    email: fbUser.email || "",
                    photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
                    points: 0,
                    badges: [],
                    issuesReported: 0,
                    issuesResolved: 0,
                    upvotesReceived: 0,
                    joinedAt: new Date().toISOString()
                  };
                  await createUserProfile(profile);
                }
                setUser(profile);
                localStorage.setItem("civicpulse_session_uid", fbUser.uid);
              } else {
                // Check if there is a local demo session saved
                const demoUid = localStorage.getItem("civicpulse_session_uid");
                if (demoUid && !demoUid.startsWith("fb_")) {
                  const localProfile = await getUserProfile(demoUid);
                  setUser(localProfile);
                } else {
                  setUser(null);
                }
              }
            } catch (innerError) {
              console.error("Error inside onAuthStateChanged callback, falling back:", innerError);
              const demoUid = localStorage.getItem("civicpulse_session_uid");
              if (demoUid) {
                const profile = await getUserProfile(demoUid);
                setUser(profile);
              }
            } finally {
              setLoading(false);
            }
          });
        } catch (err: any) {
          console.error("onAuthStateChanged setup failed, disabling Firebase:", err);
          disableFirebase();
          const demoUid = localStorage.getItem("civicpulse_session_uid");
          if (demoUid) {
            const profile = await getUserProfile(demoUid);
            setUser(profile);
          }
          setLoading(false);
        }
      } else {
        // Fallback: demo session restored from local storage
        const demoUid = localStorage.getItem("civicpulse_session_uid");
        if (demoUid) {
          const profile = await getUserProfile(demoUid);
          setUser(profile);
        } else {
          // By default, let's login as a random Demo Hero on first load so the user is immediately active!
          // Or keep as guest first. Let's keep as guest but let them click to login easily.
          setUser(null);
        }
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      setLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        let profile = await getUserProfile(fbUser.uid);
        if (!profile) {
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || "Civic Hero",
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
            points: 0,
            badges: [],
            issuesReported: 0,
            issuesResolved: 0,
            upvotesReceived: 0,
            joinedAt: new Date().toISOString()
          };
          await createUserProfile(profile);
        }
        setUser(profile);
        localStorage.setItem("civicpulse_session_uid", fbUser.uid);
        setShowLoginModal(false);
      } catch (error: any) {
        console.error("Google Sign-In failed:", error);
        if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid') || error.message?.includes('invalid-api-key') || error.message?.includes('API key')) {
          console.warn("Invalid Firebase API Key. Dynamically switching to Demo Mode.");
          disableFirebase();
          const names = ["Aarav Sharma", "Ananya Iyer", "Vikram Patel", "Kabir Sen", "Aditi Rao"];
          const selectedName = names[Math.floor(Math.random() * names.length)];
          const selectedEmail = `${selectedName.toLowerCase().replace(" ", "")}@civicpulse.org`;
          await simulateCustomLogin(selectedName, selectedEmail);
        } else {
          throw error;
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Prompt modal instead for simulated logins
      setShowLoginModal(true);
    }
  };

  const simulateLogin = async (demoUserId: string) => {
    setLoading(true);
    try {
      let profile = await getUserProfile(demoUserId);
      if (!profile) {
        // Fallback: seed demo user to database if it doesn't exist yet
        const foundDemo = DEMO_USERS.find(u => u.id === demoUserId);
        if (foundDemo) {
          await createUserProfile(foundDemo);
          profile = foundDemo;
        }
      }
      if (profile) {
        setUser(profile);
        localStorage.setItem("civicpulse_session_uid", demoUserId);
        setShowLoginModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = async (demoUser: UserProfile) => {
    setLoading(true);
    try {
      let profile = await getUserProfile(demoUser.id);
      if (!profile) {
        await createUserProfile(demoUser);
        profile = demoUser;
      }
      setUser(profile);
      localStorage.setItem("civicpulse_session_uid", demoUser.id);
      setShowLoginModal(false);
    } catch (e) {
      console.error("loginAsDemoUser failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const runLocalSignUp = async (email: string, password: string, name: string) => {
    const localUsersStr = localStorage.getItem("civicpulse_local_credentials") || "[]";
    const localUsers = JSON.parse(localUsersStr);
    if (localUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    
    const customId = `user_${Date.now()}`;
    const profile: UserProfile = {
      id: customId,
      name,
      email,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      points: 0,
      badges: [],
      issuesReported: 0,
      issuesResolved: 0,
      upvotesReceived: 0,
      joinedAt: new Date().toISOString()
    };
    
    localUsers.push({ id: customId, name, email, password });
    localStorage.setItem("civicpulse_local_credentials", JSON.stringify(localUsers));
    
    await createUserProfile(profile);
    setUser(profile);
    localStorage.setItem("civicpulse_session_uid", customId);
  };

  const signUpWithEmailAndPassword = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = result.user;
          await updateProfile(fbUser, { displayName: name });
          
          const profile: UserProfile = {
            id: fbUser.uid,
            name,
            email,
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            points: 0,
            badges: [],
            issuesReported: 0,
            issuesResolved: 0,
            upvotesReceived: 0,
            joinedAt: new Date().toISOString()
          };
          await createUserProfile(profile);
          setUser(profile);
          localStorage.setItem("civicpulse_session_uid", fbUser.uid);
        } catch (fbError: any) {
          if (fbError.code === 'auth/api-key-not-valid' || fbError.message?.includes('api-key-not-valid') || fbError.message?.includes('invalid-api-key') || fbError.message?.includes('API key')) {
            console.warn("Invalid Firebase API Key during Sign Up. Falling back to Simulated local mode.");
            disableFirebase();
            await runLocalSignUp(email, password, name);
          } else {
            throw fbError;
          }
        }
      } else {
        await runLocalSignUp(email, password, name);
      }
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("signUpWithEmailAndPassword failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const runLocalLogIn = async (email: string, password: string) => {
    const localUsersStr = localStorage.getItem("civicpulse_local_credentials") || "[]";
    const localUsers = JSON.parse(localUsersStr);
    const found = localUsers.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      throw new Error("Invalid email or password combination.");
    }
    
    let profile = await getUserProfile(found.id);
    if (!profile) {
      profile = {
        id: found.id,
        name: found.name,
        email: found.email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(found.name)}`,
        points: 0,
        badges: [],
        issuesReported: 0,
        issuesResolved: 0,
        upvotesReceived: 0,
        joinedAt: new Date().toISOString()
      };
      await createUserProfile(profile);
    }
    setUser(profile);
    localStorage.setItem("civicpulse_session_uid", found.id);
  };

  const logInWithEmailAndPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          const fbUser = result.user;
          let profile = await getUserProfile(fbUser.uid);
          if (!profile) {
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || "Civic Hero",
              email: fbUser.email || "",
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              points: 0,
              badges: [],
              issuesReported: 0,
              issuesResolved: 0,
              upvotesReceived: 0,
              joinedAt: new Date().toISOString()
            };
            await createUserProfile(profile);
          }
          setUser(profile);
          localStorage.setItem("civicpulse_session_uid", fbUser.uid);
        } catch (fbError: any) {
          if (fbError.code === 'auth/api-key-not-valid' || fbError.message?.includes('api-key-not-valid') || fbError.message?.includes('invalid-api-key') || fbError.message?.includes('API key')) {
            console.warn("Invalid Firebase API Key during Log In. Falling back to Simulated local mode.");
            disableFirebase();
            await runLocalLogIn(email, password);
          } else {
            throw fbError;
          }
        }
      } else {
        await runLocalLogIn(email, password);
      }
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("logInWithEmailAndPassword failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const simulateCustomLogin = async (name: string, email: string) => {
    setLoading(true);
    try {
      const customId = `user_${Date.now()}`;
      const profile: UserProfile = {
        id: customId,
        name,
        email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        points: 0,
        badges: [],
        issuesReported: 0,
        issuesResolved: 0,
        upvotesReceived: 0,
        joinedAt: new Date().toISOString()
      };
      await createUserProfile(profile);
      setUser(profile);
      localStorage.setItem("civicpulse_session_uid", customId);
      setShowLoginModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await fbSignOut(auth);
      }
      localStorage.removeItem("civicpulse_session_uid");
      setUser(null);
    } catch (error) {
      console.error("Sign-out failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const refreshUser = async () => {
    if (user) {
      const updated = await getUserProfile(user.id);
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        simulateLogin,
        simulateCustomLogin,
        signUpWithEmailAndPassword,
        logInWithEmailAndPassword,
        signOut,
        showLoginModal,
        setShowLoginModal,
        refreshUser,
        loginAsDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
