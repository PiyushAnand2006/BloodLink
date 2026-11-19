import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppChrome } from "@/components/layout/Chrome";
import { SWRProvider } from "@/components/providers/SWRProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BloodLink — Emergency Blood Coordination",
    template: "%s · BloodLink",
  },
  description:
    "BloodLink connects hospitals with donors, NGOs and blood banks during blood emergencies, with a live availability dashboard per blood group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SWRProvider>
          <AppChrome>{children}</AppChrome>
        </SWRProvider>
      </body>
    </html>
  );
}
