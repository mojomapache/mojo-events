import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MojoMeetup — Mojo Mapache Events",
  description: "One link. Everyone knows what to bring."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen pb-16">{children}</body>
    </html>
  );
}
