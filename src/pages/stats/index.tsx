import { useEffect, useState, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import { useAppStore } from "../../store";
import { getSupplierOrders } from "../../services/supplier-order";
import type { SupplierOrder, OrderStatus } from "../../types";
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
  const [allOrders, setAllOrders] = useState<SupplierOrder[]>([]);
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
      const all = await getSupplierOrders();
      // Guide role: show only their orders
      const mine = user.role === "admin" ? all : all.filter((o) => o.guideId === user._id);
      setAllOrders(mine);
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
  const totalQuantity = filteredOrders.reduce((sum, o) => sum + o.totalQuantity, 0);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};
    for (const o of filteredOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
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
          <Text className="stat-label">供货商订单</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value">
            ¥{(totalRevenue / 100).toFixed(0)}
          </Text>
          <Text className="stat-label">总金额</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value">{totalQuantity}</Text>
          <Text className="stat-label">总套数</Text>
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
    </View>
  );
}
