import { ReactNode } from "react";
import "./owner-theme.css";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <div className="theme-owner min-h-screen bg-background text-foreground flex flex-col">{children}</div>;
}
