import { collection, Collections } from "./db";
import type { Product } from "../types";

export async function getProducts(): Promise<Product[]> {
  const { data } = await collection(Collections.PRODUCTS)
    .where({ isActive: true })
    .orderBy("sortOrder", "asc")
    .get();
  return data as unknown as Product[];
}

/** Return ALL products (active + inactive), ordered by sortOrder. Admin use. */
export async function getAllProducts(): Promise<Product[]> {
  const { data } = await collection(Collections.PRODUCTS)
    .orderBy("sortOrder", "asc")
    .get();
  return data as unknown as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data } = await collection(Collections.PRODUCTS).doc(id).get();
  return (data as unknown as Product) ?? null;
}

export async function createProduct(
  product: Omit<Product, "_id">
): Promise<string> {
  const now = new Date().toISOString();
  const { _id } = await collection(Collections.PRODUCTS).add({
    data: { ...product, createdAt: now, updatedAt: now },
  });
  return _id;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  await collection(Collections.PRODUCTS)
    .doc(id)
    .update({ data: { ...data, updatedAt: new Date().toISOString() } });
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await collection(Collections.PRODUCTS)
    .doc(id)
    .update({ data: { isActive, updatedAt: new Date().toISOString() } });
}

export const INITIAL_PRODUCTS: Omit<Product, "_id">[] = [
  {
    name: "罗汉果",
    description:
      "好果源自地道产地，来自罗汉果之乡——广西桂林，精选原料无添加。",
    spec: "38克/盒",
    price: 12000,
    unit: "4盒/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "桂圆肉",
    description:
      '桂圆别名"龙眼"，源于广西核心产区，从源头把控的好品质，肉厚无核留香。',
    spec: "136克/瓶",
    price: 12000,
    unit: "3瓶/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "海苔卷",
    description: "内含多种丰富的维生素和微量元素，同时含有丰富的铁元素。",
    spec: "140克/盒",
    price: 12000,
    unit: "4盒/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "金桂酥",
    description: "甄选优质食材、手工烘焙制作，口感酥脆鲜香搭配香酥口的芝麻。",
    spec: "165克/盒",
    price: 12000,
    unit: "4盒/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "桂花糕",
    description: "纯手工制作、零添加，口感软糯香甜，一种老少皆宜的美食。",
    spec: "160克/盒",
    price: 12000,
    unit: "4盒/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "漓江醉鱼",
    description:
      "桂林山水甲天下，漓江山水甲桂林，漓江醉鱼，纯大自然的馈赠，纯净水更无任何污染。",
    spec: "150克/袋",
    price: 12000,
    unit: "4袋/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "觅山鸡",
    description:
      "觅山鸡作为一种高蛋白且低脂肪的食品，被尊称为'禽类中的极致瑰宝'。",
    spec: "128克/袋",
    price: 12000,
    unit: "4袋/套",
    imageUrl: "",
    isActive: true,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
