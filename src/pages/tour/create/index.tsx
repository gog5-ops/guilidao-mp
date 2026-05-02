import { useState, useEffect } from "react";
import { View, Text, Input, Picker, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { createTour, generateTourCode } from "../../../services/tour";
import { getActiveRedSlips } from "../../../services/red-slip";
import type { RedSlip } from "../../../types";
import "./index.css";

export default function TourCreate() {
  const { user } = useAppStore();
  const [tourCode, setTourCode] = useState(generateTourCode());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [redSlips, setRedSlips] = useState<RedSlip[]>([]);
  const [selectedSlipIndex, setSelectedSlipIndex] = useState<number>(-1);

  useEffect(() => {
    loadRedSlips();
  }, []);

  async function loadRedSlips() {
    const data = await getActiveRedSlips();
    setRedSlips(data);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!tourCode.trim()) {
      Taro.showToast({ title: "请输入团号", icon: "none" });
      return;
    }

    try {
      const tourData: Parameters<typeof createTour>[0] = {
        tourCode: tourCode.trim(),
        date,
        guideId: user._id,
        orderCount: 0,
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      if (selectedSlipIndex >= 0 && redSlips[selectedSlipIndex]) {
        tourData.redSlipId = redSlips[selectedSlipIndex]._id;
      }
      const tourId = await createTour(tourData);
      Taro.showToast({ title: "创建成功", icon: "success" });
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/tour/detail/index?id=${tourId}`,
        });
      }, 500);
    } catch {
      Taro.showToast({ title: "创建失败", icon: "none" });
    }
  }

  const slipNames = redSlips.map((s) => s.name);

  return (
    <View className="page">
      <View className="back-bar" onClick={() => Taro.navigateBack()}>
        <Text className="back-arrow">&larr; 返回</Text>
      </View>
      <View className="form-group">
        <Text className="label">团号</Text>
        <Input
          className="input"
          value={tourCode}
          onInput={(e) => setTourCode(e.detail.value)}
          placeholder="如 GL20260501-01"
        />
      </View>

      <View className="form-group">
        <Text className="label">出团日期</Text>
        <Picker mode="date" value={date} onChange={(e) => setDate(e.detail.value)}>
          <View className="input">{date}</View>
        </Picker>
      </View>

      <View className="form-group">
        <Text className="label">选择红单</Text>
        <Picker
          mode="selector"
          range={slipNames}
          value={selectedSlipIndex >= 0 ? selectedSlipIndex : 0}
          onChange={(e) => setSelectedSlipIndex(Number(e.detail.value))}
        >
          <View className="input">
            {selectedSlipIndex >= 0
              ? redSlips[selectedSlipIndex].name
              : "请选择红单（可选）"}
          </View>
        </Picker>
        {selectedSlipIndex >= 0 && (
          <Text
            style={{ fontSize: "24px", color: "#999", marginTop: "8px", display: "block" }}
            onClick={() => setSelectedSlipIndex(-1)}
          >
            包含 {redSlips[selectedSlipIndex].items.length} 个商品 | 点击清除选择
          </Text>
        )}
      </View>

      <Button className="btn-submit" onClick={handleSubmit}>
        创建团次
      </Button>
    </View>
  );
}
