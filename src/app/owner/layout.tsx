import { ReactNode } from "react";
import { Roboto } from "next/font/google";
import "./owner-theme.css";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${roboto.variable} font-roboto theme-owner min-h-screen bg-background text-foreground flex flex-col`}>
      {children}
    </div>
  );
}
