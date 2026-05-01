import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { getTour } from "../../../services/tour";
import { getOrdersByTour } from "../../../services/order";
import { getProducts } from "../../../services/product";
import type { Tour, Order, Product } from "../../../types";
import "./index.css";

export default function OrderSummary() {
  const router = useRouter();
  const tourId = router.params.tourId || "";

  const [tour, setTour] = useState<Tour | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [tourData, orderData, productData] = await Promise.all([
      getTour(tourId),
      getOrdersByTour(tourId),
      getProducts(),
    ]);
    setTour(tourData);
    setOrders(orderData);
    setProducts(productData);
  }

  function getQuantity(order: Order, productId: string): number {
    const item = order.items.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }

  function getProductTotal(productId: string): number {
    return orders.reduce((sum, o) => sum + getQuantity(o, productId), 0);
  }

  function grandTotal(): number {
    return orders.reduce((sum, o) => sum + o.totalAmount, 0);
  }

  function totalSets(): number {
    return products.reduce((sum, p) => sum + getProductTotal(p._id), 0);
  }

  if (!tour) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="summary-header">
        <Text className="summary-brand">桂礼道 — 汇总单</Text>
        <Text className="summary-info">
          团号：{tour.tourCode}　　日期：{tour.date}
        </Text>
      </View>

      <ScrollView scrollX className="table-scroll">
        <View className="table">
          <View className="table-row table-header">
            <Text className="cell cell-no">白单</Text>
            {products.map((p) => (
              <Text key={p._id} className="cell cell-product">
                {p.name}
              </Text>
            ))}
            <Text className="cell cell-amount">金额</Text>
          </View>

          {orders.map((order) => (
            <View key={order._id} className="table-row">
              <Text className="cell cell-no">#{order.orderNo}</Text>
              {products.map((p) => {
                const qty = getQuantity(order, p._id);
                return (
                  <Text key={p._id} className="cell cell-product">
                    {qty > 0 ? qty : ""}
                  </Text>
                );
              })}
              <Text className="cell cell-amount">
                ¥{(order.totalAmount / 100).toFixed(0)}
              </Text>
            </View>
          ))}

          <View className="table-row table-footer">
            <Text className="cell cell-no">合计</Text>
            {products.map((p) => {
              const total = getProductTotal(p._id);
              return (
                <Text key={p._id} className="cell cell-product">
                  {total > 0 ? total : ""}
                </Text>
              );
            })}
            <Text className="cell cell-amount">
              ¥{(grandTotal() / 100).toFixed(0)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="grand-total">
        <Text>
          总套数：{totalSets()}套　　总金额：¥{(grandTotal() / 100).toFixed(0)}
        </Text>
      </View>
    </View>
  );
}
