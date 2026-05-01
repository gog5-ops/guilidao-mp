import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getOrder, updateOrderStatus, addOrderNote, getOrderNotes } from "../../../services/order";
import type { Order, OrderNote } from "../../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

export default function OrderDetail() {
  const router = useRouter();
  const orderId = router.params.id || "";
  const { user } = useAppStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [noteText, setNoteText] = useState("");

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

  async function handleConfirmReceive() {
    const result = await Taro.showModal({
      title: "确认收货",
      content: "确认已收到商品？",
    });
    if (!result.confirm) return;
    await updateOrderStatus(orderId, "delivered");
    loadData();
    Taro.showToast({ title: "已确认收货", icon: "success" });
  }

  async function handleSendNote() {
    if (!noteText.trim() || !user || !order) return;
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

  function handleEditAddress() {
    Taro.navigateTo({
      url: `/pages/delivery/index?orderId=${orderId}`,
    });
  }

  if (!order) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const canReceive = user?.role === "guide" && order.status === "shipping";
  const canEditAddress = user?.role === "guide" && !["delivered", "rejected"].includes(order.status);

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
            <Text className="item-price">¥{(item.subtotal / 100).toFixed(0)}</Text>
          </View>
        ))}
        <View className="item-total">
          <Text>合计</Text>
          <Text className="total-price">¥{(order.totalAmount / 100).toFixed(0)}</Text>
        </View>
      </View>

      <View className="card">
        <View className="card-header">
          <Text className="card-title">配送信息</Text>
          {canEditAddress && (
            <Text className="edit-link" onClick={handleEditAddress}>修改</Text>
          )}
        </View>
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

      {canReceive && (
        <Button className="btn-receive" onClick={handleConfirmReceive}>
          确认收货
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
