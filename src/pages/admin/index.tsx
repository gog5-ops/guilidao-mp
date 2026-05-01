import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../store";
import { getAllOrders } from "../../services/order";
import { getAllTours } from "../../services/tour";
import type { Order, OrderStatus, Tour } from "../../types";
import { ORDER_STATUS_MAP, DELIVERY_METHOD_MAP } from "../../types";
import "./index.css";

type StatusFilter = "all" | OrderStatus;
type DateFilter = "all" | "today" | "week" | "month";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "已确认" },
  { key: "shipping", label: "配送中" },
  { key: "delivered", label: "已送达" },
  { key: "rejected", label: "已拒单" },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
];

function getDateRange(filter: DateFilter): { start: Date; end: Date } | null {
  if (filter === "all") return null;
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  switch (filter) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  return { start, end };
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  async function loadData() {
    const [orderData, tourData] = await Promise.all([
      getAllOrders(),
      getAllTours(),
    ]);
    setOrders(orderData);
    setTours(tourData);
  }

  function handleLogout() {
    setUser(null);
    Taro.reLaunch({ url: "/pages/index/index" });
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    const range = getDateRange(dateFilter);
    if (range) {
      const orderDate = new Date(order.createdAt);
      if (orderDate < range.start || orderDate > range.end) return false;
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

      {/* Filters */}
      <View className="section">
        <Text className="section-title">订单列表</Text>
        <View className="filters">
          <View className="filter-row">
            {STATUS_FILTERS.map((f) => (
              <Text
                key={f.key}
                className={`filter-btn ${statusFilter === f.key ? "active" : ""}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Text>
            ))}
          </View>
          <View className="filter-row">
            {DATE_FILTERS.map((f) => (
              <Text
                key={f.key}
                className={`filter-btn ${dateFilter === f.key ? "active" : ""}`}
                onClick={() => setDateFilter(f.key)}
              >
                {f.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Export CSV button */}
        <Text className="btn-export" onClick={handleExportCSV}>导出 CSV</Text>

        {/* Order list */}
        {filteredOrders.length === 0 ? (
          <View className="empty"><Text>暂无订单</Text></View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order._id} className="order-card">
              <View className="order-header">
                <Text className="order-no">#{order.orderNo}</Text>
                <Text className={`order-status status-${order.status}`}>
                  {ORDER_STATUS_MAP[order.status]}
                </Text>
              </View>
              <Text className="order-info">
                导游ID: {order.guideId}
              </Text>
              <View className="order-footer">
                <Text className="order-date">
                  {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                </Text>
                <Text className="order-amount">
                  ¥{(order.totalAmount / 100).toFixed(0)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
