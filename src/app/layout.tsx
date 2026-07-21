import type { Metadata } from "next";
import "./globals.css";
import "./header.css";

export const metadata: Metadata = {
  title: "AccessTrace — accessibility regression testing",
  description: "See what a release sounds like before users do.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
