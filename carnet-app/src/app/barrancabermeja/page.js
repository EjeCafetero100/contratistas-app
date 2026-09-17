"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";

export default function BarrancabermejaLandingPage() {
  const router = useRouter();
  const { selectCity } = useCity();

  useEffect(() => {
    selectCity("Barrancabermeja");
    router.replace("/barrancabermeja/inducciones");
  }, [router, selectCity]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #00205b 0%, #001233 60%, #0a192f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📍</div>
        <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Cargando módulo Inducciones Barrancabermeja...</p>
      </div>
    </div>
  );
}
