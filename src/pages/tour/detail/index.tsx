import { useEffect, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getTour, updateTourStatus } from "../../../services/tour";
import { getOrdersByTour, updateOrderStatus } from "../../../services/order";
import type { Tour, Order } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

export default function TourDetail() {
  const router = useRouter();
  const tourId = router.params.id || "";
  const [tour, setTour] = useState<Tour | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [tourData, orderData] = await Promise.all([
      getTour(tourId),
      getOrdersByTour(tourId),
    ]);
    setTour(tourData);
    setOrders(orderData);
  }

  function handleNewOrder() {
    Taro.navigateTo({
      url: `/pages/order/create/index?tourId=${tourId}`,
    });
  }

  function handleOrderDetail(orderId: string) {
    Taro.navigateTo({
      url: `/pages/order/detail/index?id=${orderId}`,
    });
  }

  function handleSummary() {
    Taro.navigateTo({
      url: `/pages/order/summary/index?tourId=${tourId}`,
    });
  }

  async function handleBatchSubmit() {
    if (!tour || orders.length === 0) return;
    if (tour.status !== "draft") {
      Taro.showToast({ title: "该团次已提交", icon: "none" });
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: "确认提交",
        content: `将提交${orders.length}个白单给供货商，是否继续？`,
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await Promise.all(
        orders.map((order) => updateOrderStatus(order._id, "pending"))
      );
      await updateTourStatus(tourId, "submitted");
      Taro.showToast({ title: "提交成功", icon: "success" });
      await loadData();
    } catch {
      Taro.showToast({ title: "提交失败，请重试", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!tour) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="tour-header">
        <Text className="tour-code">{tour.tourCode}</Text>
        <Text className="tour-date">{tour.date}</Text>
      </View>

      <View className="actions">
        <Button className="btn-primary" onClick={handleNewOrder}>
          + 新增白单
        </Button>
        {orders.length > 0 && (
          <Button className="btn-outline" onClick={handleSummary}>
            查看汇总单
          </Button>
        )}
      </View>

      {tour.status === "draft" && orders.length > 0 && (
        <View className="submit-section">
          <Button
            className="btn-submit"
            onClick={handleBatchSubmit}
            disabled={submitting}
          >
            {submitting ? "提交中..." : "一键提交给供货商"}
          </Button>
        </View>
      )}

      <View className="section">
        <Text className="section-title">白单列表 ({orders.length})</Text>
        {orders.length === 0 ? (
          <View className="empty">
            <Text>暂无白单，点击上方新增</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order._id}
              className="order-card"
              onClick={() => handleOrderDetail(order._id)}
            >
              <View className="order-header">
                <Text className="order-no">白单 #{order.orderNo}</Text>
                <Text className={`order-status status-${order.status}`}>
                  {ORDER_STATUS_MAP[order.status]}
                </Text>
              </View>
              <View className="order-info">
                <Text className="order-items">
                  {order.items.map((i) => `${i.productName}×${i.quantity}`).join("  ")}
                </Text>
              </View>
              <View className="order-footer">
                <Text className="delivery">
                  {DELIVERY_METHOD_MAP[order.deliveryMethod]}
                </Text>
                <Text className="amount">¥{(order.totalAmount / 100).toFixed(0)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
