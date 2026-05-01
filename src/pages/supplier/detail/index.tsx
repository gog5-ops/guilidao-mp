import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getOrder, updateOrderStatus, addOrderNote, getOrderNotes } from "../../../services/order";
import type { Order, OrderNote } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

export default function SupplierDetail() {
  const router = useRouter();
  const orderId = router.params.id || "";
  const { user } = useAppStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [orderData, notesData] = await Promise.all([
      getOrder(orderId),
      getOrderNotes(orderId),
    ]);
    setOrder(orderData);
    setNotes(notesData);
  }

  async function handleAccept() {
    const result = await Taro.showModal({
      title: "确认接单",
      content: "确认接受此订单？",
    });
    if (!result.confirm) return;
    await updateOrderStatus(orderId, "confirmed");
    loadData();
    Taro.showToast({ title: "已接单", icon: "success" });
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: "请填写拒单原因", icon: "none" });
      return;
    }
    await updateOrderStatus(orderId, "rejected");
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
      title: "标记发货",
      content: "确认已发出商品？",
    });
    if (!result.confirm) return;
    await updateOrderStatus(orderId, "shipping");
    loadData();
    Taro.showToast({ title: "已标记发货", icon: "success" });
  }

  async function handleSendNote() {
    if (!noteText.trim() || !user) return;
    await addOrderNote({
      orderId,
      userId: user._id,
      role: "supplier",
      userName: user.name,
      content: noteText.trim(),
      createdAt: new Date().toISOString(),
    });
    setNoteText("");
    const updated = await getOrderNotes(orderId);
    setNotes(updated);
  }

  if (!order) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="status-banner">
        <Text className={`status-text status-${order.status}`}>
          {ORDER_STATUS_MAP[order.status]}
        </Text>
        <Text className="order-no">白单 #{order.orderNo}</Text>
      </View>

      <View className="card">
        <Text className="card-title">商品清单</Text>
        {order.items.map((item) => (
          <View key={item.productId} className="item-row">
            <Text className="item-name">{item.productName}</Text>
            <Text className="item-qty">×{item.quantity}套</Text>
          </View>
        ))}
        <View className="item-total">
          <Text>合计：{order.items.reduce((s, i) => s + i.quantity, 0)}套</Text>
        </View>
      </View>

      <View className="card">
        <Text className="card-title">配送信息</Text>
        <View className="info-row">
          <Text className="info-label">方式</Text>
          <Text>{DELIVERY_METHOD_MAP[order.deliveryMethod]}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">地址</Text>
          <Text>{order.deliveryAddress}</Text>
        </View>
        {order.deliveryTime && (
          <View className="info-row">
            <Text className="info-label">时间</Text>
            <Text>{order.deliveryTime}</Text>
          </View>
        )}
      </View>

      {order.status === "pending" && (
        <View className="action-group">
          <Button className="btn-accept" onClick={handleAccept}>
            接单
          </Button>
          <Button className="btn-reject" onClick={() => setShowReject(true)}>
            拒单
          </Button>
        </View>
      )}

      {showReject && (
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

      {order.status === "confirmed" && (
        <Button className="btn-ship" onClick={handleShip}>
          标记已发货
        </Button>
      )}

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
