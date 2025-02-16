import React, { useState } from 'react';
import { Database, Table, Upload, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Site, Region, Department, Commune } from '../types';

interface DatabasePanelProps {
  onDataLoaded: (data: any) => void;
}

export function DatabasePanel({ onDataLoaded }: DatabasePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const tables = [
    { id: 'sites', name: 'Sites', description: 'Sites géographiques' },
    { id: 'regions', name: 'Régions', description: 'Régions administratives' },
    { id: 'departments', name: 'Départements', description: 'Départements français' },
    { id: 'communes', name: 'Communes', description: 'Communes françaises' },
  ];

  const loadData = async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;
      
      onDataLoaded(data);
      setSelectedTable(tableName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold">Base de données</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connectez-vous à votre base de données PostgreSQL et chargez vos données géographiques.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedTable === table.id ? 'border-green-500 bg-green-50' : ''
                }`}
                onClick={() => loadData(table.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{table.name}</h3>
                    <p className="text-sm text-gray-600">{table.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading && selectedTable === table.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>État: {loading ? 'Chargement...' : 'Prêt'}</span>
          <button
            onClick={() => selectedTable && loadData(selectedTable)}
            className="flex items-center gap-1 text-green-600 hover:text-green-700"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}