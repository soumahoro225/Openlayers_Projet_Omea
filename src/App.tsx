import React, { useState } from 'react';
import { MapComponent } from './components/Map';
import { LayerPanel } from './components/LayerPanel';
import { CSVImport } from './components/CSVImport';
import { Info, Upload, List, Circle, MapPin, Share2 } from 'lucide-react';
import { EmbedModal } from './components/EmbedModal';
import type { Layer } from './types';

interface FilterCriteria {
  region?: string;
  department?: string;
  commune?: string;
  siteStatus?: string;
  client?: string;
}

function App() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'data' | 'legend' | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Record<string, any> | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({});

  const handleToggleLayer = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const handleDeleteLayer = (layerId: string) => {
    setLayers(layers.filter(layer => layer.id !== layerId));
    setSelectedFeature(null);
  };

  const handleCSVDataLoaded = (layer: Layer) => {
    setLayers([...layers, layer]);
  };

  const handleFeatureSelect = (properties: Record<string, any>) => {
    setSelectedFeature(properties);
    setActiveTab('info');
  };

  const handleFiltersChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

  // Fonction pour obtenir les statistiques des couches
  const getLayerStats = (layer: Layer) => {
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byRegion: {} as Record<string, number>
    };

    if (layer.data && layer.data.features) {
      layer.data.features.forEach(feature => {
        if (feature.properties) {
          stats.total++;
          
          // Compter par statut
          const status = feature.properties.status || 'Non défini';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
          
          // Compter par région
          const region = feature.properties.region || 'Non définie';
          stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
        }
      });
    }

    return stats;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top toolbar */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="https://raw.githubusercontent.com/stackblitz/stackblitz-icons/main/files/omea-logo.png" 
            alt="OMEA" 
            className="h-8"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'info' ? null : 'info')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
              activeTab === 'info' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <Info className="w-4 h-4" />
            Informations
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'data' ? null : 'data')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
              activeTab === 'data'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Données
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'legend' ? null : 'legend')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
              activeTab === 'legend'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            Légende
          </button>
          <button
            onClick={() => setShowCSVModal(true)}
            className="px-3 py-1.5 rounded-md flex items-center gap-2 text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowEmbedModal(true)}
            className="px-3 py-1.5 rounded-md flex items-center gap-2 text-sm bg-white text-gray-700 border hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r bg-white overflow-hidden flex flex-col">
          <LayerPanel
            layers={layers}
            onToggleLayer={handleToggleLayer}
            onDeleteLayer={handleDeleteLayer}
            onFiltersChange={handleFiltersChange}
          />
        </div>
        <div className="flex-1 relative">
          <MapComponent 
            layers={layers} 
            onFeatureSelect={handleFeatureSelect}
            filters={filters}
          />
          
          {/* Panels */}
          {activeTab && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 max-h-[80vh] overflow-y-auto">
              {activeTab === 'info' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations</h3>
                  {selectedFeature ? (
                    <div className="space-y-3">
                      {Object.entries(selectedFeature)
                        .filter(([key]) => key !== 'geometry' && key !== 'popupContent')
                        .map(([key, value]) => (
                          <div key={key} className="border-b pb-2">
                            <div className="text-sm font-medium text-gray-600">{key}</div>
                            <div className="text-sm">{value}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Cliquez sur un point de la carte pour afficher ses informations
                    </p>
                  )}
                </div>
              )}
              {activeTab === 'data' && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Données</h3>
                  <p className="text-sm text-gray-600">Statistiques et métadonnées</p>
                </div>
              )}
              {activeTab === 'legend' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Légende</h3>
                  {layers.filter(layer => layer.visible).map(layer => {
                    const stats = getLayerStats(layer);
                    return (
                      <div key={layer.id} className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                          <h4 className="font-medium">{layer.name}</h4>
                          <span className="text-sm text-gray-500">({stats.total} objets)</span>
                        </div>
                        
                        {/* Statuts */}
                        {Object.keys(stats.byStatus).length > 0 && (
                          <div className="ml-6 mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Par statut</h5>
                            <div className="space-y-2">
                              {Object.entries(stats.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-blue-500" />
                                  <span>{status}</span>
                                  <span className="text-gray-500">({count})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Régions */}
                        {Object.keys(stats.byRegion).length > 0 && (
                          <div className="ml-6">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Par région</h5>
                            <div className="space-y-2">
                              {Object.entries(stats.byRegion).map(([region, count]) => (
                                <div key={region} className="flex items-center gap-2 text-sm">
                                  <Circle className="w-4 h-4 text-blue-500" />
                                  <span>{region}</span>
                                  <span className="text-gray-500">({count})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {layers.filter(layer => layer.visible).length === 0 && (
                    <p className="text-sm text-gray-600">
                      Aucune couche visible sur la carte
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modals */}
          {showCSVModal && (
            <CSVImport
              onClose={() => setShowCSVModal(false)}
              onDataLoaded={handleCSVDataLoaded}
            />
          )}
          {showEmbedModal && (
            <EmbedModal onClose={() => setShowEmbedModal(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;