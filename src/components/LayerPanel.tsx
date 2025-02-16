import { Layers, Eye, EyeOff, Trash2, Filter, Map as MapIcon } from 'lucide-react';
import type { Layer } from '../types';
import { useState, useEffect } from 'react';

interface LayerPanelProps {
  layers: Layer[];
  onToggleLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onFiltersChange?: (filters: FilterCriteria) => void;
}

interface FilterCriteria {
  region?: string;
  department?: string;
  commune?: string;
  siteStatus?: string;
  client?: string;
}

// Liste complète des régions de France
const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte'
];

export function LayerPanel({ layers, onToggleLayer, onDeleteLayer, onFiltersChange }: LayerPanelProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'context' | 'spatial'>('request');
  const [filters, setFilters] = useState<FilterCriteria>({
    region: '',
    department: '',
    commune: '',
    siteStatus: '',
    client: ''
  });
  const [availableFilters, setAvailableFilters] = useState<{
    departments: string[];
    communes: string[];
    statuses: string[];
    clients: string[];
  }>({
    departments: [],
    communes: [],
    statuses: [],
    clients: []
  });

  // Extraire les valeurs uniques pour les filtres à partir des couches
  useEffect(() => {
    const newFilters = {
      departments: new Set<string>(),
      communes: new Set<string>(),
      statuses: new Set<string>(),
      clients: new Set<string>()
    };

    layers.forEach(layer => {
      if (layer.data && layer.data.features) {
        layer.data.features.forEach(feature => {
          if (feature.properties) {
            const props = feature.properties;
            if (props.department) newFilters.departments.add(props.department);
            if (props.commune) newFilters.communes.add(props.commune);
            if (props.status) newFilters.statuses.add(props.status);
            if (props.client) newFilters.clients.add(props.client);
          }
        });
      }
    });

    setAvailableFilters({
      departments: Array.from(newFilters.departments).sort(),
      communes: Array.from(newFilters.communes).sort(),
      statuses: Array.from(newFilters.statuses).sort(),
      clients: Array.from(newFilters.clients).sort()
    });
  }, [layers]);

  // Mettre à jour les filtres et notifier le parent
  const handleFilterChange = (key: keyof FilterCriteria, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);

    // Réinitialiser les filtres dépendants si nécessaire
    if (key === 'region') {
      newFilters.department = '';
      newFilters.commune = '';
    } else if (key === 'department') {
      newFilters.commune = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'request' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('request')}
        >
          Requête
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'context' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('context')}
        >
          Contexte
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'spatial' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('spatial')}
        >
          Analyse Spatiale
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'request' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Filtrer / Exporter</h2>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Région
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Toutes les régions</option>
                  {FRENCH_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  disabled={!filters.region}
                >
                  <option value="">Tous les départements ({availableFilters.departments.length})</option>
                  {availableFilters.departments
                    .filter(dept => !filters.region || layers.some(layer => 
                      layer.data.features.some(feature => 
                        feature.properties.department === dept && 
                        feature.properties.region === filters.region
                      )
                    ))
                    .map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commune
                </label>
                <select
                  value={filters.commune}
                  onChange={(e) => handleFilterChange('commune', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  disabled={!filters.department}
                >
                  <option value="">Toutes les communes ({availableFilters.communes.length})</option>
                  {availableFilters.communes
                    .filter(commune => !filters.department || layers.some(layer => 
                      layer.data.features.some(feature => 
                        feature.properties.commune === commune && 
                        feature.properties.department === filters.department
                      )
                    ))
                    .map((commune) => (
                      <option key={commune} value={commune}>
                        {commune}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut du projet
                </label>
                <select
                  value={filters.siteStatus}
                  onChange={(e) => handleFilterChange('siteStatus', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Tous les statuts ({availableFilters.statuses.length})</option>
                  {availableFilters.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={filters.client}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Tous les clients ({availableFilters.clients.length})</option>
                  {availableFilters.clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Contexte</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de contexte
                </label>
                <textarea
                  className="w-full h-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Ajoutez des notes de contexte ici..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spatial' && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Analyse Spatiale</h2>
            {/* Add spatial analysis content here */}
          </div>
        )}
      </div>

      {/* Layers Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Couches</h2>
        </div>
        <div className="space-y-2">
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <span className="text-sm font-medium">{layer.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleLayer(layer.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteLayer(layer.id)}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}