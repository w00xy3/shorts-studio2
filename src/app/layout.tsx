import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shorts Studio",
  description: "Video clipping & autoposting studio for TikTok, YouTube Shorts, and Instagram Reels",
  keywords: ["Shorts Studio", "video clipping", "TikTok", "YouTube Shorts", "Instagram Reels", "autoposting"],
  authors: [{ name: "Shorts Studio Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Shorts Studio",
    description: "Video clipping & autoposting for short-form content",
    url: "https://chat.z.ai",
    siteName: "Shorts Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shorts Studio",
    description: "Video clipping & autoposting for short-form content",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
