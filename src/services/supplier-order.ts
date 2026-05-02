import { collection, Collections } from "./db";
import type { SupplierOrder, OrderStatus, AfterSalesStatus } from "../types";

export async function createSupplierOrder(
  order: Omit<SupplierOrder, "_id">
): Promise<string> {
  const { _id } = await collection(Collections.SUPPLIER_ORDERS).add({
    data: order,
  });
  return _id as string;
}

export async function getSupplierOrders(): Promise<SupplierOrder[]> {
  const { data } = await collection(Collections.SUPPLIER_ORDERS)
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as SupplierOrder[];
}

export async function getSupplierOrdersByStatus(
  status: OrderStatus
): Promise<SupplierOrder[]> {
  const { data } = await collection(Collections.SUPPLIER_ORDERS)
    .where({ status })
    .orderBy("createdAt", "desc")
    .get();
  return data as unknown as SupplierOrder[];
}

export async function getSupplierOrder(
  id: string
): Promise<SupplierOrder | null> {
  try {
    const { data } = await collection(Collections.SUPPLIER_ORDERS)
      .doc(id)
      .get();
    return (data as unknown as SupplierOrder) ?? null;
  } catch {
    return null;
  }
}

export async function updateSupplierOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await collection(Collections.SUPPLIER_ORDERS).doc(id).update({
    data: { status, updatedAt: new Date().toISOString() },
  });
}

export async function updateTrackingNumber(
  id: string,
  trackingNumber: string
): Promise<void> {
  await collection(Collections.SUPPLIER_ORDERS).doc(id).update({
    data: { trackingNumber, updatedAt: new Date().toISOString() },
  });
}

export async function updateAfterSalesStatus(
  id: string,
  afterSalesStatus: AfterSalesStatus
): Promise<void> {
  await collection(Collections.SUPPLIER_ORDERS).doc(id).update({
    data: { afterSalesStatus, updatedAt: new Date().toISOString() },
  });
}

export async function getSupplierOrderByTour(
  tourId: string
): Promise<SupplierOrder | null> {
  const { data } = await collection(Collections.SUPPLIER_ORDERS)
    .where({ tourId })
    .get();
  const orders = data as unknown as SupplierOrder[];
  return orders.length > 0 ? orders[0] : null;
}

export async function updateSupplierOrderTotals(
  id: string,
  totalAmount: number,
  totalQuantity: number
): Promise<void> {
  await collection(Collections.SUPPLIER_ORDERS).doc(id).update({
    data: { totalAmount, totalQuantity, updatedAt: new Date().toISOString() },
  });
}

export async function deleteSupplierOrder(id: string): Promise<void> {
  await collection(Collections.SUPPLIER_ORDERS).doc(id).remove();
}
