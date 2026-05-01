import { collection, Collections } from "./db";
import type { RedSlip } from "../types";

export async function createRedSlip(
  slip: Omit<RedSlip, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.RED_SLIPS).add({ data: slip });
  return _id as string;
}

export async function getActiveRedSlips(): Promise<RedSlip[]> {
  const { data } = await collection(Collections.RED_SLIPS)
    .where({ isActive: true })
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as RedSlip[];
}

export async function getAllRedSlips(): Promise<RedSlip[]> {
  const { data } = await collection(Collections.RED_SLIPS)
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as RedSlip[];
}

export async function getRedSlip(id: string): Promise<RedSlip | null> {
  const { data } = await collection(Collections.RED_SLIPS).doc(id).get();
  return (data as unknown as RedSlip) ?? null;
}

export async function updateRedSlip(
  id: string,
  data: Partial<RedSlip>
): Promise<void> {
  await collection(Collections.RED_SLIPS)
    .doc(id)
    .update({ data: { ...data } });
}

export async function toggleRedSlipActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await collection(Collections.RED_SLIPS)
    .doc(id)
    .update({ data: { isActive } });
}
