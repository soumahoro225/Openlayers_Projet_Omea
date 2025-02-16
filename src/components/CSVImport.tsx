import React, { useState } from 'react';
import { Upload, X, MapPin, Loader } from 'lucide-react';
import Papa from 'papaparse';
import type { Layer } from '../types';

interface CSVImportProps {
  onClose: () => void;
  onDataLoaded: (layer: Layer) => void;
}

interface CSVRow {
  [key: string]: string;
}

interface GeocodeStats {
  total: number;
  success: number;
  failed: number;
}

interface GeocodeResult {
  coordinates: [number, number];
  score: number;
  source: 'BAN' | 'BAN_Fuzzy' | 'Nominatim';
}

export function CSVImport({ onClose, onDataLoaded }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [addressField, setAddressField] = useState<string>('');
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GeocodeStats | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        preview: 1,
        complete: (results) => {
          if (results.meta.fields) {
            setFields(results.meta.fields);
          }
        }
      });
    }
  };

  const geocodeWithBAN = async (
    address: string,
    postalCode?: string,
    city?: string,
    fuzzy: boolean = false
  ): Promise<GeocodeResult | null> => {
    try {
      const params = new URLSearchParams();
      
      if (fuzzy) {
        // En mode fuzzy, on essaie différentes combinaisons
        const addressParts = address.split(/[\s,]+/);
        const searchQueries = [
          address, // Adresse complète
          addressParts.slice(-3).join(' '), // Derniers 3 éléments
          `${addressParts[0]} ${addressParts[addressParts.length - 1]}`, // Premier et dernier élément
        ];

        for (const query of searchQueries) {
          params.set('q', query);
          if (postalCode) params.set('postcode', postalCode);
          if (city) params.set('city', city);
          
          const response = await fetch(
            `https://api-adresse.data.gouv.fr/search/?${params.toString()}`
          );
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const score = feature.properties.score;
            
            // En mode fuzzy, on accepte un score plus bas
            if (score > 0.3) {
              return {
                coordinates: feature.geometry.coordinates,
                score,
                source: fuzzy ? 'BAN_Fuzzy' : 'BAN'
              };
            }
          }
        }
        return null;
      } else {
        // Mode normal
        params.append('q', address);
        if (postalCode) params.append('postcode', postalCode);
        if (city) params.append('city', city);
        params.append('limit', '1');

        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?${params.toString()}`
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const score = feature.properties.score;
          
          if (score > 0.4) {
            return {
              coordinates: feature.geometry.coordinates,
              score,
              source: 'BAN'
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur BAN:', error);
      return null;
    }
  };

  const geocodeWithNominatim = async (
    address: string,
    postalCode?: string,
    city?: string
  ): Promise<GeocodeResult | null> => {
    try {
      const searchQuery = [
        address,
        postalCode,
        city,
        'France'
      ].filter(Boolean).join(', ');

      const params = new URLSearchParams({
        format: 'json',
        q: searchQuery,
        limit: '1',
        countrycodes: 'fr',
        'accept-language': 'fr'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'GeocodingApp/1.0'
          }
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data && data[0] && data[0].lon && data[0].lat) {
        return {
          coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
          score: 0.5, // Score arbitraire pour Nominatim
          source: 'Nominatim'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur Nominatim:', error);
      return null;
    }
  };

  const normalizeAddress = (address: string): string => {
    // Normalisation de l'adresse
    let normalized = address.trim().toLowerCase();
    
    // Correction des abréviations communes
    const abbreviations: { [key: string]: string } = {
      'av.': 'avenue',
      'av ': 'avenue ',
      'bd.': 'boulevard',
      'bd ': 'boulevard ',
      'r.': 'rue',
      'r ': 'rue ',
      'pl.': 'place',
      'pl ': 'place ',
      'st.': 'saint',
      'st ': 'saint ',
      'ste.': 'sainte',
      'ste ': 'sainte ',
      'rte.': 'route',
      'rte ': 'route ',
      'ch.': 'chemin',
      'ch ': 'chemin ',
      'imp.': 'impasse',
      'imp ': 'impasse ',
      'allée': 'allee',
      'résidence': 'residence',
      'bât.': 'batiment',
      'bât ': 'batiment ',
      'étage': 'etage',
      'n°': 'numero ',
      'n ': 'numero ',
      '1er': 'premier',
      '2ème': 'deuxieme',
      '3ème': 'troisieme',
      '4ème': 'quatrieme',
      '5ème': 'cinquieme',
      'lot.': 'lotissement',
      'lot ': 'lotissement ',
      'rés.': 'residence',
      'res.': 'residence',
      'ham.': 'hameau',
      'ham ': 'hameau ',
      'zi ': 'zone industrielle ',
      'za ': 'zone artisanale ',
      'zac ': 'zone d activite ',
      'ccial': 'commercial'
    };
    
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    });
    
    // Suppression des caractères spéciaux et doubles espaces
    normalized = normalized
      .replace(/[^\w\s,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return normalized;
  };

  const processInBatches = async (rows: CSVRow[], batchSize: number = 5) => {
    const features: GeoJSON.Feature[] = [];
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Détection des champs d'adresse complémentaires
    const cityField = fields.find(f => 
      f.toLowerCase().includes('ville') || 
      f.toLowerCase().includes('commune') || 
      f.toLowerCase().includes('city')
    );
    
    const postalCodeField = fields.find(f => 
      f.toLowerCase().includes('code postal') || 
      f.toLowerCase().includes('cp') || 
      f.toLowerCase().includes('postal') ||
      f.toLowerCase().includes('zip')
    );
    
    // Traitement par lots
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchPromises = batch.map(async (row) => {
        const address = row[addressField];
        if (!address) return null;

        try {
          const normalizedAddress = normalizeAddress(address);
          const postalCode = postalCodeField ? row[postalCodeField] : undefined;
          const city = cityField ? row[cityField] : undefined;

          // Stratégie de géocodage en plusieurs étapes
          let result = await geocodeWithBAN(normalizedAddress, postalCode, city);
          
          if (!result) {
            // Essayer en mode fuzzy si la première tentative échoue
            result = await geocodeWithBAN(normalizedAddress, postalCode, city, true);
          }
          
          if (!result) {
            // En dernier recours, essayer Nominatim
            result = await geocodeWithNominatim(normalizedAddress, postalCode, city);
          }
          
          if (result) {
            successCount++;
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: result.coordinates
              },
              properties: {
                ...row,
                originalAddress: address,
                geocodedAddress: normalizedAddress,
                geocodeScore: result.score,
                geocodeSource: result.source
              }
            } as GeoJSON.Feature;
          } else {
            console.warn(`Échec du géocodage pour l'adresse: ${normalizedAddress}`);
            errorCount++;
            return null;
          }
        } catch (error) {
          console.error(`Erreur pour l'adresse "${address}":`, error);
          errorCount++;
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      features.push(...batchResults.filter((f): f is GeoJSON.Feature => f !== null));
      
      processed += batch.length;
      setProgress(Math.round((processed / rows.length) * 100));
      setStats({ total: rows.length, success: successCount, failed: errorCount });
      
      // Pause courte entre les lots
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return features;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !addressField) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const results: CSVRow[] = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (results) => resolve(results.data as CSVRow[]),
          error: reject
        });
      });

      const features = await processInBatches(results);

      const layer: Layer = {
        id: `csv-${Date.now()}`,
        name: file.name.replace('.csv', ''),
        type: 'vector',
        visible: true,
        data: {
          type: 'FeatureCollection',
          features: features
        }
      };

      onDataLoaded(layer);
      onClose();
    } catch (error) {
      console.error('Erreur lors du traitement du CSV:', error);
      setError('Une erreur est survenue lors du traitement du fichier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Import CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {fields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Champ contenant l'adresse
              </label>
              <select
                value={addressField}
                onChange={(e) => setAddressField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Sélectionnez un champ</option>
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Géocodage en cours... {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {stats && (
                <div className="text-sm text-gray-600">
                  <p>Total: {stats.total} adresses</p>
                  <p className="text-green-600">Succès: {stats.success}</p>
                  <p className="text-red-600">Échecs: {stats.failed}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
              disabled={!file || !addressField || loading}
            >
              {loading ? 'Traitement...' : 'Importer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}