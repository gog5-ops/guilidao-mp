import { useEffect, useState } from "react";
import { View, Text, Button, Picker, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getProducts } from "../../../services/product";
import { createOrder, generateOrderNo } from "../../../services/order";
import {
  getDeliveryLocations,
  createDeliveryLocation,
  incrementUsageCount,
} from "../../../services/delivery-location";
import type { Product, DeliveryMethod, DeliveryLocation, OrderItem } from "../../../types";
import { DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

export default function OrderCreate() {
  const router = useRouter();
  const tourId = router.params.tourId || "";
  const { user } = useAppStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("hotel");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [savedLocations, setSavedLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [step, setStep] = useState<"products" | "delivery" | "confirm">("products");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProducts();
    setProducts(data);
    const defaultQty: Record<string, number> = {};
    data.forEach((p) => (defaultQty[p._id] = 0));
    setQuantities(defaultQty);
  }

  function updateQuantity(productId: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  }

  function totalSets() {
    return Object.values(quantities).reduce((sum, q) => sum + q, 0);
  }

  function totalAmount() {
    return products.reduce(
      (sum, p) => sum + (quantities[p._id] || 0) * p.price,
      0
    );
  }

  function buildItems(): OrderItem[] {
    return products
      .filter((p) => (quantities[p._id] || 0) > 0)
      .map((p) => ({
        productId: p._id,
        productName: p.name,
        quantity: quantities[p._id],
        unitPrice: p.price,
        subtotal: quantities[p._id] * p.price,
      }));
  }

  async function loadLocations() {
    const locType = deliveryMethod === "hotel" ? "hotel" : "pickup_point";
    if (deliveryMethod !== "express") {
      const locs = await getDeliveryLocations(locType);
      setSavedLocations(locs);
    } else {
      setSavedLocations([]);
    }
  }

  function handleSelectLocation(loc: DeliveryLocation) {
    setSelectedLocationId(loc._id);
    setDeliveryAddress(loc.address ? `${loc.name} ${loc.address}` : loc.name);
    setShowNewLocation(false);
  }

  async function handleSaveNewLocation() {
    if (!deliveryAddress.trim()) return;
    const locType = deliveryMethod === "hotel" ? "hotel" as const : "pickup_point" as const;
    await createDeliveryLocation({
      name: deliveryAddress.trim(),
      type: locType,
      address: "",
      contactPhone: "",
      isActive: true,
      usageCount: 1,
    });
    await loadLocations();
    setShowNewLocation(false);
    Taro.showToast({ title: "已保存到常用地点", icon: "success" });
  }

  function handleNext() {
    if (totalSets() === 0) {
      Taro.showToast({ title: "请至少选择一件商品", icon: "none" });
      return;
    }
    setStep("delivery");
    loadLocations();
  }

  function handleConfirmDelivery() {
    if (!deliveryAddress.trim()) {
      Taro.showToast({ title: "请填写送货地址", icon: "none" });
      return;
    }
    setStep("confirm");
  }

  async function handleSubmit() {
    if (!user) return;
    try {
      Taro.showLoading({ title: "提交中..." });
      if (selectedLocationId) {
        incrementUsageCount(selectedLocationId);
      }
      await createOrder({
        orderNo: generateOrderNo(),
        tourId,
        guideId: user._id,
        supplierId: "",
        status: "pending",
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        deliveryTime: deliveryTime.trim(),
        totalAmount: totalAmount(),
        items: buildItems(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      Taro.hideLoading();
      Taro.showToast({ title: "提交成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "提交失败", icon: "none" });
    }
  }

  const deliveryMethods: DeliveryMethod[] = ["hotel", "pickup", "express"];

  if (step === "products") {
    return (
      <View className="page">
        <Text className="page-title">选择商品和数量</Text>
        {products.map((p) => (
          <View key={p._id} className="product-row">
            <View className="product-info">
              <Text className="product-name">{p.name}</Text>
              <Text className="product-spec">
                {p.spec} / {p.unit}
              </Text>
            </View>
            <View className="qty-control">
              <View className="qty-btn" onClick={() => updateQuantity(p._id, -1)}>
                <Text>-</Text>
              </View>
              <Text className="qty-value">{quantities[p._id] || 0}</Text>
              <View className="qty-btn" onClick={() => updateQuantity(p._id, 1)}>
                <Text>+</Text>
              </View>
            </View>
          </View>
        ))}
        <View className="summary-bar">
          <Text className="summary-text">
            合计：{totalSets()}套
          </Text>
          <Button className="btn-next" onClick={handleNext}>
            下一步
          </Button>
        </View>
      </View>
    );
  }

  if (step === "delivery") {
    return (
      <View className="page">
        <Text className="page-title">选择送货方式</Text>
        <View className="delivery-options">
          {deliveryMethods.map((m) => (
            <View
              key={m}
              className={`delivery-option ${deliveryMethod === m ? "active" : ""}`}
              onClick={() => {
                setDeliveryMethod(m);
                setSelectedLocationId("");
                setDeliveryAddress("");
                setShowNewLocation(false);
                const locType = m === "hotel" ? "hotel" as const : "pickup_point" as const;
                if (m !== "express") {
                  getDeliveryLocations(locType).then(setSavedLocations);
                } else {
                  setSavedLocations([]);
                }
              }}
            >
              <Text>{DELIVERY_METHOD_MAP[m]}</Text>
            </View>
          ))}
        </View>

        {deliveryMethod !== "express" && savedLocations.length > 0 && (
          <View className="form-group">
            <Text className="label">常用地点（点击选择）</Text>
            <View className="location-list">
              {savedLocations.map((loc) => (
                <View
                  key={loc._id}
                  className={`location-item ${selectedLocationId === loc._id ? "selected" : ""}`}
                  onClick={() => handleSelectLocation(loc)}
                >
                  <Text>{loc.name}</Text>
                </View>
              ))}
              <View
                className="location-item add-new"
                onClick={() => {
                  setSelectedLocationId("");
                  setDeliveryAddress("");
                  setShowNewLocation(true);
                }}
              >
                <Text>+ 输入新地址</Text>
              </View>
            </View>
          </View>
        )}

        {(deliveryMethod === "express" || showNewLocation || savedLocations.length === 0) && (
          <View className="form-group">
            <Text className="label">
              {deliveryMethod === "hotel"
                ? "酒店名称 + 房间号"
                : deliveryMethod === "pickup"
                  ? "自提地点"
                  : "收货地址"}
            </Text>
            <Input
              className="input"
              value={deliveryAddress}
              onInput={(e) => setDeliveryAddress(e.detail.value)}
              placeholder="请输入地址"
            />
            {deliveryMethod !== "express" && showNewLocation && deliveryAddress.trim() && (
              <View className="save-location" onClick={handleSaveNewLocation}>
                <Text>保存到常用地点</Text>
              </View>
            )}
          </View>
        )}

        <View className="form-group">
          <Text className="label">期望送达时间</Text>
          <Input
            className="input"
            value={deliveryTime}
            onInput={(e) => setDeliveryTime(e.detail.value)}
            placeholder="如：今天下午3点前"
          />
        </View>

        <View className="btn-group">
          <Button className="btn-back" onClick={() => setStep("products")}>
            上一步
          </Button>
          <Button className="btn-next" onClick={handleConfirmDelivery}>
            下一步
          </Button>
        </View>
      </View>
    );
  }

  const items = buildItems();
  return (
    <View className="page">
      <Text className="page-title">确认订单</Text>

      <View className="confirm-section">
        <Text className="section-label">商品</Text>
        {items.map((item) => (
          <View key={item.productId} className="confirm-item">
            <Text>{item.productName} × {item.quantity}套</Text>
          </View>
        ))}
        <View className="confirm-total">
          <Text>合计：{totalSets()}套</Text>
        </View>
      </View>

      <View className="confirm-section">
        <Text className="section-label">配送</Text>
        <View className="confirm-item">
          <Text>方式</Text>
          <Text>{DELIVERY_METHOD_MAP[deliveryMethod]}</Text>
        </View>
        <View className="confirm-item">
          <Text>地址</Text>
          <Text>{deliveryAddress}</Text>
        </View>
        {deliveryTime && (
          <View className="confirm-item">
            <Text>时间</Text>
            <Text>{deliveryTime}</Text>
          </View>
        )}
      </View>

      <View className="btn-group">
        <Button className="btn-back" onClick={() => setStep("delivery")}>
          上一步
        </Button>
        <Button className="btn-submit" onClick={handleSubmit}>
          确认提交
        </Button>
      </View>
    </View>
  );
}
