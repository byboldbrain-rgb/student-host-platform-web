import { searchEgyptRailTrips } from "./providers/egypt-rail";
import { searchGoBusTrips } from "./providers/go-bus";
import { TransportSearchParams, TripResult } from "./types";

export async function searchAllTrips(
  params: TransportSearchParams
): Promise<TripResult[]> {
  const providers: Promise<TripResult[]>[] = [];

  if (!params.type || params.type === "all" || params.type === "train") {
    providers.push(searchEgyptRailTrips(params));
  }

  if (!params.type || params.type === "all" || params.type === "bus") {
    providers.push(searchGoBusTrips(params));
  }

  const results = await Promise.all(providers);

  return results
    .flat()
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}