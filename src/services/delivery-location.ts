import { collection, Collections } from "./db";
import type { DeliveryLocation, DeliveryLocationType } from "../types";

export async function getDeliveryLocations(
  type?: DeliveryLocationType
): Promise<DeliveryLocation[]> {
  let query = collection(Collections.DELIVERY_LOCATIONS).where({
    isActive: true,
  });
  if (type) {
    query = collection(Collections.DELIVERY_LOCATIONS).where({
      isActive: true,
      type,
    });
  }
  const { data } = await query.orderBy("usageCount", "desc").get();
  return data as unknown as DeliveryLocation[];
}

export async function createDeliveryLocation(
  loc: Omit<DeliveryLocation, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.DELIVERY_LOCATIONS).add({
    data: loc,
  });
  return _id as string;
}

export async function incrementUsageCount(id: string): Promise<void> {
  const db_ = (await import("./db")).db();
  const _ = db_.command;
  await collection(Collections.DELIVERY_LOCATIONS).doc(id).update({
    data: { usageCount: _.inc(1) },
  });
}

export async function deleteDeliveryLocation(id: string): Promise<void> {
  await collection(Collections.DELIVERY_LOCATIONS).doc(id).update({
    data: { isActive: false },
  });
}
