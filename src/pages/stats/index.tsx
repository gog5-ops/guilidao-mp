import { useEffect, useState, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import { useAppStore } from "../../store";
import { getOrdersByGuide } from "../../services/order";
import type { Order, OrderStatus } from "../../types";
import { ORDER_STATUS_MAP } from "../../types";
import "./index.css";

type DateFilter = "today" | "week" | "month" | "all";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "all", label: "全部" },
];

function getFilterStartDate(filter: DateFilter): Date | null {
  const now = new Date();
  if (filter === "all") return null;
  if (filter === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (filter === "week") {
    const day = now.getDay() || 7; // Sunday = 7
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    return start;
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function Stats() {
  const { user } = useAppStore();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  async function loadOrders() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getOrdersByGuide(user._id);
      setAllOrders(data);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const startDate = getFilterStartDate(dateFilter);
    if (!startDate) return allOrders;
    return allOrders.filter(
      (o) => new Date(o.createdAt) >= startDate
    );
  }, [allOrders, dateFilter]);

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};
    for (const o of filteredOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [filteredOrders]);

  const productBreakdown = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    for (const o of filteredOrders) {
      for (const item of o.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0 };
        }
        map[item.productId].qty += item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  if (loading) {
    return (
      <View className="page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="filters">
        {DATE_FILTERS.map((f) => (
          <View
            key={f.key}
            className={`filter-btn ${dateFilter === f.key ? "active" : ""}`}
            onClick={() => setDateFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className="stats-grid">
        <View className="stat-card">
          <Text className="stat-value">{totalOrders}</Text>
          <Text className="stat-label">总订单数</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value">
            ¥{(totalRevenue / 100).toFixed(0)}
          </Text>
          <Text className="stat-label">总收入</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">按状态统计</Text>
        {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map((status) => (
          <View key={status} className="status-row">
            <Text className="status-name">{ORDER_STATUS_MAP[status]}</Text>
            <Text className="status-count">{statusCounts[status] || 0}</Text>
          </View>
        ))}
      </View>

      <View className="section">
        <Text className="section-title">商品销量排行</Text>
        {productBreakdown.length === 0 ? (
          <View className="empty">
            <Text>暂无销售数据</Text>
          </View>
        ) : (
          productBreakdown.map((p) => (
            <View key={p.name} className="product-row">
              <Text className="product-name">{p.name}</Text>
              <Text className="product-qty">{p.qty}件</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
