import { TransportSearchParams, TripResult } from "../types";

export async function searchEgyptRailTrips(
  params: TransportSearchParams
): Promise<TripResult[]> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date || "",
  });

  return [
    {
      id: "rail-1",
      providerName: "Egypt Railways",
      providerType: "train",
      from: params.from,
      to: params.to,
      departureTime: params.date ? `${params.date} 08:00` : "08:00",
      arrivalTime: params.date ? `${params.date} 11:30` : "11:30",
      price: 90,
      currency: "EGP",
      bookingUrl: `https://obs.enr.gov.eg/o-city/obs/enr/railway/ar/booktickets?${query.toString()}`,
      sourceName: "Egypt Railways Demo Provider",
    },
    {
      id: "rail-2",
      providerName: "Egypt Railways",
      providerType: "train",
      from: params.from,
      to: params.to,
      departureTime: params.date ? `${params.date} 14:00` : "14:00",
      arrivalTime: params.date ? `${params.date} 17:10` : "17:10",
      price: 120,
      currency: "EGP",
      bookingUrl: `https://obs.enr.gov.eg/o-city/obs/enr/railway/ar/booktickets?${query.toString()}`,
      sourceName: "Egypt Railways Demo Provider",
    },
  ];
}