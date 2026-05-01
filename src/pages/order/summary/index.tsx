import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { getTour } from "../../../services/tour";
import { getWhiteSlipByTour } from "../../../services/white-slip";
import type { Tour, WhiteSlip, GuestEntry } from "../../../types";
import "./index.css";

export default function OrderSummary() {
  const router = useRouter();
  const tourId = router.params.tourId || "";

  const [tour, setTour] = useState<Tour | null>(null);
  const [whiteSlip, setWhiteSlip] = useState<WhiteSlip | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [tourData, slipData] = await Promise.all([
      getTour(tourId),
      getWhiteSlipByTour(tourId),
    ]);
    setTour(tourData);
    setWhiteSlip(slipData);
  }

  if (!tour) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const entries = whiteSlip?.entries || [];

  // Collect all unique products across all entries
  const productMap = new Map<string, string>(); // productId -> productName
  for (const entry of entries) {
    for (const item of entry.items) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, item.productName);
      }
    }
  }
  const productIds = Array.from(productMap.keys());

  function getQuantity(entry: GuestEntry, productId: string): number {
    const item = entry.items.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }

  function getProductTotal(productId: string): number {
    return entries.reduce((sum, e) => sum + getQuantity(e, productId), 0);
  }

  function entryTotal(entry: GuestEntry): number {
    return entry.items.reduce((sum, i) => sum + i.subtotal, 0);
  }

  function entryItemCount(entry: GuestEntry): number {
    return entry.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  function grandTotal(): number {
    return whiteSlip?.totalAmount || entries.reduce((sum, e) => sum + entryTotal(e), 0);
  }

  function totalSets(): number {
    return whiteSlip?.totalQuantity || entries.reduce((sum, e) => sum + entryItemCount(e), 0);
  }

  return (
    <View className="page">
      <View className="summary-header">
        <Text className="summary-brand">桂礼道 -- 汇总单</Text>
        <Text className="summary-info">
          团号：{tour.tourCode}　　日期：{tour.date}
        </Text>
      </View>

      <ScrollView scrollX className="table-scroll">
        <View className="table">
          <View className="table-row table-header">
            <Text className="cell cell-no">游客</Text>
            {productIds.map((pid) => (
              <Text key={pid} className="cell cell-product">
                {productMap.get(pid)}
              </Text>
            ))}
            <Text className="cell cell-amount">小计(套)</Text>
            <Text className="cell cell-amount">金额</Text>
          </View>

          {entries.map((entry) => (
            <View key={entry.guestNo} className="table-row">
              <Text className="cell cell-no">{entry.guestNo}</Text>
              {productIds.map((pid) => {
                const qty = getQuantity(entry, pid);
                return (
                  <Text key={pid} className="cell cell-product">
                    {qty > 0 ? qty : ""}
                  </Text>
                );
              })}
              <Text className="cell cell-amount">
                {entryItemCount(entry)}套
              </Text>
              <Text className="cell cell-amount">
                ¥{(entryTotal(entry) / 100).toFixed(0)}
              </Text>
            </View>
          ))}

          <View className="table-row table-footer">
            <Text className="cell cell-no">合计</Text>
            {productIds.map((pid) => {
              const total = getProductTotal(pid);
              return (
                <Text key={pid} className="cell cell-product">
                  {total > 0 ? total : ""}
                </Text>
              );
            })}
            <Text className="cell cell-amount">{totalSets()}套</Text>
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
