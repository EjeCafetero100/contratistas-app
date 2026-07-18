"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PrintButton() {
  
  const handleDownloadImage = async () => {
    const node = document.getElementById("carnet-node");
    if (!node) return;
    
    try {
      const canvas = await html2canvas(node, {
        scale: 3, // Alta resolución
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "carnet_identificacion.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Hubo un error al generar la imagen.");
    }
  };

  const handleDownloadPDF = async () => {
    const node = document.getElementById("carnet-node");
    if (!node) return;
    
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      // Ajustar el PDF al tamaño exacto de la tarjeta
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      
      // Fix for iOS Safari "THIS PAGE COULDN'T LOAD" crash on large Data URIs
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        // Clean up the URL object after a bit
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        pdf.save("carnet_identificacion.pdf");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  };

  return (
    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button 
        onClick={() => window.print()} 
        className="btn" 
        style={{ background: 'var(--surface-border)', color: 'var(--text-main)', border: '1px solid #ccc' }}
      >
        🖨️ Imprimir
      </button>

      <button 
        onClick={handleDownloadImage} 
        className="btn"
        style={{ background: '#10b981', color: 'white' }}
      >
        🖼️ Descargar Imagen
      </button>

      <button 
        onClick={handleDownloadPDF} 
        className="btn btn-primary" 
      >
        📄 Descargar PDF
      </button>
    </div>
  );
}
