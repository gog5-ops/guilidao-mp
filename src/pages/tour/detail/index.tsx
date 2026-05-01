import { useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter, useDidShow } from "@tarojs/taro";
import { getTour, updateTourStatus } from "../../../services/tour";
import { getWhiteSlipByTour, submitWhiteSlip, updateWhiteSlip } from "../../../services/white-slip";
import { createSupplierOrder, getSupplierOrderByTour, deleteSupplierOrder } from "../../../services/supplier-order";
import { getUserById } from "../../../services/user";
import type { Tour, WhiteSlip, SupplierOrder } from "../../../types";
import { DELIVERY_METHOD_MAP, ORDER_STATUS_MAP } from "../../../types";
import "./index.css";

export default function TourDetail() {
  const router = useRouter();
  const tourId = router.params.id || "";
  const [tour, setTour] = useState<Tour | null>(null);
  const [whiteSlip, setWhiteSlip] = useState<WhiteSlip | null>(null);
  const [supplierOrder, setSupplierOrder] = useState<SupplierOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useDidShow(() => {
    loadData();
  });

  async function loadData() {
    const [tourData, slipData, soData] = await Promise.all([
      getTour(tourId),
      getWhiteSlipByTour(tourId),
      getSupplierOrderByTour(tourId),
    ]);
    setTour(tourData);
    setWhiteSlip(slipData);
    setSupplierOrder(soData);
  }

  function handleEditWhiteSlip() {
    Taro.navigateTo({
      url: `/pages/white-slip/edit/index?tourId=${tourId}`,
    });
  }

  function handleSummary() {
    Taro.navigateTo({
      url: `/pages/order/summary/index?tourId=${tourId}`,
    });
  }

  function handleShowConfirm() {
    if (!tour || !whiteSlip || whiteSlip.entries.length === 0) return;
    if (tour.status !== "draft") {
      Taro.showToast({ title: "该团次已提交", icon: "none" });
      return;
    }
    // Validate: guests with express delivery must have address
    const missingAddr = whiteSlip.entries.filter(
      (e) => e.deliveryMethod === "express" && !e.deliveryAddress?.trim()
    );
    if (missingAddr.length > 0) {
      const nos = missingAddr.map((e) => e.guestNo).join(", ");
      Taro.showToast({
        title: `游客 ${nos} 选择快递但未填收货地址`,
        icon: "none",
        duration: 3000,
      });
      return;
    }
    setShowConfirm(true);
  }

  async function handleBatchSubmit() {
    if (!whiteSlip || !tour) return;
    setSubmitting(true);
    try {
      await submitWhiteSlip(whiteSlip._id);
      await updateTourStatus(tourId, "submitted");

      // Create a SupplierOrder
      const guide = await getUserById(tour.guideId);
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
        whiteSlipIds: [whiteSlip._id],
        totalQuantity: whiteSlip.totalQuantity,
        totalAmount: whiteSlip.totalAmount,
        createdAt: now,
        updatedAt: now,
      });

      setShowConfirm(false);
      Taro.showToast({ title: "提交成功", icon: "success" });
      await loadData();
    } catch {
      Taro.showToast({ title: "提交失败，请重试", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResubmit() {
    if (!whiteSlip || !supplierOrder) return;
    const result = await Taro.showModal({
      title: "修改并重新提交",
      content: "将白单恢复为草稿状态，您可以编辑后重新提交。",
    });
    if (!result.confirm) return;
    try {
      await updateWhiteSlip(whiteSlip._id, { status: "draft" });
      await deleteSupplierOrder(supplierOrder._id);
      await updateTourStatus(tourId, "draft");
      Taro.showToast({ title: "已恢复为草稿", icon: "success" });
      await loadData();
    } catch {
      Taro.showToast({ title: "操作失败，请重试", icon: "none" });
    }
  }

  if (!tour) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const hasSlip = whiteSlip && whiteSlip.entries.length > 0;

  return (
    <View className="page">
      <View className="back-bar" onClick={() => Taro.navigateBack()}>
        <Text className="back-arrow">&larr; 返回</Text>
      </View>
      <View className="tour-header">
        <Text className="tour-code">{tour.tourCode}</Text>
        <Text className="tour-date">{tour.date}</Text>
      </View>

      <View className="actions">
        <Button className="btn-primary" onClick={handleEditWhiteSlip}>
          {hasSlip ? "编辑白单" : "+ 新建白单"}
        </Button>
        {hasSlip && (
          <Button className="btn-outline" onClick={handleSummary}>
            查看汇总单
          </Button>
        )}
      </View>

      {tour.status === "draft" && hasSlip && !showConfirm && (
        <View className="submit-section">
          <Button className="btn-submit" onClick={handleShowConfirm}>
            一键提交给供货商
          </Button>
        </View>
      )}

      {showConfirm && whiteSlip && (
        <View className="card" style={{ border: "2px solid #8B5E3C" }}>
          <Text className="card-title" style={{ color: "#8B5E3C" }}>
            确认提交给供货商
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "12px",
              display: "block",
            }}
          >
            共 {whiteSlip.entries.length} 位游客，请确认以下订单信息：
          </Text>
          {whiteSlip.entries.map((entry) => {
            const entryTotal = entry.items.reduce(
              (s, i) => s + i.subtotal,
              0
            );
            return (
              <View
                key={entry.guestNo}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: "14px" }}>
                    游客 {entry.guestNo}
                  </Text>
                  <Text style={{ color: "#8B5E3C", fontWeight: "bold" }}>
                    ¥{(entryTotal / 100).toFixed(0)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {entry.items
                    .map((i) => `${i.productName}x${i.quantity}`)
                    .join("  ")}
                </Text>
              </View>
            );
          })}
          <View
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0 4px",
              fontWeight: "bold",
            }}
          >
            <Text>合计</Text>
            <Text style={{ color: "#8B5E3C", fontSize: "16px" }}>
              ¥{(whiteSlip.totalAmount / 100).toFixed(0)}
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <Button
              style={{
                flex: 1,
                background: "#eee",
                color: "#333",
                border: "none",
                borderRadius: "8px",
              }}
              onClick={() => setShowConfirm(false)}
            >
              取消
            </Button>
            <Button
              style={{
                flex: 1,
                background: "#8B5E3C",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
              }}
              onClick={handleBatchSubmit}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "确认提交"}
            </Button>
          </View>
        </View>
      )}

      {/* Supplier order status */}
      {supplierOrder && (
        <View className="card" style={{ marginBottom: "16px" }}>
          <Text className="card-title">供货商订单状态</Text>
          <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: "28px", color: "#333" }}>
              当前状态
            </Text>
            <Text className={`order-status status-${supplierOrder.status}`}>
              {ORDER_STATUS_MAP[supplierOrder.status]}
            </Text>
          </View>
          {supplierOrder.trackingNumber && (
            <View style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
              <Text style={{ fontSize: "26px", color: "#999" }}>快递单号</Text>
              <Text style={{ fontSize: "26px", color: "#333" }}>{supplierOrder.trackingNumber}</Text>
            </View>
          )}
        </View>
      )}

      {/* Resubmit button for rejected orders */}
      {supplierOrder?.status === "rejected" && (
        <View style={{ marginBottom: "24px" }}>
          <Button
            style={{
              width: "100%",
              background: "#E65100",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "30px",
              padding: "24px 0",
              fontWeight: "bold",
            }}
            onClick={handleResubmit}
          >
            修改并重新提交
          </Button>
        </View>
      )}

      {/* White slip summary */}
      <View className="section">
        <Text className="section-title">
          白单概况{hasSlip ? ` (${whiteSlip!.entries.length}位游客)` : ""}
        </Text>
        {!hasSlip ? (
          <View className="empty">
            <Text>暂无白单，点击上方新建</Text>
          </View>
        ) : (
          <>
            {whiteSlip!.entries.map((entry) => {
              const entryTotal = entry.items.reduce(
                (s, i) => s + i.subtotal,
                0
              );
              const itemCount = entry.items.reduce(
                (s, i) => s + i.quantity,
                0
              );
              return (
                <View key={entry.guestNo} className="order-card">
                  <View className="order-header">
                    <Text className="order-no">游客 {entry.guestNo}</Text>
                    <Text
                      className={`order-status ${
                        whiteSlip!.status === "submitted"
                          ? "status-confirmed"
                          : "status-pending"
                      }`}
                    >
                      {whiteSlip!.status === "submitted" ? "已提交" : "草稿"}
                    </Text>
                  </View>
                  <View className="order-info">
                    <Text className="order-items">
                      {entry.items
                        .map((i) => `${i.productName}x${i.quantity}`)
                        .join("  ")}
                    </Text>
                  </View>
                  <View className="order-footer">
                    <Text className="delivery">
                      {DELIVERY_METHOD_MAP[entry.deliveryMethod]}
                      {itemCount > 0 ? ` (${itemCount}套)` : ""}
                    </Text>
                    <Text className="amount">
                      ¥{(entryTotal / 100).toFixed(0)}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View className="tour-total">
              <Text>团次总金额：</Text>
              <Text className="tour-total-amount">
                ¥{(whiteSlip!.totalAmount / 100).toFixed(0)}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
