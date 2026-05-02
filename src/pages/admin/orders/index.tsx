import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import {
  getSupplierOrders,
  updateSupplierOrderStatus,
  updateTrackingNumber,
  updateAfterSalesStatus,
} from "../../../services/supplier-order";
import { getWhiteSlip } from "../../../services/white-slip";
import { addOrderNote, getOrderNotes } from "../../../services/order";
import type {
  SupplierOrder,
  OrderStatus,
  AfterSalesStatus,
  WhiteSlip,
  OrderNote,
} from "../../../types";
import {
  ORDER_STATUS_MAP,
  AFTER_SALES_STATUS_MAP,
  DELIVERY_METHOD_MAP,
} from "../../../types";
import "./index.css";

type StatusFilter = "all" | OrderStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "已确认" },
  { key: "partially_shipped", label: "部分发货" },
  { key: "shipping", label: "配送中" },
  { key: "delivered", label: "已送达" },
  { key: "rejected", label: "已拒单" },
];

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "partially_shipped",
  "shipping",
  "delivered",
  "rejected",
];

const AFTER_SALES_OPTIONS: AfterSalesStatus[] = [
  "none",
  "requested",
  "processing",
  "resolved",
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getQuickDateRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = formatDate(now);
  switch (preset) {
    case "today":
      return { start: end, end };
    case "week": {
      const day = now.getDay() || 7;
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - day + 1
      );
      return { start: formatDate(startDate), end };
    }
    case "month": {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(startDate), end };
    }
    default:
      return { start: "", end: "" };
  }
}

