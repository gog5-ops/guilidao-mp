import Taro from "@tarojs/taro";

const cloud = Taro.cloud;

export function initCloud() {
  cloud.init({ traceUser: true });
}

export function db() {
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
} as const;
