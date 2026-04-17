import { TransportSearchParams, TripResult } from "../types";

export async function searchGoBusTrips(
  params: TransportSearchParams
): Promise<TripResult[]> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date || "",
  });

  return [
    {
      id: "gobus-1",
      providerName: "Go Bus",
      providerType: "bus",
      from: params.from,
      to: params.to,
      departureTime: params.date ? `${params.date} 09:00` : "09:00",
      arrivalTime: params.date ? `${params.date} 13:30` : "13:30",
      price: 180,
      currency: "EGP",
      bookingUrl: `https://go-bus.com/?${query.toString()}`,
      sourceName: "Go Bus Demo Provider",
    },
    {
      id: "gobus-2",
      providerName: "Go Bus",
      providerType: "bus",
      from: params.from,
      to: params.to,
      departureTime: params.date ? `${params.date} 18:00` : "18:00",
      arrivalTime: params.date ? `${params.date} 22:00` : "22:00",
      price: 210,
      currency: "EGP",
      bookingUrl: `https://go-bus.com/?${query.toString()}`,
      sourceName: "Go Bus Demo Provider",
    },
  ];
}