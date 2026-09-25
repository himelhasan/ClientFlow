"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#181A1E",
          color: "#FFFFFF",
          fontSize: "13px",
          fontWeight: "500",
          borderRadius: "14px",
          padding: "12px 16px",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2)",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFFFF",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}
