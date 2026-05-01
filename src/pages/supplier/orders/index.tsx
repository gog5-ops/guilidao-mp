import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getOrdersByStatus } from "../../../services/order";
import type { Order, OrderStatus } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

const TABS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "待发货" },
  { key: "shipping", label: "已发货" },
  { key: "delivered", label: "已完成" },
];

export default function SupplierOrders() {
  const { user, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useDidShow(() => {
    loadOrders();
  });

  async function loadOrders() {
    const data = await getOrdersByStatus(activeTab);
    setOrders(data);
  }

  function handleLogout() {
    setUser(null);
    Taro.reLaunch({ url: "/pages/index/index" });
  }

  function handleDetail(orderId: string) {
    Taro.navigateTo({
      url: `/pages/supplier/detail/index?id=${orderId}`,
    });
  }

  return (
    <View className="page">
      <View className="header-top">
        <Text className="welcome" onClick={() => Taro.navigateTo({ url: "/pages/profile/index" })}>你好，{user?.name || "供货商"} &gt;</Text>
        <Text className="btn-logout" onClick={handleLogout}>退出</Text>
      </View>
      <View className="tabs">
        {TABS.map((tab) => (
          <View
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {orders.length === 0 ? (
        <View className="empty">
          <Text>暂无{ORDER_STATUS_MAP[activeTab]}订单</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View
            key={order._id}
            className="order-card"
            onClick={() => handleDetail(order._id)}
          >
            <View className="order-header">
              <Text className="order-no">白单 #{order.orderNo}</Text>
              <Text className="order-time">
                {new Date(order.createdAt).toLocaleDateString("zh-CN")}
              </Text>
            </View>
            <Text className="order-items">
              {order.items.map((i) => `${i.productName}×${i.quantity}`).join("  ")}
            </Text>
            <View className="order-footer">
              <Text className="delivery">
                {DELIVERY_METHOD_MAP[order.deliveryMethod]}
                {order.deliveryAddress ? ` · ${order.deliveryAddress}` : ""}
              </Text>
              <Text className="amount">
                {order.items.reduce((s, i) => s + i.quantity, 0)}套
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
