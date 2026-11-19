import type { Metadata } from "next";
import { AppChrome } from "@/components/layout/Chrome";
import { SWRProvider } from "@/components/providers/SWRProvider";
import "./globals.css";

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
    <html lang="en">
      <head>
        {/* Inter loaded as a stylesheet so builds never depend on font fetches;
            the Tailwind font stack falls back to system sans if offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SWRProvider>
          <AppChrome>{children}</AppChrome>
        </SWRProvider>
      </body>
    </html>
  );
}
