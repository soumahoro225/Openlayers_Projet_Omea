import React from 'react';
import { MapComponent } from '../components/Map';
import type { Layer } from '../types';

export function EmbedMap() {
  // Récupérer les paramètres de l'URL pour les filtres et les couches
  const params = new URLSearchParams(window.location.search);
  const layers: Layer[] = JSON.parse(decodeURIComponent(params.get('layers') || '[]'));
  const filters = JSON.parse(decodeURIComponent(params.get('filters') || '{}'));

  return (
    <div className="w-full h-screen">
      <MapComponent 
        layers={layers}
        filters={filters}
        onFeatureSelect={(feature) => {
          // Afficher les informations dans une infobulle simple
          const content = Object.entries(feature)
            .filter(([key]) => key !== 'geometry' && key !== 'popupContent')
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');

          const popup = document.createElement('div');
          popup.className = 'fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md';
          popup.innerHTML = content;

          // Supprimer la popup précédente si elle existe
          const existingPopup = document.querySelector('.popup');
          if (existingPopup) {
            existingPopup.remove();
          }

          document.body.appendChild(popup);
          setTimeout(() => popup.remove(), 5000); // Disparaît après 5 secondes
        }}
      />
    </div>
  );
}