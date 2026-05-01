import { collection, Collections, db } from "./db";
import type { Order, OrderNote, OrderStatus } from "../types";

const _ = db().command;

export async function createOrder(
  order: Omit<Order, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.ORDERS).add({ data: order });
  return _id as string;
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data } = await collection(Collections.ORDERS).doc(id).get();
  return (data as unknown as Order) ?? null;
}

export async function getOrdersByTour(tourId: string): Promise<Order[]> {
  const { data } = await collection(Collections.ORDERS)
    .where({ tourId })
    .orderBy("createdAt", "asc")
    .get();
  return data as unknown as Order[];
}

export async function getOrdersByGuide(guideId: string): Promise<Order[]> {
  const { data } = await collection(Collections.ORDERS)
    .where({ guideId })
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as Order[];
}

export async function getOrdersByStatus(
  status: OrderStatus
): Promise<Order[]> {
  const { data } = await collection(Collections.ORDERS)
    .where({ status })
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await collection(Collections.ORDERS).doc(id).update({
    data: { status, updatedAt: new Date().toISOString() },
  });
}

export async function updateDeliveryAddress(
  id: string,
  address: {
    deliveryMethod?: string;
    deliveryLocationId?: string;
    deliveryAddress?: string;
    deliveryTime?: string;
  }
): Promise<void> {
  await collection(Collections.ORDERS).doc(id).update({
    data: { ...address, updatedAt: new Date().toISOString() },
  });
}

export async function addOrderNote(
  note: Omit<OrderNote, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.ORDER_NOTES).add({
    data: note,
  });
  return _id as string;
}

export async function getOrderNotes(orderId: string): Promise<OrderNote[]> {
  const { data } = await collection(Collections.ORDER_NOTES)
    .where({ orderId })
    .orderBy("createdAt", "asc")
    .get();
  return data as unknown as OrderNote[];
}

export function generateOrderNo(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${date}-${seq}`;
}
