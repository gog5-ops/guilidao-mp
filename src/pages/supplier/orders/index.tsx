import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
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
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  async function loadOrders() {
    const data = await getOrdersByStatus(activeTab);
    setOrders(data);
  }

  function handleDetail(orderId: string) {
    Taro.navigateTo({
      url: `/pages/supplier/detail/index?id=${orderId}`,
    });
  }

  return (
    <View className="page">
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
                ¥{(order.totalAmount / 100).toFixed(0)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
