import "./globals.css";
import type { Metadata } from "next";
import { AppNav } from "../components/app-nav";

export const metadata: Metadata = {
  title: "TSMT Trainer",
  description: "TSMT webapp monorepo bootstrap",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
