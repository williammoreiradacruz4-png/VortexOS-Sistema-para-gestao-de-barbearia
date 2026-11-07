import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Inicia o efeito de sumir aos 4.5 segundos para terminar cravado em 5s
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 4500);

    // Avisa o componente pai que os 5 segundos acabaram
    const finishTimeout = setTimeout(() => {
      onFinished();
    }, 5000);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onFinished]);

  return (
    <div className={`splash-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <img
            src="/logo.png"
            alt="BarberSaaS Logo"
            className="splash-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'inline-block';
            }}
          />
          <span style={{ display: 'none' }}>💈</span>
        </div>
        <h1 className="splash-title">BarberSaaS</h1>
        <p className="splash-subtitle">Carregando o seu estilo...</p>
        <div className="splash-spinner"></div>
      </div>
    </div>
  );
}
