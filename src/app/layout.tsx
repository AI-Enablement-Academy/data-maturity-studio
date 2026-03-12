import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MotionRoot } from "@/components/diagnostics/motion-root";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Data Quality Studio",
  description: "Deterministic workflow diagnostics for trust, reuse, workflow state, and controlled AI suitability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
