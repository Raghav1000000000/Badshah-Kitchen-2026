import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/SessionContext";
import { KitchenAuthProvider } from "@/lib/kitchenAuth";

export const metadata: Metadata = {
  title: "Badshah's Kitchen",
  description: "Mobile-first café ordering app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <KitchenAuthProvider>
            {children}
          </KitchenAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
