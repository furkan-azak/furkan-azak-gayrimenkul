import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://furkanazakgayrimenkul.com"),

  title: {
    default: "Furkan Azak Gayrimenkul",
    template: "%s | Furkan Azak Gayrimenkul",
  },

  description:
    "İzmir ve çevresinde seçili portföyler. Satılık & kiralık ilanlar, şeffaf ve hızlı iletişim.",

  applicationName: "Furkan Azak Gayrimenkul",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "/",
    title: "Furkan Azak Gayrimenkul",
    description:
      "İzmir ve çevresinde seçili portföyler. Satılık & kiralık ilanlar, şeffaf ve hızlı iletişim.",
    siteName: "Furkan Azak Gayrimenkul",
    locale: "tr_TR",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Furkan Azak Gayrimenkul",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Furkan Azak Gayrimenkul",
    description:
      "İzmir ve çevresinde seçili portföyler. Satılık & kiralık ilanlar, şeffaf ve hızlı iletişim.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}