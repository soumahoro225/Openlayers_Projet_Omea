import { useEffect, useRef, useState } from 'react';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';
import type { Layer as CustomLayer } from '../types';

interface MapComponentProps {
  layers: CustomLayer[];
  onFeatureSelect?: (feature: any) => void;
  filters?: {
    region?: string;
    department?: string;
    commune?: string;
    siteStatus?: string;
    client?: string;
  };
}

export function MapComponent({ layers, onFeatureSelect, filters }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [olMap, setOlMap] = useState<OLMap | null>(null);
  const vectorLayersRef = useRef<{ [key: string]: VectorLayer<VectorSource> }>({});

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([1.888334, 46.603354]), // Centre de la France
        zoom: 6
      })
    });

    setOlMap(map);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Fonction pour vérifier si une feature correspond aux filtres
  const featureMatchesFilters = (properties: any) => {
    if (!filters) return true;
    
    if (filters.region && properties.region !== filters.region) return false;
    if (filters.department && properties.department !== filters.department) return false;
    if (filters.commune && properties.commune !== filters.commune) return false;
    if (filters.siteStatus && properties.status !== filters.siteStatus) return false;
    if (filters.client && properties.client !== filters.client) return false;
    
    return true;
  };

  useEffect(() => {
    if (!olMap) return;

    // Supprimer les couches qui ne sont plus présentes
    Object.entries(vectorLayersRef.current).forEach(([id, layer]) => {
      if (!layers.find(l => l.id === id)) {
        olMap.removeLayer(layer);
        delete vectorLayersRef.current[id];
      }
    });

    // Ajouter ou mettre à jour les couches
    layers.forEach(layer => {
      if (layer.visible) {
        let vectorLayer = vectorLayersRef.current[layer.id];

        if (!vectorLayer) {
          // Filtrer les features selon les critères
          const filteredFeatures = layer.data.features.filter(feature => 
            featureMatchesFilters(feature.properties)
          );

          const source = new VectorSource({
            features: new GeoJSON().readFeatures(
              {
                type: 'FeatureCollection',
                features: filteredFeatures
              },
              {
                featureProjection: 'EPSG:3857'
              }
            )
          });

          vectorLayer = new VectorLayer({
            source,
            style: (feature) => {
              if (feature.getGeometry() instanceof Point) {
                return new Style({
                  image: new Circle({
                    radius: 7,
                    fill: new Fill({ color: '#f97316' }), // Orange-500 de Tailwind
                    stroke: new Stroke({
                      color: '#ffffff',
                      width: 2
                    })
                  })
                });
              }
              return undefined;
            }
          });

          vectorLayersRef.current[layer.id] = vectorLayer;
          olMap.addLayer(vectorLayer);
        } else {
          // Mettre à jour les features existantes avec les filtres
          const filteredFeatures = layer.data.features.filter(feature => 
            featureMatchesFilters(feature.properties)
          );

          const source = new VectorSource({
            features: new GeoJSON().readFeatures(
              {
                type: 'FeatureCollection',
                features: filteredFeatures
              },
              {
                featureProjection: 'EPSG:3857'
              }
            )
          });

          vectorLayer.setSource(source);
        }

        vectorLayer.setVisible(true);
      } else if (vectorLayersRef.current[layer.id]) {
        vectorLayersRef.current[layer.id].setVisible(false);
      }
    });
  }, [layers, olMap, filters]);

  useEffect(() => {
    if (!olMap) return;

    const handleClick = (evt: any) => {
      const feature = olMap.forEachFeatureAtPixel(evt.pixel, feature => feature);
      if (feature && onFeatureSelect) {
        onFeatureSelect(feature.getProperties());
      }
    };

    olMap.on('click', handleClick);

    return () => {
      olMap.un('click', handleClick);
    };
  }, [olMap, onFeatureSelect]);

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}