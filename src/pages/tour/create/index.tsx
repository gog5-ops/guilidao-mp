import { useState } from "react";
import { View, Text, Input, Picker, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { createTour, generateTourCode } from "../../../services/tour";
import "./index.css";

export default function TourCreate() {
  const { user } = useAppStore();
  const [tourCode, setTourCode] = useState(generateTourCode());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit() {
    if (!user) return;
    if (!tourCode.trim()) {
      Taro.showToast({ title: "请输入团号", icon: "none" });
      return;
    }

    try {
      const tourId = await createTour({
        tourCode: tourCode.trim(),
        date,
        guideId: user._id,
        orderCount: 0,
        status: "draft",
        createdAt: new Date().toISOString(),
      });
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

  return (
    <View className="page">
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

      <Button className="btn-submit" onClick={handleSubmit}>
        创建团次
      </Button>
    </View>
  );
}
