import Taro from "@tarojs/taro";
import { mockDatabase, restoreFromStorage, persistAll } from "./mock-db";

const isH5 = process.env.TARO_ENV === "h5";

const cloud = Taro.cloud;

export function initCloud() {
  if (isH5) {
    const restored = restoreFromStorage();
    if (restored) {
      console.log("[mock-db] H5 mode: restored from localStorage");
    } else {
      const { seedMockData } = require("./mock-data");
      seedMockData();
      persistAll();
      console.log("[mock-db] H5 mode: mock data seeded + persisted");
    }
    return;
  }
  cloud.init({ traceUser: true });
}

export function db() {
  if (isH5) {
    return mockDatabase() as unknown as ReturnType<typeof cloud.database>;
  }
  return cloud.database();
}

export function collection(name: string) {
  return db().collection(name);
}

export const Collections = {
  USERS: "users",
  PRODUCTS: "products",
  TOURS: "tours",
  ORDERS: "orders",
  ORDER_NOTES: "order_notes",
  DELIVERY_LOCATIONS: "delivery_locations",
  RED_SLIPS: "red_slips",
  SUPPLIER_ORDERS: "supplier_orders",
  WHITE_SLIPS: "white_slips",
} as const;
