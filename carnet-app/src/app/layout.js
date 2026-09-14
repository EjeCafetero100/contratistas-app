import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { CityProvider } from "@/context/CityContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TABLERO DE SEGURIDAD Y GESTIÓN OPERACIONAL | AB InBev - SafeTogether",
  description: "Sistema de gestión operacional, control documental y seguridad para centros de distribución",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CityProvider>
          <ClientLayout>{children}</ClientLayout>
        </CityProvider>
      </body>
    </html>
  );
}

