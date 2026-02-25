"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createContext, useContext } from "react";

const GoogleAuthContext = createContext(false);

export function useGoogleAuthEnabled() {
  return useContext(GoogleAuthContext);
}

export default function GoogleOAuthWrapper({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isEnabled = !!clientId;

  return (
    <GoogleOAuthProvider clientId={clientId || "NOT_CONFIGURED"}>
      <GoogleAuthContext.Provider value={isEnabled}>
        {children}
      </GoogleAuthContext.Provider>
    </GoogleOAuthProvider>
  );
}