export default function AdminOrdersPage() {
  const { user } = useAppStore();

  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Per-order expanded state
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(
    new Set()
  );
  const [expandedSlips, setExpandedSlips] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Loaded white slips cache: orderId -> WhiteSlip
  const [whiteSlips, setWhiteSlips] = useState<Record<string, WhiteSlip>>({});
  // Loaded notes cache: orderId -> OrderNote[]
  const [notesCache, setNotesCache] = useState<Record<string, OrderNote[]>>({});

  // Per-order tracking number edit state
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>(
    {}
  );
  // Per-order note input
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  async function loadData() {
    const data = await getSupplierOrders();
    setSupplierOrders(data);
  }

  // Toggle helpers
  function toggleExpand(
    set: Set<string>,
    setter: (s: Set<string>) => void,
    id: string
  ) {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setter(next);
  }

  // Load white slip when expanding
  const loadWhiteSlip = useCallback(
    async (order: SupplierOrder) => {
      if (whiteSlips[order._id]) return;
      if (order.whiteSlipIds.length === 0) return;
      const slip = await getWhiteSlip(order.whiteSlipIds[0]);
      if (slip) {
        setWhiteSlips((prev) => ({ ...prev, [order._id]: slip }));
      }
    },
    [whiteSlips]
  );

  // Load notes when expanding
  const loadNotes = useCallback(
    async (orderId: string) => {
      const data = await getOrderNotes(orderId);
      setNotesCache((prev) => ({ ...prev, [orderId]: data }));
    },
    []
  );

  // Admin actions
  async function handleChangeStatus(soId: string, newStatus: OrderStatus) {
    await updateSupplierOrderStatus(soId, newStatus);
    await loadData();
    Taro.showToast({ title: "状态已更新", icon: "success" });
  }

  async function handleChangeAfterSales(
    soId: string,
    newStatus: AfterSalesStatus
  ) {
    await updateAfterSalesStatus(soId, newStatus);
    await loadData();
    Taro.showToast({ title: "售后状态已更新", icon: "success" });
  }

  async function handleSaveTracking(soId: string) {
    const value = trackingEdits[soId];
    if (!value || !value.trim()) {
      Taro.showToast({ title: "请输入快递单号", icon: "none" });
      return;
    }
    await updateTrackingNumber(soId, value.trim());
    await loadData();
    Taro.showToast({ title: "快递单号已保存", icon: "success" });
  }

  async function handleForceConfirmDelivery(soId: string) {
    const result = await Taro.showModal({
      title: "强制确认收货",
      content: "确认将此订单标记为已送达？",
    });
    if (!result.confirm) return;
    await updateSupplierOrderStatus(soId, "delivered");
    await loadData();
    Taro.showToast({ title: "已确认收货", icon: "success" });
  }

  async function handleSendNote(orderId: string) {
    const content = noteInputs[orderId];
    if (!content || !content.trim() || !user) return;
    await addOrderNote({
      orderId,
      userId: user._id,
      role: user.role,
      userName: user.name,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });
    setNoteInputs((prev) => ({ ...prev, [orderId]: "" }));
    await loadNotes(orderId);
    Taro.showToast({ title: "备注已添加", icon: "success" });
  }

  function handleQuickDate(preset: string) {
    const range = getQuickDateRange(preset);
    setDateStart(range.start);
    setDateEnd(range.end);
  }

  // Filter supplier orders
  const filteredOrders = useMemo(() => {
    return supplierOrders.filter((so) => {
      // Status filter
      if (statusFilter !== "all" && so.status !== statusFilter) return false;

      // Date range filter
      if (dateStart) {
        const orderDate = so.tourDate || so.createdAt;
        if (orderDate < dateStart) return false;
      }
      if (dateEnd) {
        const orderDate = so.tourDate || so.createdAt;
        if (orderDate > dateEnd + "z") return false;
      }

      // Keyword search: tour code or guide name
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const searchable = [so.tourCode, so.guideName, so.guidePhone]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(kw)) return false;
      }

      return true;
    });
  }, [supplierOrders, statusFilter, dateStart, dateEnd, searchKeyword]);

  return (
    <View className="page">
      {/* Back button */}
      <Text
        className="back-btn"
        onClick={() => Taro.navigateBack({ delta: 1 })}
      >
        &lt; 返回管理后台
      </Text>

      <Text className="page-title">订单管理</Text>

      {/* Search */}
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜索团号、导游姓名..."
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
        />
      </View>

      {/* Status filter tabs */}
      <View className="filter-tabs">
        {STATUS_FILTERS.map((f) => (
          <Text
            key={f.key}
            className={`filter-tab ${statusFilter === f.key ? "active" : ""}`}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </Text>
        ))}
      </View>

      {/* Date range */}
      <View className="date-range-section">
        <View className="date-range-row">
          <Picker
            mode="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.detail.value)}
          >
            <View className="date-picker-box">
              <Text className="date-picker-text">
                {dateStart || "开始日期"}
              </Text>
            </View>
          </Picker>
          <Text className="date-separator">至</Text>
          <Picker
            mode="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.detail.value)}
          >
            <View className="date-picker-box">
              <Text className="date-picker-text">
                {dateEnd || "结束日期"}
              </Text>
            </View>
          </Picker>
          {(dateStart || dateEnd) && (
            <Text
              className="date-clear"
              onClick={() => {
                setDateStart("");
                setDateEnd("");
              }}
            >
              清除
            </Text>
          )}
        </View>
        <View className="date-quick-row">
          <Text
            className="date-quick-btn"
            onClick={() => handleQuickDate("today")}
          >
            今天
          </Text>
          <Text
            className="date-quick-btn"
            onClick={() => handleQuickDate("week")}
          >
            本周
          </Text>
          <Text
            className="date-quick-btn"
            onClick={() => handleQuickDate("month")}
          >
            本月
          </Text>
          <Text
            className="date-quick-btn"
            onClick={() => {
              setDateStart("");
              setDateEnd("");
            }}
          >
            全部
          </Text>
        </View>
      </View>

      {/* Result count */}
      <Text className="result-count">
        共 {filteredOrders.length} 条订单
      </Text>

      {/* Order list */}
      {filteredOrders.length === 0 ? (
        <View className="empty">
          <Text>暂无订单</Text>
        </View>
      ) : (
        filteredOrders.map((so) => {
          const afterSales = so.afterSalesStatus || "none";
          const isDetailsExpanded = expandedDetails.has(so._id);
          const isSlipExpanded = expandedSlips.has(so._id);
          const isNotesExpanded = expandedNotes.has(so._id);
          const slip = whiteSlips[so._id];
          const notes = notesCache[so._id] || [];

          return (
            <View key={so._id} className="order-card">
              {/* Header: tour code + date */}
              <View className="order-header">
                <Text className="order-tour-code">{so.tourCode}</Text>
                <Text className="order-date">{so.tourDate}</Text>
              </View>

              {/* Guide info + status badges */}
              <View className="order-info-row">
                <Text className="order-info-label">导游</Text>
                <Text className="order-info-value">
                  {so.guideName} {so.guidePhone}
                </Text>
              </View>
              <View className="order-info-row">
                <Text className="order-info-label">状态</Text>
                <View>
                  <Text
                    className={`status-badge status-${so.status}`}
                  >
                    {ORDER_STATUS_MAP[so.status]}
                  </Text>
                  {afterSales !== "none" && (
                    <Text className="after-sales-badge">
                      {AFTER_SALES_STATUS_MAP[afterSales]}
                    </Text>
                  )}
                </View>
              </View>
              <View className="order-info-row">
                <Text className="order-info-label">数量</Text>
                <Text className="order-info-value">
                  {so.totalQuantity}套
                </Text>
              </View>
              <View className="order-info-row">
                <Text className="order-info-label">金额</Text>
                <Text className="order-amount">
                  ¥{(so.totalAmount / 100).toFixed(2)}
                </Text>
              </View>
              {so.trackingNumber && (
                <View className="order-info-row">
                  <Text className="order-info-label">快递单号</Text>
                  <Text className="order-info-value">
                    {so.trackingNumber}
                  </Text>
                </View>
              )}

              {/* Expand: admin controls */}
              <View
                className="expand-header"
                onClick={() =>
                  toggleExpand(expandedDetails, setExpandedDetails, so._id)
                }
              >
                <Text className="expand-title">管理操作</Text>
                <Text className="expand-arrow">
                  {isDetailsExpanded ? "▲" : "▼"}
                </Text>
              </View>
              {isDetailsExpanded && (
                <View className="expand-content">
                  <View className="admin-controls">
                    {/* Status picker */}
                    <View className="control-row">
                      <Text className="control-label">修改状态</Text>
                      <Picker
                        mode="selector"
                        range={ALL_STATUSES.map((s) => ORDER_STATUS_MAP[s])}
                        value={ALL_STATUSES.indexOf(so.status)}
                        onChange={(e) => {
                          const newStatus =
                            ALL_STATUSES[Number(e.detail.value)];
                          if (newStatus !== so.status) {
                            handleChangeStatus(so._id, newStatus);
                          }
                        }}
                      >
                        <View className="control-picker">
                          <Text className="control-picker-text">
                            {ORDER_STATUS_MAP[so.status]}
                          </Text>
                          <Text className="control-picker-arrow">
                            &#9662;
                          </Text>
                        </View>
                      </Picker>
                    </View>

                    {/* After-sales picker */}
                    <View className="control-row">
                      <Text className="control-label">售后状态</Text>
                      <Picker
                        mode="selector"
                        range={AFTER_SALES_OPTIONS.map(
                          (s) => AFTER_SALES_STATUS_MAP[s]
                        )}
                        value={AFTER_SALES_OPTIONS.indexOf(afterSales)}
                        onChange={(e) => {
                          const newAS =
                            AFTER_SALES_OPTIONS[Number(e.detail.value)];
                          if (newAS !== afterSales) {
                            handleChangeAfterSales(so._id, newAS);
                          }
                        }}
                      >
                        <View className="control-picker">
                          <Text className="control-picker-text">
                            {AFTER_SALES_STATUS_MAP[afterSales]}
                          </Text>
                          <Text className="control-picker-arrow">
                            &#9662;
                          </Text>
                        </View>
                      </Picker>
                    </View>

                    {/* Tracking number */}
                    <View className="tracking-row">
                      <Text className="control-label">快递单号</Text>
                      <Input
                        className="tracking-input"
                        value={
                          trackingEdits[so._id] !== undefined
                            ? trackingEdits[so._id]
                            : so.trackingNumber || ""
                        }
                        onInput={(e) =>
                          setTrackingEdits((prev) => ({
                            ...prev,
                            [so._id]: e.detail.value,
                          }))
                        }
                        placeholder="输入快递单号"
                      />
                      <Text
                        className="tracking-save-btn"
                        onClick={() => handleSaveTracking(so._id)}
                      >
                        保存
                      </Text>
                    </View>

                    {/* Force confirm delivery */}
                    {so.status !== "delivered" && (
                      <View className="control-row">
                        <Text className="control-label"></Text>
                        <Text
                          className="confirm-delivery-btn"
                          onClick={() => handleForceConfirmDelivery(so._id)}
                        >
                          强制确认收货
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Expand: white slip */}
              <View
                className="expand-header"
                onClick={() => {
                  toggleExpand(expandedSlips, setExpandedSlips, so._id);
                  if (!expandedSlips.has(so._id)) {
                    loadWhiteSlip(so);
                  }
                }}
              >
                <Text className="expand-title">查看白单</Text>
                <Text className="expand-arrow">
                  {isSlipExpanded ? "▲" : "▼"}
                </Text>
              </View>
              {isSlipExpanded && (
                <View className="expand-content">
                  {!slip ? (
                    <Text style={{ fontSize: "24px", color: "#999" }}>
                      {so.whiteSlipIds.length === 0
                        ? "无关联白单"
                        : "加载中..."}
                    </Text>
                  ) : (
                    <View>
                      {slip.entries.map((entry) => (
                        <View key={entry.guestNo} className="guest-group">
                          <Text className="guest-header">
                            游客 {entry.guestNo}
                          </Text>
                          {entry.items.map((item) => (
                            <View
                              key={item.productId}
                              className="slip-item-row"
                            >
                              <Text className="slip-item-name">
                                {item.productName}
                              </Text>
                              <Text className="slip-item-qty">
                                x{item.quantity}
                              </Text>
                            </View>
                          ))}
                          <View className="slip-delivery">
                            <Text className="delivery-tag">
                              {DELIVERY_METHOD_MAP[entry.deliveryMethod]}
                            </Text>
                            {entry.deliveryMethod === "express" &&
                              entry.deliveryAddress && (
                                <Text className="delivery-addr">
                                  {entry.deliveryAddress}
                                </Text>
                              )}
                          </View>
                          {entry.remark && (
                            <Text
                              style={{
                                fontSize: "22px",
                                color: "#999",
                                padding: "4px 12px",
                                display: "block",
                              }}
                            >
                              备注: {entry.remark}
                            </Text>
                          )}
                        </View>
                      ))}
                      {slip.defaultAddress && (
                        <View className="default-address">
                          <Text className="default-address-label">
                            默认送货地址:{" "}
                          </Text>
                          <Text>{slip.defaultAddress}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Expand: notes */}
              <View
                className="expand-header"
                onClick={() => {
                  toggleExpand(expandedNotes, setExpandedNotes, so._id);
                  if (!expandedNotes.has(so._id)) {
                    loadNotes(so._id);
                  }
                }}
              >
                <Text className="expand-title">
                  备注留言
                  {notesCache[so._id] && notesCache[so._id].length > 0
                    ? ` (${notesCache[so._id].length})`
                    : ""}
                </Text>
                <Text className="expand-arrow">
                  {isNotesExpanded ? "▲" : "▼"}
                </Text>
              </View>
              {isNotesExpanded && (
                <View className="expand-content">
                  {notes.length === 0 && (
                    <Text style={{ fontSize: "24px", color: "#999" }}>
                      暂无备注
                    </Text>
                  )}
                  {notes.map((note) => (
                    <View key={note._id} className="note-item">
                      <View className="note-header">
                        <Text className="note-user">{note.userName}</Text>
                        <Text className="note-time">
                          {new Date(note.createdAt).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text className="note-content">{note.content}</Text>
                    </View>
                  ))}
                  <View className="note-input-row">
                    <Input
                      className="note-input"
                      value={noteInputs[so._id] || ""}
                      onInput={(e) =>
                        setNoteInputs((prev) => ({
                          ...prev,
                          [so._id]: e.detail.value,
                        }))
                      }
                      placeholder="添加备注..."
                      confirmType="send"
                      onConfirm={() => handleSendNote(so._id)}
                    />
                    <Text
                      className="note-send-btn"
                      onClick={() => handleSendNote(so._id)}
                    >
                      发送
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
