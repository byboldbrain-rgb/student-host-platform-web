export type TransportType = "train" | "bus";

export interface TransportSearchParams {
  from: string;
  to: string;
  date?: string;
  type?: "all" | TransportType;
}

export interface TripResult {
  id: string;
  providerName: string;
  providerType: TransportType;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price?: number | null;
  currency?: string;
  bookingUrl: string;
  sourceName: string;
}