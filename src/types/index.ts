export type UserRole = "guide" | "supplier" | "admin";

export type TourStatus = "draft" | "submitted" | "completed" | "archived";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "partially_shipped"
  | "shipping"
  | "delivered"
  | "rejected";

export type AfterSalesStatus = "none" | "requested" | "processing" | "resolved";

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
  afterSalesStatus?: AfterSalesStatus;
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

export interface GuestEntry {
  guestNo: string;
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryTime?: string;
  remark?: string;
}

export interface WhiteSlip {
  _id: string;
  tourId: string;
  guideId: string;
  redSlipId?: string;
  entries: GuestEntry[];
  defaultAddress: string;
  totalAmount: number;
  totalQuantity: number;
  status: 'draft' | 'submitted';
  createdAt: string;
  updatedAt: string;
}

export const WHITE_SLIP_STATUS_MAP: Record<WhiteSlip['status'], string> = {
  draft: '草稿',
  submitted: '已提交',
};

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  partially_shipped: "部分发货",
  shipping: "配送中",
  delivered: "已送达",
  rejected: "已拒单",
};

export const AFTER_SALES_STATUS_MAP: Record<AfterSalesStatus, string> = {
  none: "无",
  requested: "售后申请中",
  processing: "售后处理中",
  resolved: "售后已完成",
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
