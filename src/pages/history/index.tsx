import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../store";
import { getSupplierOrders } from "../../services/supplier-order";
import type { SupplierOrder, OrderStatus } from "../../types";
import { ORDER_STATUS_MAP } from "../../types";
import "./index.css";

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipping",
  "partially_shipped",
];

export default function OrderHistory() {
  const { user } = useAppStore();
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadOrders();
  });

  async function loadOrders() {
    if (!user) return;
    setLoading(true);
    const all = await getSupplierOrders();
    const mine = all.filter((o) => o.guideId === user._id);
    setOrders(mine);
    setLoading(false);
  }

  if (loading) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const rejected = orders.filter((o) => o.status === "rejected");

  function handleOrderClick(order: SupplierOrder) {
    Taro.navigateTo({
      url: `/pages/tour/detail/index?id=${order.tourId}`,
    });
  }

  function renderOrderCard(order: SupplierOrder) {
    return (
      <View
        key={order._id}
        className="order-card"
        onClick={() => handleOrderClick(order)}
      >
        <View className="order-card-header">
          <Text className="order-tour-code">{order.tourCode}</Text>
          <Text className={`order-status status-${order.status}`}>
            {ORDER_STATUS_MAP[order.status]}
          </Text>
        </View>
        <View className="order-info">
          <Text className="order-date">{order.tourDate}</Text>
          <Text className="order-qty">{order.totalQuantity}套</Text>
          <Text className="order-amount">
            ¥{(order.totalAmount / 100).toFixed(0)}
          </Text>
        </View>
      </View>
    );
  }

  const hasOrders = orders.length > 0;

  return (
    <View className="page">
      <View className="back-bar" onClick={() => Taro.navigateBack()}>
        <Text className="back-arrow">&larr; 返回</Text>
      </View>
      <Text className="page-title">订单历史</Text>

      {!hasOrders ? (
        <View className="empty">
          <Text>暂无订单</Text>
        </View>
      ) : (
        <>
          {active.length > 0 && (
            <View className="section">
              <Text className="section-title">
                进行中 ({active.length})
              </Text>
              {active.map(renderOrderCard)}
            </View>
          )}

          {delivered.length > 0 && (
            <View className="section">
              <Text className="section-title">
                已完成 ({delivered.length})
              </Text>
              {delivered.map(renderOrderCard)}
            </View>
          )}

          {rejected.length > 0 && (
            <View className="section">
              <Text className="section-title">
                已拒单 ({rejected.length})
              </Text>
              {rejected.map(renderOrderCard)}
            </View>
          )}
        </>
      )}
    </View>
  );
}
