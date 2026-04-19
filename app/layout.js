import { Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-white text-brand-ink">{children}</body>
    </html>
  );
}
