import { useEffect, useState, useMemo } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../store";
import { getAllOrders } from "../../services/order";
import { getAllTours } from "../../services/tour";
import {
  getSupplierOrders,
  updateSupplierOrderStatus,
  updateAfterSalesStatus,
} from "../../services/supplier-order";
import { updateOrderStatus } from "../../services/order";
import type { Order, OrderStatus, Tour, SupplierOrder, AfterSalesStatus } from "../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP, AFTER_SALES_STATUS_MAP } from "../../types";
import "./index.css";

type StatusFilter = "all" | OrderStatus;
type QuickFilter = "" | "unshipped" | "no-tracking" | "rejected";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "已确认" },
  { key: "partially_shipped", label: "部分发货" },
  { key: "shipping", label: "配送中" },
  { key: "delivered", label: "已送达" },
  { key: "rejected", label: "已拒单" },
];

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "unshipped", label: "未发货" },
  { key: "no-tracking", label: "快递待填" },
  { key: "rejected", label: "已拒单" },
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
  let startDate: Date;
  switch (preset) {
    case "today":
      return { start: end, end };
    case "week": {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      return { start: formatDate(startDate), end };
    }
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(startDate), end };
    default:
      return { start: "", end: "" };
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

interface ProductRank {
  name: string;
  quantity: number;
}

