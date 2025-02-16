import { Database } from '../lib/database.types';

export type Tables = Database['public']['Tables'];
export type Site = Tables['sites']['Row'];
export type Region = Tables['regions']['Row'];
export type Department = Tables['departments']['Row'];
export type Commune = Tables['communes']['Row'];

export interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  visible: boolean;
  data: GeoJSON.FeatureCollection;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface MapFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
  layer_id: string;
  created_by: string;
  created_at: string;
}