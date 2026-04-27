import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/query-provider";
import { GuardProvider } from "@/components/GuardProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Chatbot from "@/components/layout/chatbot";
import { TourOverlay } from "@/components/layout/TourOverlay";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "GoPark",
  description: "Parking Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <GuardProvider>{children}</GuardProvider>
          </QueryProvider>
          <Toaster />
          <Chatbot />
          <TourOverlay />
        </ThemeProvider>
      </body>
    </html>
  );
}
