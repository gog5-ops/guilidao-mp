import { collection, Collections } from "./db";
import type { WhiteSlip } from "../types";

export async function createWhiteSlip(
  slip: Omit<WhiteSlip, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.WHITE_SLIPS).add({ data: slip });
  return _id as string;
}

export async function getWhiteSlipByTour(
  tourId: string
): Promise<WhiteSlip | null> {
  const { data } = await collection(Collections.WHITE_SLIPS)
    .where({ tourId })
    .orderBy("createdAt", "desc")
    .get();
  const slips = data as unknown as WhiteSlip[];
  return slips.length > 0 ? slips[0] : null;
}

export async function getWhiteSlip(id: string): Promise<WhiteSlip | null> {
  try {
    const { data } = await collection(Collections.WHITE_SLIPS).doc(id).get();
    return (data as unknown as WhiteSlip) ?? null;
  } catch {
    return null;
  }
}

export async function updateWhiteSlip(
  id: string,
  data: Partial<WhiteSlip>
): Promise<void> {
  await collection(Collections.WHITE_SLIPS)
    .doc(id)
    .update({ data: { ...data, updatedAt: new Date().toISOString() } });
}

export async function submitWhiteSlip(id: string): Promise<void> {
  await collection(Collections.WHITE_SLIPS)
    .doc(id)
    .update({
      data: { status: "submitted" as const, updatedAt: new Date().toISOString() },
    });
}
