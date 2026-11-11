import { supabase } from '@/lib/supabase';

export interface MarketVehicle {
  id: string;
  kind: 'car' | 'bike' | 'scooter';
  brand: string;
  model: string;
  priceInr: number;
  priceBasis: string;
}

export interface TravelDestination {
  id: string;
  name: string;
  country: string;
  tripCostInr: number;
  highlight: string;
}

export interface MarketCatalog {
  vehicles: MarketVehicle[];
  destinations: TravelDestination[];
}

interface VehicleRow {
  id: string;
  kind: MarketVehicle['kind'];
  brand: string;
  model: string;
  price_inr: number;
  price_basis: string;
}

interface DestinationRow {
  id: string;
  name: string;
  country: string;
  trip_cost_inr: number;
  highlight: string;
}

export async function fetchMarketCatalog(): Promise<MarketCatalog> {
  const [vehicleResult, destinationResult] = await Promise.all([
    supabase
      .from('market_vehicles')
      .select('id, kind, brand, model, price_inr, price_basis')
      .order('price_inr', { ascending: true })
      .returns<VehicleRow[]>(),
    supabase
      .from('travel_destinations')
      .select('id, name, country, trip_cost_inr, highlight')
      .order('trip_cost_inr', { ascending: true })
      .returns<DestinationRow[]>(),
  ]);

  if (vehicleResult.error) throw vehicleResult.error;
  if (destinationResult.error) throw destinationResult.error;

  return {
    vehicles: (vehicleResult.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      brand: row.brand,
      model: row.model,
      priceInr: Number(row.price_inr),
      priceBasis: row.price_basis,
    })),
    destinations: (destinationResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country,
      tripCostInr: Number(row.trip_cost_inr),
      highlight: row.highlight,
    })),
  };
}
