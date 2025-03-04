import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobileBreakpoint = 768;
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    // Vérification initiale
    checkIsMobile();

    // Écouteur d'événement pour le redimensionnement
    window.addEventListener('resize', checkIsMobile);

    // Nettoyage
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}; 