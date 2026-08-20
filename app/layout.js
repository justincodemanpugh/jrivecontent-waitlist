import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "JriveContent — Scale your brand with affordable creators",
  description:
    "Get your first 100 users by collaborating with affordable UGC creators. Join the JriveContent waitlist.",
};

// Runs before first paint so a dark-mode dashboard never flashes white.
// Mirrors the logic in components/ThemeProvider.js — keep the two in sync.
const themeScript = `(function(){try{var t=localStorage.getItem("jc-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-white text-brand-ink">{children}<Analytics /></body>
    </html>
  );
}
