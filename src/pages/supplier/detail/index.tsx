import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { addOrderNote, getOrderNotes } from "../../../services/order";
import {
  getSupplierOrder,
  updateSupplierOrderStatus,
  updateTrackingNumber,
  updateAfterSalesStatus,
} from "../../../services/supplier-order";
import { getWhiteSlip } from "../../../services/white-slip";
import { getUserById } from "../../../services/user";
import type { SupplierOrder, WhiteSlip, GuestEntry, OrderNote, User } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP, AFTER_SALES_STATUS_MAP } from "../../../types";
import "./index.css";

export default function SupplierDetail() {
  const router = useRouter();
  const orderId = router.params.id || "";
  const { user } = useAppStore();

  const [supplierOrder, setSupplierOrder] = useState<SupplierOrder | null>(null);
  const [whiteSlip, setWhiteSlip] = useState<WhiteSlip | null>(null);
  const [guide, setGuide] = useState<User | null>(null);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [trackingNo, setTrackingNo] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const so = await getSupplierOrder(orderId);
    setSupplierOrder(so);
    if (!so) return;

    // Load white slip (first whiteSlipId is the WhiteSlip document)
    if (so.whiteSlipIds.length > 0) {
      const slip = await getWhiteSlip(so.whiteSlipIds[0]);
      setWhiteSlip(slip);
    }

    // Load guide info
    const guideData = await getUserById(so.guideId);
    setGuide(guideData);

    // Load notes
    const notesData = await getOrderNotes(orderId);
    setNotes(notesData);

    if (so.trackingNumber) {
      setTrackingNo(so.trackingNumber);
    }
  }

  async function handleAccept() {
    const result = await Taro.showModal({
      title: "确认接单",
      content: "确认接受此订单？",
    });
    if (!result.confirm) return;
    await updateSupplierOrderStatus(orderId, "confirmed");
    loadData();
    Taro.showToast({ title: "已接单", icon: "success" });
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: "请填写拒单原因", icon: "none" });
      return;
    }
    await updateSupplierOrderStatus(orderId, "rejected");
    if (user) {
      await addOrderNote({
        orderId,
        userId: user._id,
        role: "supplier",
        userName: user.name,
        content: `拒单原因：${rejectReason.trim()}`,
        createdAt: new Date().toISOString(),
      });
    }
    loadData();
    setShowReject(false);
    Taro.showToast({ title: "已拒单", icon: "none" });
  }

  async function handleShip() {
    const result = await Taro.showModal({
      title: "标记全部发货",
      content: "确认所有商品已全部发出？",
    });
    if (!result.confirm) return;
    await updateSupplierOrderStatus(orderId, "shipping");
    loadData();
    Taro.showToast({ title: "已标记全部发货", icon: "success" });
  }

  async function handlePartialShip() {
    const result = await Taro.showModal({
      title: "标记部分发货",
      content: "送货部分已发出，快递部分尚未发出？",
    });
    if (!result.confirm) return;
    await updateSupplierOrderStatus(orderId, "partially_shipped");
    loadData();
    Taro.showToast({ title: "已标记部分发货", icon: "success" });
  }

  async function handleRequestAfterSales() {
    const result = await Taro.showModal({
      title: "申请售后",
      content: "确认申请售后服务？",
    });
    if (!result.confirm) return;
    await updateAfterSalesStatus(orderId, "requested");
    loadData();
    Taro.showToast({ title: "售后申请已提交", icon: "success" });
  }

  async function handleSaveTracking() {
    if (!trackingNo.trim()) {
      Taro.showToast({ title: "请输入快递单号", icon: "none" });
      return;
    }
    await updateTrackingNumber(orderId, trackingNo.trim());
    Taro.showToast({ title: "已保存快递单号", icon: "success" });
  }

  async function handleSendNote() {
    if (!noteText.trim() || !user) return;
    await addOrderNote({
      orderId,
      userId: user._id,
      role: user.role,
      userName: user.name,
      content: noteText.trim(),
      createdAt: new Date().toISOString(),
    });
    setNoteText("");
    const updated = await getOrderNotes(orderId);
    setNotes(updated);
  }

  if (!supplierOrder) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const entries: GuestEntry[] = whiteSlip?.entries || [];
  const aggQuantity = entries.reduce(
    (sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const hasExpressEntries = entries.some((e) => e.deliveryMethod === "express");
  const isAdmin = user?.role === "admin";

  return (
    <View className="page">
      <View className="status-banner">
        <Text className={`status-text status-${supplierOrder.status}`}>
          {ORDER_STATUS_MAP[supplierOrder.status]}
        </Text>
        <Text className="order-no">团次 {supplierOrder.tourCode}</Text>
      </View>

      {/* Tour info */}
      <View className="card">
        <Text className="card-title">团次信息</Text>
        <View className="info-row">
          <Text className="info-label">团号</Text>
          <Text>{supplierOrder.tourCode}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">日期</Text>
          <Text>{supplierOrder.tourDate}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">游客数</Text>
          <Text>{entries.length}人</Text>
        </View>
      </View>

      {/* Guide info */}
      {guide && (
        <View className="card">
          <Text className="card-title">导游信息</Text>
          <View className="info-row">
            <Text className="info-label">姓名</Text>
            <Text>{guide.name}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">手机号</Text>
            <Text
              style={{ color: "#8B5E3C", textDecoration: "underline" }}
              onClick={() => {
                if (process.env.TARO_ENV !== "h5") {
                  Taro.makePhoneCall({ phoneNumber: guide.phone });
                }
              }}
            >
              {guide.phone}
            </Text>
          </View>
          {guide.wechatId && (
            <View className="info-row">
              <Text className="info-label">微信号</Text>
              <Text>{guide.wechatId}</Text>
            </View>
          )}
        </View>
      )}

      {/* Default delivery address */}
      {whiteSlip?.defaultAddress && (
        <View className="card">
          <Text className="card-title">默认送货地址</Text>
          <Text style={{ fontSize: "28px", color: "#333" }}>{whiteSlip.defaultAddress}</Text>
        </View>
      )}

      {/* White slip entries grouped by guest */}
      <View className="card">
        <Text className="card-title">白单明细（按游客分组）</Text>
        {entries.map((entry) => (
          <View key={entry.guestNo} className="guest-group">
            <Text className="guest-header">游客 {entry.guestNo}</Text>
            <View className="slip-block">
              {entry.items.map((item) => (
                <View key={item.productId} className="item-row">
                  <Text className="item-name">{item.productName}</Text>
                  <Text className="item-qty">x{item.quantity}套</Text>
                </View>
              ))}
              <View className="slip-delivery">
                <Text className="delivery-label">
                  {DELIVERY_METHOD_MAP[entry.deliveryMethod]}
                </Text>
                {entry.deliveryMethod === "express" && entry.deliveryAddress && (
                  <Text className="delivery-addr">{entry.deliveryAddress}</Text>
                )}
              </View>
              {entry.remark && (
                <View style={{ marginTop: "8px" }}>
                  <Text style={{ fontSize: "24px", color: "#999" }}>备注：{entry.remark}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
        <View className="item-total">
          <Text>合计：{aggQuantity}套</Text>
        </View>
      </View>

      {/* Overall order status info */}
      <View className="card">
        <Text className="card-title">订单状态</Text>
        <View className="info-row">
          <Text className="info-label">状态</Text>
          <Text className={`status-${supplierOrder.status}`}>
            {ORDER_STATUS_MAP[supplierOrder.status]}
          </Text>
        </View>
        {supplierOrder.trackingNumber && (
          <View className="info-row">
            <Text className="info-label">快递单号</Text>
            <Text>{supplierOrder.trackingNumber}</Text>
          </View>
        )}
      </View>

      {/* Tracking number for express orders when confirmed */}
      {!isAdmin && supplierOrder.status === "confirmed" && hasExpressEntries && (
        <View className="card">
          <Text className="card-title">快递单号</Text>
          <Input
            className="input"
            value={trackingNo}
            onInput={(e) => setTrackingNo(e.detail.value)}
            placeholder="请输入快递单号"
          />
          <Button className="btn-save-tracking" onClick={handleSaveTracking}>
            保存
          </Button>
        </View>
      )}

      {/* Action buttons */}
      {!isAdmin && supplierOrder.status === "pending" && (
        <View className="action-group">
          <Button className="btn-accept" onClick={handleAccept}>
            接单
          </Button>
          <Button className="btn-reject" onClick={() => setShowReject(true)}>
            拒单
          </Button>
        </View>
      )}

      {!isAdmin && showReject && (
        <View className="card">
          <Text className="card-title">拒单原因</Text>
          <Input
            className="input"
            value={rejectReason}
            onInput={(e) => setRejectReason(e.detail.value)}
            placeholder="请说明拒单原因（如缺货）"
          />
          <Button className="btn-confirm-reject" onClick={handleReject}>
            确认拒单
          </Button>
        </View>
      )}

      {!isAdmin && supplierOrder.status === "confirmed" && (
        <View style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <Button className="btn-ship" style={{ flex: 1, marginBottom: 0 }} onClick={handleShip}>
            标记全部发货
          </Button>
          {hasExpressEntries && (
            <Button
              style={{
                flex: 1,
                background: "#F57F17",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "28px",
                padding: "24px 0",
              }}
              onClick={handlePartialShip}
            >
              标记部分发货
            </Button>
          )}
        </View>
      )}

      {/* Partial shipped: allow marking full shipment */}
      {!isAdmin && supplierOrder.status === "partially_shipped" && (
        <Button className="btn-ship" onClick={handleShip}>
          标记全部发货
        </Button>
      )}

      {/* After-sales button: visible when delivered */}
      {!isAdmin && supplierOrder.status === "delivered" && (
        <View className="card">
          <Text className="card-title">售后服务</Text>
          {(!supplierOrder.afterSalesStatus || supplierOrder.afterSalesStatus === "none") ? (
            <Button
              style={{
                background: "#E65100",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "28px",
                padding: "16px 0",
              }}
              onClick={handleRequestAfterSales}
            >
              申请售后
            </Button>
          ) : (
            <View style={{ padding: "12px", background: "#FFF3E0", borderRadius: "8px" }}>
              <Text style={{ fontSize: "28px", color: "#E65100" }}>
                售后状态: {AFTER_SALES_STATUS_MAP[supplierOrder.afterSalesStatus]}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      <View className="card">
        <Text className="card-title">备注留言 ({notes.length})</Text>
        {notes.map((note) => (
          <View key={note._id} className="note-item">
            <View className="note-header">
              <Text className="note-user">{note.userName}</Text>
              <Text className="note-time">
                {new Date(note.createdAt).toLocaleString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text className="note-content">{note.content}</Text>
          </View>
        ))}
        <View className="note-input">
          <Input
            className="input"
            value={noteText}
            onInput={(e) => setNoteText(e.detail.value)}
            placeholder="输入备注..."
            confirmType="send"
            onConfirm={handleSendNote}
          />
          <Button className="btn-send" onClick={handleSendNote}>
            发送
          </Button>
        </View>
      </View>
    </View>
  );
}
