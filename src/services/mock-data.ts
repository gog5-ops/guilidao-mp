/**
 * Seed data for H5 mock-db mode.
 */

import { INITIAL_PRODUCTS } from "./product";
import { seedRecord } from "./mock-db";
import { Collections } from "./db";
import type {
  User,
  Tour,
  Order,
  OrderItem,
  DeliveryLocation,
} from "../types";

const GUIDE_ID = "mock_user_guide";
const SUPPLIER_ID = "mock_user_supplier";

const MOCK_USERS: User[] = [
  {
    _id: GUIDE_ID,
    openId: "mock_openid_guide",
    role: "guide",
    name: "李导游",
    phone: "13800001111",
    wechatId: "guide_wx_001",
    createdAt: "2025-01-10T08:00:00.000Z",
  },
  {
    _id: SUPPLIER_ID,
    openId: "mock_openid_supplier",
    role: "supplier",
    name: "桂林特产王",
    phone: "13800002222",
    wechatId: "supplier_wx_001",
    createdAt: "2025-01-05T08:00:00.000Z",
  },
];

const MOCK_TOURS: Tour[] = [
  {
    _id: "mock_tour_1",
    tourCode: "GL20250420-01",
    date: "2025-04-20",
    guideId: GUIDE_ID,
    orderCount: 2,
    status: "submitted",
    createdAt: "2025-04-19T10:00:00.000Z",
  },
  {
    _id: "mock_tour_2",
    tourCode: "GL20250421-01",
    date: "2025-04-21",
    guideId: GUIDE_ID,
    orderCount: 2,
    status: "draft",
    createdAt: "2025-04-20T08:00:00.000Z",
  },
  {
    _id: "mock_tour_3",
    tourCode: "GL20250418-01",
    date: "2025-04-18",
    guideId: GUIDE_ID,
    orderCount: 1,
    status: "completed",
    createdAt: "2025-04-17T09:00:00.000Z",
  },
];

function makeOrderItems(
  productIndices: number[],
  quantities: number[]
): OrderItem[] {
  return productIndices.map((pi, i) => {
    const p = INITIAL_PRODUCTS[pi];
    const qty = quantities[i];
    return {
      productId: `mock_product_${pi + 1}`,
      productName: p.name,
      quantity: qty,
      unitPrice: p.price,
      subtotal: p.price * qty,
    };
  });
}

const MOCK_ORDERS: Order[] = [
  {
    _id: "mock_order_1",
    orderNo: "20250420-0001",
    tourId: "mock_tour_1",
    guideId: GUIDE_ID,
    supplierId: SUPPLIER_ID,
    status: "confirmed",
    deliveryMethod: "hotel",
    deliveryLocationId: "mock_loc_1",
    deliveryTime: "2025-04-20T14:00:00.000Z",
    totalAmount: 36000,
    items: makeOrderItems([0, 1, 2], [1, 1, 1]),
    createdAt: "2025-04-19T11:00:00.000Z",
    updatedAt: "2025-04-19T12:00:00.000Z",
  },
  {
    _id: "mock_order_2",
    orderNo: "20250420-0002",
    tourId: "mock_tour_1",
    guideId: GUIDE_ID,
    supplierId: SUPPLIER_ID,
    status: "pending",
    deliveryMethod: "pickup",
    deliveryLocationId: "mock_loc_3",
    deliveryTime: "2025-04-20T16:00:00.000Z",
    totalAmount: 24000,
    items: makeOrderItems([3, 4], [1, 1]),
    createdAt: "2025-04-19T13:00:00.000Z",
    updatedAt: "2025-04-19T13:00:00.000Z",
  },
  {
    _id: "mock_order_3",
    orderNo: "20250421-0001",
    tourId: "mock_tour_2",
    guideId: GUIDE_ID,
    supplierId: SUPPLIER_ID,
    status: "pending",
    deliveryMethod: "hotel",
    deliveryLocationId: "mock_loc_2",
    deliveryTime: "2025-04-21T12:00:00.000Z",
    totalAmount: 48000,
    items: makeOrderItems([0, 5, 6, 1], [1, 1, 1, 1]),
    createdAt: "2025-04-20T09:00:00.000Z",
    updatedAt: "2025-04-20T09:00:00.000Z",
  },
  {
    _id: "mock_order_4",
    orderNo: "20250421-0002",
    tourId: "mock_tour_2",
    guideId: GUIDE_ID,
    supplierId: SUPPLIER_ID,
    status: "pending",
    deliveryMethod: "pickup",
    deliveryLocationId: "mock_loc_4",
    deliveryTime: "2025-04-21T15:00:00.000Z",
    totalAmount: 12000,
    items: makeOrderItems([2], [1]),
    createdAt: "2025-04-20T10:00:00.000Z",
    updatedAt: "2025-04-20T10:00:00.000Z",
  },
  {
    _id: "mock_order_5",
    orderNo: "20250418-0001",
    tourId: "mock_tour_3",
    guideId: GUIDE_ID,
    supplierId: SUPPLIER_ID,
    status: "delivered",
    deliveryMethod: "hotel",
    deliveryLocationId: "mock_loc_1",
    deliveryTime: "2025-04-18T14:00:00.000Z",
    totalAmount: 24000,
    items: makeOrderItems([4, 6], [1, 1]),
    createdAt: "2025-04-17T10:00:00.000Z",
    updatedAt: "2025-04-18T15:00:00.000Z",
  },
];

const MOCK_DELIVERY_LOCATIONS: DeliveryLocation[] = [
  {
    _id: "mock_loc_1",
    name: "桂林漓江大瀑布饭店",
    type: "hotel",
    address: "桂林市象山区杉湖北路1号",
    contactPhone: "0773-2822881",
    isActive: true,
    usageCount: 12,
  },
  {
    _id: "mock_loc_2",
    name: "桂林香格里拉大酒店",
    type: "hotel",
    address: "桂林市象山区杉湖南路111号",
    contactPhone: "0773-2269888",
    isActive: true,
    usageCount: 8,
  },
  {
    _id: "mock_loc_3",
    name: "象鼻山景区取货点",
    type: "pickup_point",
    address: "桂林市象山区滨江路1号象鼻山景区南门",
    contactPhone: "13800003333",
    isActive: true,
    usageCount: 5,
  },
  {
    _id: "mock_loc_4",
    name: "两江四湖游船码头取货点",
    type: "pickup_point",
    address: "桂林市秀峰区文昌桥码头",
    contactPhone: "13800004444",
    isActive: true,
    usageCount: 3,
  },
];

export function seedMockData(): void {
  // Users
  for (const u of MOCK_USERS) {
    seedRecord(Collections.USERS, { ...u });
  }

  // Products (from INITIAL_PRODUCTS with generated _id)
  INITIAL_PRODUCTS.forEach((p, i) => {
    seedRecord(Collections.PRODUCTS, { _id: `mock_product_${i + 1}`, ...p });
  });

  // Tours
  for (const t of MOCK_TOURS) {
    seedRecord(Collections.TOURS, { ...t });
  }

  // Orders
  for (const o of MOCK_ORDERS) {
    seedRecord(Collections.ORDERS, { ...o });
  }

  // Delivery locations
  for (const loc of MOCK_DELIVERY_LOCATIONS) {
    seedRecord(Collections.DELIVERY_LOCATIONS, { ...loc });
  }
}
