import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientFlow — Multi-Tenant Lead, Booking & Customer Automation",
  description:
    "The central operating system for businesses in Bangladesh. Capture leads, turn inquiries into bookings, and automate customer communication via WhatsApp, SMS, and Email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
