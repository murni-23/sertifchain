import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SertifChain - Sertifikat Digital Bimbel",
  description: "Platform penerbitan dan klaim sertifikat digital untuk siswa bimbel",
  keywords: ["sertifikat", "bimbel", "digital certificate", "pendidikan"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={spaceGrotesk.variable}>
      <body className="font-body bg-cream text-black antialiased">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1F2937",
              color: "#FFFFFF",
              border: "1px solid #1F2937",
              boxShadow: "0 4px 16px rgba(31, 41, 55, 0.12)",
              fontWeight: "600",
            },
          }}
        />
      </body>
    </html>
  );
}
