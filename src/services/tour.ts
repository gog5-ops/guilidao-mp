import { collection, Collections } from "./db";
import type { Tour, TourStatus } from "../types";

export async function createTour(
  tour: Omit<Tour, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.TOURS).add({ data: tour });
  return _id as string;
}

export async function getTour(id: string): Promise<Tour | null> {
  const { data } = await collection(Collections.TOURS).doc(id).get();
  return (data as unknown as Tour) ?? null;
}

export async function getAllTours(): Promise<Tour[]> {
  const { data } = await collection(Collections.TOURS)
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as Tour[];
}

export async function getToursByGuide(guideId: string): Promise<Tour[]> {
  const { data } = await collection(Collections.TOURS)
    .where({ guideId })
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as Tour[];
}

export async function updateTourStatus(
  id: string,
  status: TourStatus
): Promise<void> {
  await collection(Collections.TOURS).doc(id).update({
    data: { status },
  });
}

export async function deleteTour(id: string): Promise<void> {
  await collection(Collections.TOURS).doc(id).remove();
}

export function generateTourCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `GL${date}-${seq}`;
}
