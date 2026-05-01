export type UserRole = "guide" | "supplier" | "admin";

export type TourStatus = "draft" | "submitted" | "completed" | "archived";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "rejected";

export type DeliveryMethod = "delivery" | "express";

export type DeliveryLocationType = "delivery";

export interface User {
  _id: string;
  openId: string;
  role: UserRole;
  name: string;
  phone: string;
  wechatId: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  spec: string;
  price: number;
  unit: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RedSlipItem {
  productId: string;
  productName: string;
  price: number; // cents
  unit: string;
  spec: string;
}

export interface RedSlip {
  _id: string;
  name: string;
  items: RedSlipItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Tour {
  _id: string;
  tourCode: string;
  date: string;
  guideId: string;
  orderCount: number;
  status: TourStatus;
  redSlipId?: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNo: string;
  tourId: string;
  guideId: string;
  supplierId: string;
  guestNo?: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  deliveryLocationId?: string;
  deliveryAddress?: string;
  deliveryTime: string;
  totalAmount: number;
  remark?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrder {
  _id: string;
  tourId: string;
  tourCode: string;
  tourDate: string;
  guideId: string;
  guideName: string;
  guidePhone: string;
  supplierId: string;
  status: OrderStatus;
  whiteSlipIds: string[];
  totalQuantity: number;
  totalAmount: number;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderNote {
  _id: string;
  orderId: string;
  userId: string;
  role: UserRole;
  userName: string;
  content: string;
  createdAt: string;
}

export interface DeliveryLocation {
  _id: string;
  name: string;
  type: DeliveryLocationType;
  address: string;
  contactPhone: string;
  isActive: boolean;
  usageCount: number;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  shipping: "配送中",
  delivered: "已送达",
  rejected: "已拒单",
};

export const DELIVERY_METHOD_MAP: Record<DeliveryMethod, string> = {
  delivery: "送货上门",
  express: "快递到家",
};

export const TOUR_STATUS_MAP: Record<TourStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  completed: "已完成",
  archived: "已归档",
};
