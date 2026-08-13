import { Poppins, Plus_Jakarta_Sans } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-viral-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-viral-body",
  display: "swap",
});

/* Scopes the marketing fonts to the homepage. Kept out of the root layout so
   /blog, /classic and the dashboard stay on Inter. */
export default function ViralFonts({ children }) {
  return (
    <div className={`${poppins.variable} ${jakarta.variable} font-viral`}>
      {children}
    </div>
  );
}
