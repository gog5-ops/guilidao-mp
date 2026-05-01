import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getSupplierOrdersByStatus } from "../../../services/supplier-order";
import type { SupplierOrder, OrderStatus } from "../../../types";
import { ORDER_STATUS_MAP } from "../../../types";
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
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useDidShow(() => {
    loadOrders();
  });

  async function loadOrders() {
    const data = await getSupplierOrdersByStatus(activeTab);
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
              <Text className="order-no">团次 {order.tourCode}</Text>
              <Text className="order-time">{order.tourDate}</Text>
            </View>
            <View className="order-meta">
              <Text className="guide-name">导游：{order.guideName}</Text>
              <Text className="slip-count">{order.whiteSlipIds.length}张白单</Text>
            </View>
            <View className="order-footer">
              <Text className="status-tag">{ORDER_STATUS_MAP[order.status]}</Text>
              <Text className="amount">{order.totalQuantity}套</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
