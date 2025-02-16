import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface EmbedModalProps {
  onClose: () => void;
}

export function EmbedModal({ onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;
  const embedUrl = currentUrl.replace(/\/?$/, '/embed');
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border:0" allowfullscreen></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Intégrer la carte</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code d'intégration
            </label>
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-white rounded-md border shadow-sm hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h3>
            <div className="border rounded-lg overflow-hidden" style={{ height: '300px' }}>
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Aperçu de la carte"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              Note: La carte intégrée conservera les filtres et les couches visibles actuels.
              Les utilisateurs pourront interagir avec la carte mais ne pourront pas modifier les filtres.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}