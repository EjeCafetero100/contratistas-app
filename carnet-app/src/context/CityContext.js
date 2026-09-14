"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CityContext = createContext();

export function CityProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState("Pereira");

  useEffect(() => {
    // Read from localStorage or URL query param if present
    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("selectedCity");
      if (savedCity) {
        setSelectedCity(savedCity);
      } else {
        setSelectedCity("Pereira");
        localStorage.setItem("selectedCity", "Pereira");
      }
    }
  }, []);

  const selectCity = (cityName) => {
    setSelectedCity(cityName);
    if (typeof window !== "undefined") {
      if (cityName) {
        localStorage.setItem("selectedCity", cityName);
      } else {
        localStorage.removeItem("selectedCity");
      }
    }
  };

  const clearCity = () => {
    setSelectedCity(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedCity");
    }
  };

  return (
    <CityContext.Provider value={{ selectedCity, selectCity, clearCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
}
