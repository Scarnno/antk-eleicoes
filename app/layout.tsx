import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ANTK | Portal Eleitoral", description: "Uma nova gestão. As mesmas figurinhas. Inscreva sua candidatura e participe das eleições da ANTK." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="pt-BR"><body>{children}</body></html>; }
