import { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter, useDidShow } from "@tarojs/taro";
import { getTour, updateTourStatus } from "../../../services/tour";
import { getOrdersByTour, updateOrderStatus } from "../../../services/order";
import { createSupplierOrder } from "../../../services/supplier-order";
import { getUserById } from "../../../services/user";
import type { Tour, Order } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

export default function TourDetail() {
  const router = useRouter();
  const tourId = router.params.id || "";
  const [tour, setTour] = useState<Tour | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useDidShow(() => {
    loadData();
  });

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

  function handleShowConfirm() {
    if (!tour || orders.length === 0) return;
    if (tour.status !== "draft") {
      Taro.showToast({ title: "该团次已提交", icon: "none" });
      return;
    }
    setShowConfirm(true);
  }

  async function handleBatchSubmit() {
    setSubmitting(true);
    try {
      await Promise.all(
        orders.map((order) => updateOrderStatus(order._id, "pending"))
      );
      await updateTourStatus(tourId, "submitted");

      // Create a SupplierOrder aggregating all white slips
      if (tour) {
        const guide = await getUserById(tour.guideId);
        const totalQuantity = orders.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
          0
        );
        const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const now = new Date().toISOString();
        await createSupplierOrder({
          tourId: tour._id,
          tourCode: tour.tourCode,
          tourDate: tour.date,
          guideId: tour.guideId,
          guideName: guide?.name || "",
          guidePhone: guide?.phone || "",
          supplierId: "",
          status: "pending",
          whiteSlipIds: orders.map((o) => o._id),
          totalQuantity,
          totalAmount,
          createdAt: now,
          updatedAt: now,
        });
      }

      setShowConfirm(false);
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

  const tourTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

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

      {tour.status === "draft" && orders.length > 0 && !showConfirm && (
        <View className="submit-section">
          <Button
            className="btn-submit"
            onClick={handleShowConfirm}
          >
            一键提交给供货商
          </Button>
        </View>
      )}

      {showConfirm && (
        <View className="card" style={{ border: "2px solid #8B5E3C" }}>
          <Text className="card-title" style={{ color: "#8B5E3C" }}>确认提交给供货商</Text>
          <Text style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            共 {orders.length} 个白单，请确认以下订单信息：
          </Text>
          {orders.map((order) => (
            <View key={order._id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "bold", fontSize: "14px" }}>白单 #{order.orderNo}</Text>
                <Text style={{ color: "#8B5E3C", fontWeight: "bold" }}>¥{(order.totalAmount / 100).toFixed(0)}</Text>
              </View>
              <Text style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                {order.items.map((i) => `${i.productName}x${i.quantity}`).join("  ")}
              </Text>
            </View>
          ))}
          <View style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", fontWeight: "bold" }}>
            <Text>合计</Text>
            <Text style={{ color: "#8B5E3C", fontSize: "16px" }}>¥{(tourTotal / 100).toFixed(0)}</Text>
          </View>
          <View style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <Button
              style={{ flex: 1, background: "#eee", color: "#333", border: "none", borderRadius: "8px" }}
              onClick={() => setShowConfirm(false)}
            >
              取消
            </Button>
            <Button
              style={{ flex: 1, background: "#8B5E3C", color: "#fff", border: "none", borderRadius: "8px" }}
              onClick={handleBatchSubmit}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "确认提交"}
            </Button>
          </View>
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
                  {order.items.map((i) => `${i.productName}x${i.quantity}`).join("  ")}
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
        {orders.length > 0 && (
          <View className="tour-total">
            <Text>团次总金额：</Text>
            <Text className="tour-total-amount">¥{(tourTotal / 100).toFixed(0)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