export default function AdminPage() {
  const { user, setUser } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [guideFilter, setGuideFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  async function loadData() {
    const [orderData, tourData, supplierData] = await Promise.all([
      getAllOrders(),
      getAllTours(),
      getSupplierOrders(),
    ]);
    setOrders(orderData);
    setTours(tourData);
    setSupplierOrders(supplierData);
  }

  function handleLogout() {
    setUser(null);
    Taro.reLaunch({ url: "/pages/index/index" });
  }

  // Build guideId -> guideName map from supplier orders
  const guideNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const so of supplierOrders) {
      if (so.guideId && so.guideName) {
        map.set(so.guideId, so.guideName);
      }
    }
    return map;
  }, [supplierOrders]);

  // Build guide options for dropdown
  const guideOptions = useMemo(() => {
    const uniqueGuides = new Map<string, string>();
    for (const order of orders) {
      if (!uniqueGuides.has(order.guideId)) {
        uniqueGuides.set(order.guideId, guideNameMap.get(order.guideId) || order.guideId);
      }
    }
    return Array.from(uniqueGuides.entries()).map(([id, name]) => ({ id, name }));
  }, [orders, guideNameMap]);

  const ALL_STATUSES: OrderStatus[] = [
    "pending", "confirmed", "partially_shipped", "shipping", "delivered", "rejected",
  ];

  const AFTER_SALES_OPTIONS: AfterSalesStatus[] = [
    "none", "requested", "processing", "resolved",
  ];

  async function handleChangeOrderStatus(orderId: string, newStatus: OrderStatus) {
    await updateOrderStatus(orderId, newStatus);
    await loadData();
    Taro.showToast({ title: "状态已更新", icon: "success" });
  }

  async function handleChangeSupplierOrderStatus(soId: string, newStatus: OrderStatus) {
    await updateSupplierOrderStatus(soId, newStatus);
    await loadData();
    Taro.showToast({ title: "供货商订单状态已更新", icon: "success" });
  }

  async function handleAdminConfirmReceive(orderId: string) {
    const result = await Taro.showModal({
      title: "代导游确认收货",
      content: "确认代替导游标记已收货？",
    });
    if (!result.confirm) return;
    await updateOrderStatus(orderId, "delivered");
    await loadData();
    Taro.showToast({ title: "已确认收货", icon: "success" });
  }

  async function handleChangeAfterSales(soId: string, newStatus: AfterSalesStatus) {
    await updateAfterSalesStatus(soId, newStatus);
    await loadData();
    Taro.showToast({ title: "售后状态已更新", icon: "success" });
  }

  function handleQuickDate(preset: string) {
    const range = getQuickDateRange(preset);
    setDateStart(range.start);
    setDateEnd(range.end);
  }

  function handleQuickFilter(key: QuickFilter) {
    if (quickFilter === key) {
      setQuickFilter("");
      return;
    }
    setQuickFilter(key);
    // Clear status filter when using quick filter
    setStatusFilter("all");
  }

  function handleStatusFilter(key: StatusFilter) {
    setStatusFilter(key);
    // Clear quick filter when using status filter
    setQuickFilter("");
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Quick filter takes precedence
    if (quickFilter) {
      switch (quickFilter) {
        case "unshipped":
          if (order.status !== "pending" && order.status !== "confirmed") return false;
          break;
        case "no-tracking": {
          if (order.deliveryMethod !== "express") return false;
          // Check if the corresponding supplier order has a tracking number
          const hasSO = supplierOrders.some(
            (so) => so.guideId === order.guideId && so.tourId === order.tourId && !so.trackingNumber
          );
          if (!hasSO) return false;
          break;
        }
        case "rejected":
          if (order.status !== "rejected") return false;
          break;
      }
    } else {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
    }

    // Date range filter
    if (dateStart) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateStart + "T00:00:00");
      if (orderDate < startDate) return false;
    }
    if (dateEnd) {
      const orderDate = new Date(order.createdAt);
      const endDate = new Date(dateEnd + "T23:59:59");
      if (orderDate > endDate) return false;
    }

    // Guide filter
    if (guideFilter !== "all" && order.guideId !== guideFilter) return false;

    // Keyword search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      const guideName = guideNameMap.get(order.guideId) || "";
      const productNames = order.items.map((i) => i.productName).join(" ");
      const searchable = [
        order.orderNo,
        guideName,
        productNames,
        order.remark || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(kw)) return false;
    }

    return true;
  });

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const guideIds = new Set(orders.map((o) => o.guideId));

  // Product ranking
  const productQtyMap = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      productQtyMap.set(
        item.productName,
        (productQtyMap.get(item.productName) || 0) + item.quantity
      );
    }
  }
  const productRanking: ProductRank[] = Array.from(productQtyMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  function handleExportCSV() {
    if (filteredOrders.length === 0) {
      Taro.showToast({ title: "无数据可导出", icon: "none" });
      return;
    }

    const header = "订单号,导游ID,商品明细,数量,金额(元),状态,配送方式,地址,日期";
    const rows = filteredOrders.map((order) => {
      const itemsStr = order.items
        .map((i) => `${i.productName}x${i.quantity}`)
        .join(", ");
      const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
      const cols = [
        order.orderNo,
        order.guideId,
        escapeCsvField(itemsStr),
        String(totalQty),
        (order.totalAmount / 100).toFixed(2),
        ORDER_STATUS_MAP[order.status],
        DELIVERY_METHOD_MAP[order.deliveryMethod],
        escapeCsvField(order.deliveryAddress || ""),
        new Date(order.createdAt).toLocaleDateString("zh-CN"),
      ];
      return cols.join(",");
    });

    const csvContent = "﻿" + header + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Taro.showToast({ title: "导出成功", icon: "success" });
  }

  return (
    <View className="page">
      <View className="header-top">
        <Text className="welcome" onClick={() => Taro.navigateTo({ url: "/pages/profile/index" })}>你好，{user?.name || "管理员"} &gt;</Text>
        <View className="header-actions">
          <Text className="btn-manage" onClick={() => Taro.navigateTo({ url: "/pages/product/index" })}>商品管理</Text>
          <Text className="btn-manage" onClick={() => Taro.navigateTo({ url: "/pages/red-slip/index" })}>红单管理</Text>
          <Text className="btn-logout" onClick={handleLogout}>退出</Text>
        </View>
      </View>

      {/* Summary cards */}
      <View className="summary-grid">
        <View className="summary-card">
          <Text className="summary-value">{orders.length}</Text>
          <Text className="summary-label">总订单</Text>
        </View>
        <View className="summary-card">
          <Text className="summary-value">
            ¥{(totalRevenue / 100).toFixed(0)}
          </Text>
          <Text className="summary-label">总收入</Text>
        </View>
        <View className="summary-card">
          <Text className="summary-value">{tours.length}</Text>
          <Text className="summary-label">总团次</Text>
        </View>
        <View className="summary-card">
          <Text className="summary-value">{guideIds.size}</Text>
          <Text className="summary-label">导游数</Text>
        </View>
      </View>

      {/* Product ranking */}
      <View className="section">
        <Text className="section-title">商品销量排行</Text>
        {productRanking.length === 0 ? (
          <View className="empty"><Text>暂无数据</Text></View>
        ) : (
          productRanking.map((item, idx) => (
            <View key={item.name} className="rank-card">
              <View className="rank-left">
                <Text className="rank-index">{idx + 1}</Text>
                <Text className="rank-name">{item.name}</Text>
              </View>
              <Text className="rank-qty">{item.quantity}件</Text>
            </View>
          ))
        )}
      </View>

      {/* Search and Filters */}
      <View className="section">
        <Text className="section-title">订单列表</Text>

        {/* Keyword search */}
        <View className="search-bar">
          <Input
            className="search-input"
            placeholder="搜索订单号、导游、商品、备注..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        {/* Guide filter */}
        <View className="filter-section">
          <Text className="filter-label">导游筛选</Text>
          <Picker
            mode="selector"
            range={[{ id: "all", name: "全部导游" }, ...guideOptions]}
            rangeKey="name"
            value={guideFilter === "all" ? 0 : guideOptions.findIndex((g) => g.id === guideFilter) + 1}
            onChange={(e) => {
              const idx = Number(e.detail.value);
              if (idx === 0) {
                setGuideFilter("all");
              } else {
                setGuideFilter(guideOptions[idx - 1].id);
              }
            }}
          >
            <View className="picker-display">
              <Text className="picker-text">
                {guideFilter === "all"
                  ? "全部导游"
                  : guideNameMap.get(guideFilter) || guideFilter}
              </Text>
              <Text className="picker-arrow">&#9662;</Text>
            </View>
          </Picker>
        </View>

        <View className="filters">
          {/* Status filter */}
          <View className="filter-row">
            {STATUS_FILTERS.map((f) => (
              <Text
                key={f.key}
                className={`filter-btn ${statusFilter === f.key && !quickFilter ? "active" : ""}`}
                onClick={() => handleStatusFilter(f.key)}
              >
                {f.label}
              </Text>
            ))}
          </View>

          {/* Quick filters */}
          <View className="filter-row">
            {QUICK_FILTERS.map((f) => (
              <Text
                key={f.key}
                className={`filter-btn quick-btn ${quickFilter === f.key ? "active" : ""}`}
                onClick={() => handleQuickFilter(f.key)}
              >
                {f.label}
              </Text>
            ))}
          </View>

          {/* Date range */}
          <View className="date-range-section">
            <View className="date-range-row">
              <Picker mode="date" value={dateStart} onChange={(e) => setDateStart(e.detail.value)}>
                <View className="date-picker-box">
                  <Text className="date-picker-text">{dateStart || "开始日期"}</Text>
                </View>
              </Picker>
              <Text className="date-separator">至</Text>
              <Picker mode="date" value={dateEnd} onChange={(e) => setDateEnd(e.detail.value)}>
                <View className="date-picker-box">
                  <Text className="date-picker-text">{dateEnd || "结束日期"}</Text>
                </View>
              </Picker>
              {(dateStart || dateEnd) && (
                <Text
                  className="date-clear"
                  onClick={() => { setDateStart(""); setDateEnd(""); }}
                >
                  清除
                </Text>
              )}
            </View>
            <View className="date-quick-row">
              <Text className="date-quick-btn" onClick={() => handleQuickDate("today")}>今天</Text>
              <Text className="date-quick-btn" onClick={() => handleQuickDate("week")}>本周</Text>
              <Text className="date-quick-btn" onClick={() => handleQuickDate("month")}>本月</Text>
              <Text className="date-quick-btn" onClick={() => { setDateStart(""); setDateEnd(""); }}>全部</Text>
            </View>
          </View>
        </View>

        {/* Result count */}
        <View className="result-count-row">
          <Text className="result-count">共 {filteredOrders.length} 条结果</Text>
          <Text className="btn-export" onClick={handleExportCSV}>导出 CSV</Text>
        </View>

        {/* Order list */}
        {filteredOrders.length === 0 ? (
          <View className="empty"><Text>暂无订单</Text></View>
        ) : (
          filteredOrders.map((order) => {
            // Find associated supplier order
            const relatedSO = supplierOrders.find(
              (so) => so.guideId === order.guideId && so.tourId === order.tourId
            );
            const afterSales = relatedSO?.afterSalesStatus || "none";
            return (
              <View
                key={order._id}
                className="order-card"
                onClick={() => {
                  if (relatedSO) {
                    Taro.navigateTo({
                      url: `/pages/supplier/detail/index?id=${relatedSO._id}`,
                    });
                  }
                }}
                style={{ cursor: relatedSO ? "pointer" : "default" }}
              >
                <View className="order-header">
                  <Text className="order-no">#{order.orderNo}</Text>
                  <Text className={`order-status status-${order.status}`}>
                    {ORDER_STATUS_MAP[order.status]}
                  </Text>
                </View>
                <Text className="order-info">
                  导游: {guideNameMap.get(order.guideId) || order.guideId}
                </Text>
                <View className="order-footer">
                  <Text className="order-date">
                    {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                  </Text>
                  <Text className="order-amount">
                    ¥{(order.totalAmount / 100).toFixed(0)}
                  </Text>
                </View>
                {relatedSO && (
                  <Text style={{ fontSize: "22px", color: "#8B5E3C", marginTop: "8px", display: "block" }}>
                    点击查看详情 &gt;
                  </Text>
                )}

                {/* After-sales status display */}
                {afterSales !== "none" && (
                  <View style={{ marginTop: "8px", padding: "6px 12px", background: "#FFF3E0", borderRadius: "6px" }}>
                    <Text style={{ fontSize: "22px", color: "#E65100" }}>
                      售后: {AFTER_SALES_STATUS_MAP[afterSales]}
                    </Text>
                  </View>
                )}

                {/* Admin controls */}
                <View style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                  {/* Status change picker */}
                  <Picker
                    mode="selector"
                    range={ALL_STATUSES.map((s) => ORDER_STATUS_MAP[s])}
                    value={ALL_STATUSES.indexOf(order.status)}
                    onChange={(e) => {
                      const newStatus = ALL_STATUSES[Number(e.detail.value)];
                      if (newStatus !== order.status) {
                        handleChangeOrderStatus(order._id, newStatus);
                        if (relatedSO) {
                          handleChangeSupplierOrderStatus(relatedSO._id, newStatus);
                        }
                      }
                    }}
                  >
                    <View className="admin-action-row">
                      <Text className="admin-action-btn">修改状态</Text>
                    </View>
                  </Picker>

                  {/* Confirm receive for guide */}
                  {order.status === "shipping" && (
                    <Text
                      className="admin-action-btn"
                      style={{ marginTop: "8px", display: "block", color: "#2E7D32" }}
                      onClick={() => handleAdminConfirmReceive(order._id)}
                    >
                      代导游确认收货
                    </Text>
                  )}

                  {/* After-sales management */}
                  {relatedSO && (
                    <Picker
                      mode="selector"
                      range={AFTER_SALES_OPTIONS.map((s) => AFTER_SALES_STATUS_MAP[s])}
                      value={AFTER_SALES_OPTIONS.indexOf(afterSales)}
                      onChange={(e) => {
                        const newAS = AFTER_SALES_OPTIONS[Number(e.detail.value)];
                        if (newAS !== afterSales) {
                          handleChangeAfterSales(relatedSO._id, newAS);
                        }
                      }}
                    >
                      <View className="admin-action-row" style={{ marginTop: "8px" }}>
                        <Text className="admin-action-btn">售后管理</Text>
                      </View>
                    </Picker>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
