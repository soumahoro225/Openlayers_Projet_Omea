/*
  # Création des tables pour l'application SIG

  1. Nouvelles Tables
    - `sites` : Table principale des sites géographiques
      - `id` (uuid, clé primaire)
      - `name` (text, nom du site)
      - `status` (enum, statut du site)
      - `type` (enum, type de site)
      - `surface_area` (numeric, surface en m²)
      - `location` (geometry, localisation du site)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, référence à auth.users)

    - `regions` : Table des régions
      - `id` (uuid, clé primaire)
      - `name` (text, nom de la région)
      - `code` (text, code de la région)
      - `geometry` (geometry, forme de la région)

    - `departments` : Table des départements
      - `id` (uuid, clé primaire)
      - `name` (text, nom du département)
      - `code` (text, code du département)
      - `region_id` (uuid, référence à regions)
      - `geometry` (geometry, forme du département)

    - `communes` : Table des communes
      - `id` (uuid, clé primaire)
      - `name` (text, nom de la commune)
      - `code` (text, code INSEE)
      - `department_id` (uuid, référence à departments)
      - `geometry` (geometry, forme de la commune)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques de lecture pour les utilisateurs authentifiés
    - Politiques d'écriture pour les administrateurs

  3. Extensions
    - Activation de l'extension PostGIS
*/

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types
CREATE TYPE site_status AS ENUM ('potential', 'active', 'inactive', 'archived');
CREATE TYPE site_type AS ENUM ('industrial', 'commercial', 'residential', 'mixed', 'unknown');

-- Create sites table
CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status site_status DEFAULT 'potential',
  type site_type DEFAULT 'unknown',
  surface_area numeric,
  location geometry(Point, 4326),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create regions table
CREATE TABLE regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  geometry geometry(MultiPolygon, 4326)
);

-- Create departments table
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  region_id uuid REFERENCES regions(id),
  geometry geometry(MultiPolygon, 4326)
);

-- Create communes table
CREATE TABLE communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id),
  geometry geometry(MultiPolygon, 4326)
);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Sites are viewable by authenticated users"
  ON sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sites are insertable by authenticated users"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Sites are updatable by creators and admins"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Read-only policies for reference data
CREATE POLICY "Reference data is viewable by authenticated users"
  ON regions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reference data is viewable by authenticated users"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reference data is viewable by authenticated users"
  ON communes FOR SELECT
  TO authenticated
  USING (true);

-- Create spatial indexes
CREATE INDEX sites_location_idx ON sites USING GIST (location);
CREATE INDEX regions_geometry_idx ON regions USING GIST (geometry);
CREATE INDEX departments_geometry_idx ON departments USING GIST (geometry);
CREATE INDEX communes_geometry_idx ON communes USING GIST (geometry);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();