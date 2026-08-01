"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CalculadoraPage() {
  const [daysElapsed, setDaysElapsed] = useState("...");

  useEffect(() => {
    // La fecha dada: 08-01-2020 (8 de enero de 2020)
    // El formato en Date de JS es YYYY-MM-DD para evitar problemas de zona horaria
    const targetDate = new Date("2020-01-08T00:00:00");
    const currentDate = new Date();
    
    // Calculamos la diferencia en milisegundos
    const differenceInMs = currentDate - targetDate;
    
    // Convertimos de milisegundos a días
    // 1000 ms * 60 s * 60 m * 24 h
    const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
    
    setDaysElapsed(differenceInDays + ".0");
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f9f9f9",
      fontFamily: "sans-serif"
    }}>
      <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: '#666', textDecoration: 'none', fontWeight: 'bold' }}>
        &larr; Volver
      </Link>
      
      <div style={{
        fontSize: "12rem",
        fontWeight: "500",
        color: "#a3db70", // Color verde claro similar a la imagen
        letterSpacing: "-0.05em",
        lineHeight: "1",
        userSelect: "none"
      }}>
        {daysElapsed}
      </div>
      
      <div style={{
        marginTop: "1rem",
        color: "#888",
        fontSize: "1.2rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em"
      }}>
        Días transcurridos
      </div>
    </div>
  );
}
