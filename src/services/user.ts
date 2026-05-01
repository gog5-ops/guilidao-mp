import Taro from "@tarojs/taro";
import { collection, Collections } from "./db";
import type { User, UserRole } from "../types";

export async function login(): Promise<{ openId: string }> {
  if (process.env.TARO_ENV === "h5") {
    return { openId: "mock_openid_guide" };
  }
  const { result } = await Taro.cloud.callFunction({ name: "login" });
  return result as { openId: string };
}

export async function getUser(openId: string): Promise<User | null> {
  const { data } = await collection(Collections.USERS)
    .where({ openId })
    .get();
  if (data.length === 0) return null;
  return data[0] as unknown as User;
}

export async function createUser(
  openId: string,
  role: UserRole,
  name: string,
  phone: string
): Promise<string> {
  const { _id } = await collection(Collections.USERS).add({
    data: {
      openId,
      role,
      name,
      phone,
      wechatId: "",
      createdAt: new Date().toISOString(),
    },
  });
  return _id as string;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data } = await collection(Collections.USERS)
    .where({ phone })
    .get();
  if (data.length === 0) return null;
  return data[0] as unknown as User;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "phone" | "wechatId">>
): Promise<void> {
  await collection(Collections.USERS).doc(id).update({ data });
}
