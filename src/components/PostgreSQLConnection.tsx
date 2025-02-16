import React, { useState } from 'react';
import { Database, X } from 'lucide-react';

interface PostgreSQLConnectionProps {
  onClose: () => void;
  onConnect: (connectionDetails: ConnectionDetails) => void;
}

interface ConnectionDetails {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export function PostgreSQLConnection({ onClose, onConnect }: PostgreSQLConnectionProps) {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails>({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(connectionDetails);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Connexion PostgreSQL</h2>
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
              Hôte
            </label>
            <input
              type="text"
              value={connectionDetails.host}
              onChange={(e) => setConnectionDetails({
                ...connectionDetails,
                host: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              placeholder="localhost"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="text"
              value={connectionDetails.port}
              onChange={(e) => setConnectionDetails({
                ...connectionDetails,
                port: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              placeholder="5432"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base de données
            </label>
            <input
              type="text"
              value={connectionDetails.database}
              onChange={(e) => setConnectionDetails({
                ...connectionDetails,
                database: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={connectionDetails.username}
              onChange={(e) => setConnectionDetails({
                ...connectionDetails,
                username: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={connectionDetails.password}
              onChange={(e) => setConnectionDetails({
                ...connectionDetails,
                password: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}