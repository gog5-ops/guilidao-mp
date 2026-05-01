import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getProducts } from "../../../services/product";
import { getTour } from "../../../services/tour";
import { getRedSlip } from "../../../services/red-slip";
import { createOrder, generateOrderNo } from "../../../services/order";
import {
  getDeliveryLocations,
  createDeliveryLocation,
  incrementUsageCount,
} from "../../../services/delivery-location";
import type { Product, DeliveryMethod, DeliveryLocation, OrderItem, RedSlip, RedSlipItem } from "../../../types";
import { DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

interface DisplayProduct {
  _id: string;
  name: string;
  spec: string;
  unit: string;
  price: number; // cents, from red slip or product table
}

export default function OrderCreate() {
  const router = useRouter();
  const tourId = router.params.tourId || "";
  const { user } = useAppStore();

  const [displayProducts, setDisplayProducts] = useState<DisplayProduct[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [editPrices, setEditPrices] = useState<Record<string, number>>({});
  const [remark, setRemark] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [savedLocations, setSavedLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [step, setStep] = useState<"products" | "delivery" | "confirm">("products");
  const [redSlipName, setRedSlipName] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    let items: DisplayProduct[] = [];
    // Try to load red slip from tour
    if (tourId) {
      try {
        const tour = await getTour(tourId);
        if (tour?.redSlipId) {
          const slip = await getRedSlip(tour.redSlipId);
          if (slip && slip.items.length > 0) {
            setRedSlipName(slip.name);
            items = slip.items.map((si: RedSlipItem) => ({
              _id: si.productId,
              name: si.productName,
              spec: si.spec,
              unit: si.unit,
              price: si.price,
            }));
          }
        }
      } catch {
        // Fall through to load all products
      }
    }
    // Fallback: load all active products
    if (items.length === 0) {
      const data = await getProducts();
      items = data.map((p: Product) => ({
        _id: p._id,
        name: p.name,
        spec: p.spec,
        unit: p.unit,
        price: p.price,
      }));
    }
    setDisplayProducts(items);
    const defaultQty: Record<string, number> = {};
    const defaultPrices: Record<string, number> = {};
    items.forEach((p) => {
      defaultQty[p._id] = 0;
      defaultPrices[p._id] = p.price;
    });
    setQuantities(defaultQty);
    setEditPrices(defaultPrices);
  }

  function updateQuantity(productId: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  }

  function handlePriceChange(productId: string, val: string) {
    const yuan = parseFloat(val);
    if (!isNaN(yuan)) {
      setEditPrices((prev) => ({ ...prev, [productId]: Math.round(yuan * 100) }));
    } else if (val === "") {
      setEditPrices((prev) => ({ ...prev, [productId]: 0 }));
    }
  }

  function totalSets() {
    return Object.values(quantities).reduce((sum, q) => sum + q, 0);
  }

  function totalAmount() {
    return displayProducts.reduce(
      (sum, p) => sum + (quantities[p._id] || 0) * (editPrices[p._id] || p.price),
      0
    );
  }

  function buildItems(): OrderItem[] {
    return displayProducts
      .filter((p) => (quantities[p._id] || 0) > 0)
      .map((p) => {
        const qty = quantities[p._id];
        const price = editPrices[p._id] || p.price;
        return {
          productId: p._id,
          productName: p.name,
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price,
        };
      });
  }

  async function loadLocations() {
    if (deliveryMethod !== "express") {
      const locs = await getDeliveryLocations();
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
    await createDeliveryLocation({
      name: deliveryAddress.trim(),
      type: "delivery",
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
        remark: remark.trim() || undefined,
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

  const deliveryMethods: DeliveryMethod[] = ["delivery", "express"];

  if (step === "products") {
    return (
      <View className="page">
        <Text className="page-title">选择商品和数量</Text>
        {redSlipName && (
          <Text className="red-slip-hint">红单：{redSlipName}</Text>
        )}
        {displayProducts.map((p) => (
          <View key={p._id} className="product-row">
            <View className="product-info">
              <Text className="product-name">{p.name}</Text>
              <Text className="product-spec">
                {p.spec} / {p.unit}
              </Text>
              <View className="price-edit-row">
                <Text className="price-label">单价：</Text>
                <Input
                  className="price-inline-input"
                  type="digit"
                  value={((editPrices[p._id] || 0) / 100).toString()}
                  onInput={(e) => handlePriceChange(p._id, e.detail.value)}
                />
                <Text className="price-yuan">元</Text>
              </View>
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
            合计：{totalSets()}套 / ¥{(totalAmount() / 100).toFixed(2)}
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
                if (m !== "express") {
                  getDeliveryLocations().then(setSavedLocations);
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
              {deliveryMethod === "delivery" ? "送货地址" : "收货地址"}
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

        <View className="form-group">
          <Text className="label">备注（客人编号等）</Text>
          <Input
            className="input"
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
            placeholder="选填，如客人编号、特殊要求"
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
            <Text>{item.productName} x {item.quantity}套</Text>
            <Text className="total-amount">¥{(item.subtotal / 100).toFixed(2)}</Text>
          </View>
        ))}
        <View className="confirm-total">
          <Text>合计：{totalSets()}套</Text>
          <Text className="total-amount">¥{(totalAmount() / 100).toFixed(2)}</Text>
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
        {remark.trim() && (
          <View className="confirm-item">
            <Text>备注</Text>
            <Text>{remark}</Text>
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
