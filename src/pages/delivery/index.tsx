import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getOrder, updateDeliveryAddress } from "../../services/order";
import type { DeliveryMethod } from "../../types";
import { DELIVERY_METHOD_MAP } from "../../types";
import "./index.css";

export default function DeliveryEdit() {
  const router = useRouter();
  const orderId = router.params.orderId || "";

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    const order = await getOrder(orderId);
    if (order) {
      setDeliveryMethod(order.deliveryMethod);
      setDeliveryAddress(order.deliveryAddress || "");
      setDeliveryTime(order.deliveryTime || "");
    }
  }

  async function handleSave() {
    if (!deliveryAddress.trim()) {
      Taro.showToast({ title: "请填写地址", icon: "none" });
      return;
    }
    try {
      await updateDeliveryAddress(orderId, {
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        deliveryTime: deliveryTime.trim(),
      });
      Taro.showToast({ title: "已更新", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch {
      Taro.showToast({ title: "更新失败", icon: "none" });
    }
  }

  const methods: DeliveryMethod[] = ["delivery", "express"];

  return (
    <View className="page">
      <View className="delivery-options">
        {methods.map((m) => (
          <View
            key={m}
            className={`option ${deliveryMethod === m ? "active" : ""}`}
            onClick={() => setDeliveryMethod(m)}
          >
            <Text>{DELIVERY_METHOD_MAP[m]}</Text>
          </View>
        ))}
      </View>

      <View className="form-group">
        <Text className="label">
          {deliveryMethod === "delivery" ? "送货地址" : "收货地址"}
        </Text>
        <Input
          className="input"
          value={deliveryAddress}
          onInput={(e) => setDeliveryAddress(e.detail.value)}
          placeholder="请输入地址"
        />
      </View>

      <View className="form-group">
        <Text className="label">期望送达时间</Text>
        <Input
          className="input"
          value={deliveryTime}
          onInput={(e) => setDeliveryTime(e.detail.value)}
          placeholder="如：今天下午3点前"
        />
      </View>

      <Button className="btn-save" onClick={handleSave}>
        保存修改
      </Button>
    </View>
  );
}
