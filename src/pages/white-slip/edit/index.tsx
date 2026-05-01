import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useAppStore } from "../../../store";
import { getTour } from "../../../services/tour";
import { getRedSlip } from "../../../services/red-slip";
import { getProducts } from "../../../services/product";
import {
  getWhiteSlipByTour,
  createWhiteSlip,
  updateWhiteSlip,
} from "../../../services/white-slip";
import type {
  GuestEntry,
  OrderItem,
  DeliveryMethod,
  RedSlipItem,
  Product,
} from "../../../types";
import { DELIVERY_METHOD_MAP } from "../../../types";
import "./index.css";

interface DisplayProduct {
  _id: string;
  name: string;
  spec: string;
  unit: string;
  price: number; // cents
}

interface CustomItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface GuestState {
  guestNo: string;
  quantities: Record<string, number>;
  editPrices: Record<string, number>;
  customItems: CustomItem[];
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  deliveryTime: string;
  remark: string;
}

let customIdCounter = 0;

function makeGuestNo(index: number): string {
  return String(index + 1).padStart(3, "0");
}

function createEmptyGuest(
  index: number,
  products: DisplayProduct[],
  defaultAddress: string
): GuestState {
  const quantities: Record<string, number> = {};
  const editPrices: Record<string, number> = {};
  products.forEach((p) => {
    quantities[p._id] = 0;
    editPrices[p._id] = p.price;
  });
  return {
    guestNo: makeGuestNo(index),
    quantities,
    editPrices,
    customItems: [],
    deliveryMethod: "delivery",
    deliveryAddress: defaultAddress,
    deliveryTime: "",
    remark: "",
  };
}

function guestEntryToState(
  entry: GuestEntry,
  products: DisplayProduct[]
): GuestState {
  const quantities: Record<string, number> = {};
  const editPrices: Record<string, number> = {};
  products.forEach((p) => {
    quantities[p._id] = 0;
    editPrices[p._id] = p.price;
  });

  const customItems: CustomItem[] = [];
  for (const item of entry.items) {
    const isProduct = products.some((p) => p._id === item.productId);
    if (isProduct) {
      quantities[item.productId] = item.quantity;
      editPrices[item.productId] = item.unitPrice;
    } else {
      customIdCounter += 1;
      customItems.push({
        id: `custom_${customIdCounter}`,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
      });
    }
  }

  return {
    guestNo: entry.guestNo,
    quantities,
    editPrices,
    customItems,
    deliveryMethod: entry.deliveryMethod,
    deliveryAddress: entry.deliveryAddress || "",
    deliveryTime: entry.deliveryTime || "",
    remark: entry.remark || "",
  };
}

function stateToGuestEntry(
  guest: GuestState,
  products: DisplayProduct[]
): GuestEntry {
  const items: OrderItem[] = [];

  for (const p of products) {
    const qty = guest.quantities[p._id] || 0;
    if (qty > 0) {
      const price = guest.editPrices[p._id] || p.price;
      items.push({
        productId: p._id,
        productName: p.name,
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
      });
    }
  }

  for (const c of guest.customItems) {
    if (c.name.trim() && c.quantity > 0) {
      items.push({
        productId: c.id,
        productName: c.name,
        quantity: c.quantity,
        unitPrice: c.price,
        subtotal: c.price * c.quantity,
      });
    }
  }

  return {
    guestNo: guest.guestNo,
    items,
    deliveryMethod: guest.deliveryMethod,
    deliveryAddress: guest.deliveryAddress.trim() || undefined,
    deliveryTime: guest.deliveryTime.trim() || undefined,
    remark: guest.remark.trim() || undefined,
  };
}

function guestTotal(guest: GuestState, products: DisplayProduct[]): number {
  let total = 0;
  for (const p of products) {
    const qty = guest.quantities[p._id] || 0;
    const price = guest.editPrices[p._id] || p.price;
    total += qty * price;
  }
  for (const c of guest.customItems) {
    total += c.price * c.quantity;
  }
  return total;
}

function guestItemCount(guest: GuestState): number {
  let count = Object.values(guest.quantities).reduce((s, q) => s + q, 0);
  count += guest.customItems.reduce((s, c) => s + c.quantity, 0);
  return count;
}

export default function WhiteSlipEdit() {
  const router = useRouter();
  const tourId = router.params.tourId || "";
  const { user } = useAppStore();

  const [displayProducts, setDisplayProducts] = useState<DisplayProduct[]>([]);
  const [guests, setGuests] = useState<GuestState[]>([]);
  const [defaultAddress, setDefaultAddress] = useState("");
  const [redSlipName, setRedSlipName] = useState("");
  const [redSlipId, setRedSlipId] = useState<string | undefined>();
  const [existingSlipId, setExistingSlipId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    let products: DisplayProduct[] = [];

    // Load red slip products or fall back to all products
    if (tourId) {
      try {
        const tour = await getTour(tourId);
        if (tour?.redSlipId) {
          const slip = await getRedSlip(tour.redSlipId);
          if (slip && slip.items.length > 0) {
            setRedSlipName(slip.name);
            setRedSlipId(slip._id);
            products = slip.items.map((si: RedSlipItem) => ({
              _id: si.productId,
              name: si.productName,
              spec: si.spec,
              unit: si.unit,
              price: si.price,
            }));
          }
        }
      } catch {
        // Fall through
      }
    }
    if (products.length === 0) {
      const data = await getProducts();
      products = data.map((p: Product) => ({
        _id: p._id,
        name: p.name,
        spec: p.spec,
        unit: p.unit,
        price: p.price,
      }));
    }
    setDisplayProducts(products);

    // Load existing white slip
    const existing = await getWhiteSlipByTour(tourId);
    if (existing) {
      setExistingSlipId(existing._id);
      setDefaultAddress(existing.defaultAddress || "");
      const guestStates = existing.entries.map((e) =>
        guestEntryToState(e, products)
      );
      setGuests(
        guestStates.length > 0 ? guestStates : [createEmptyGuest(0, products, existing.defaultAddress || "")]
      );
    } else {
      setGuests([createEmptyGuest(0, products, "")]);
    }
    setLoading(false);
  }

  function updateGuest(index: number, updater: (g: GuestState) => GuestState) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? updater(g) : g))
    );
  }

  function updateQuantity(guestIndex: number, productId: string, delta: number) {
    updateGuest(guestIndex, (g) => ({
      ...g,
      quantities: {
        ...g.quantities,
        [productId]: Math.max(0, (g.quantities[productId] || 0) + delta),
      },
    }));
  }

  function handlePriceChange(guestIndex: number, productId: string, val: string) {
    const yuan = parseFloat(val);
    if (!isNaN(yuan)) {
      updateGuest(guestIndex, (g) => ({
        ...g,
        editPrices: { ...g.editPrices, [productId]: Math.round(yuan * 100) },
      }));
    } else if (val === "") {
      updateGuest(guestIndex, (g) => ({
        ...g,
        editPrices: { ...g.editPrices, [productId]: 0 },
      }));
    }
  }

  function addCustomItem(guestIndex: number) {
    customIdCounter += 1;
    updateGuest(guestIndex, (g) => ({
      ...g,
      customItems: [
        ...g.customItems,
        { id: `custom_${customIdCounter}`, name: "", price: 0, quantity: 1 },
      ],
    }));
  }

  function updateCustomItem(
    guestIndex: number,
    itemId: string,
    field: keyof CustomItem,
    value: string | number
  ) {
    updateGuest(guestIndex, (g) => ({
      ...g,
      customItems: g.customItems.map((c) =>
        c.id === itemId ? { ...c, [field]: value } : c
      ),
    }));
  }

  function updateCustomItemPrice(guestIndex: number, itemId: string, yuanStr: string) {
    const yuan = parseFloat(yuanStr);
    if (!isNaN(yuan)) {
      updateCustomItem(guestIndex, itemId, "price", Math.round(yuan * 100));
    } else if (yuanStr === "") {
      updateCustomItem(guestIndex, itemId, "price", 0);
    }
  }

  function updateCustomItemQty(guestIndex: number, itemId: string, delta: number) {
    updateGuest(guestIndex, (g) => ({
      ...g,
      customItems: g.customItems.map((c) =>
        c.id === itemId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
      ),
    }));
  }

  function removeCustomItem(guestIndex: number, itemId: string) {
    updateGuest(guestIndex, (g) => ({
      ...g,
      customItems: g.customItems.filter((c) => c.id !== itemId),
    }));
  }

  function addGuest() {
    setGuests((prev) => [
      ...prev,
      createEmptyGuest(prev.length, displayProducts, defaultAddress),
    ]);
  }

  function removeGuest(index: number) {
    if (guests.length <= 1) {
      Taro.showToast({ title: "至少保留一位游客", icon: "none" });
      return;
    }
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  function computeTotals() {
    let totalAmount = 0;
    let totalQuantity = 0;
    for (const g of guests) {
      totalAmount += guestTotal(g, displayProducts);
      totalQuantity += guestItemCount(g);
    }
    return { totalAmount, totalQuantity };
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const entries = guests.map((g) => stateToGuestEntry(g, displayProducts));
      const { totalAmount, totalQuantity } = computeTotals();
      const now = new Date().toISOString();

      if (existingSlipId) {
        await updateWhiteSlip(existingSlipId, {
          entries,
          defaultAddress: defaultAddress.trim(),
          totalAmount,
          totalQuantity,
          redSlipId,
        });
      } else {
        const id = await createWhiteSlip({
          tourId,
          guideId: user._id,
          redSlipId,
          entries,
          defaultAddress: defaultAddress.trim(),
          totalAmount,
          totalQuantity,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        });
        setExistingSlipId(id);
      }
      Taro.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  const { totalAmount, totalQuantity } = computeTotals();
  const deliveryMethods: DeliveryMethod[] = ["delivery", "express"];

  return (
    <View className="page">
      <Text className="page-title">白单编辑</Text>

      {redSlipName && (
        <Text className="red-slip-hint">红单：{redSlipName}</Text>
      )}

      <View className="default-addr-section">
        <Text className="default-addr-label">默认送货地址</Text>
        <Input
          className="default-addr-input"
          value={defaultAddress}
          onInput={(e) => setDefaultAddress(e.detail.value)}
          placeholder="如：XXX酒店"
        />
      </View>

      {guests.map((guest, gi) => (
        <View key={gi} className="guest-card">
          <View className="guest-card-header">
            <View className="guest-no-edit">
              <Text className="guest-no-label">游客</Text>
              <Input
                className="guest-no-input"
                value={guest.guestNo}
                onInput={(e) =>
                  updateGuest(gi, (g) => ({ ...g, guestNo: e.detail.value }))
                }
                placeholder="编号"
              />
            </View>
            <Text className="guest-delete" onClick={() => removeGuest(gi)}>
              删除
            </Text>
          </View>

          {/* Product rows */}
          {displayProducts.map((p) => {
            const qty = guest.quantities[p._id] || 0;
            const price = guest.editPrices[p._id] || p.price;
            const subtotal = qty * price;
            return (
              <View key={p._id} className="product-row">
                <View className="product-left">
                  <Text className="product-name">{p.name}</Text>
                  <Text className="product-spec">
                    {p.spec} / {p.unit}
                  </Text>
                  <View className="price-edit-row">
                    <Text className="price-label">单价：</Text>
                    <Input
                      className="price-inline-input"
                      type="digit"
                      value={((guest.editPrices[p._id] || 0) / 100).toString()}
                      onInput={(e) =>
                        handlePriceChange(gi, p._id, e.detail.value)
                      }
                    />
                    <Text className="price-yuan">元</Text>
                  </View>
                </View>
                <View className="product-right">
                  <View className="qty-control">
                    <View
                      className="qty-btn"
                      onClick={() => updateQuantity(gi, p._id, -1)}
                    >
                      <Text>-</Text>
                    </View>
                    <Text className="qty-value">{qty}</Text>
                    <View
                      className="qty-btn"
                      onClick={() => updateQuantity(gi, p._id, 1)}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                  {subtotal > 0 && (
                    <Text className="product-subtotal">
                      ¥{(subtotal / 100).toFixed(0)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Custom items */}
          {guest.customItems.map((item) => (
            <View key={item.id} className="custom-item-row">
              <View className="custom-item-fields">
                <Input
                  className="custom-name-input"
                  value={item.name}
                  onInput={(e) =>
                    updateCustomItem(gi, item.id, "name", e.detail.value)
                  }
                  placeholder="商品名称"
                />
                <View className="custom-price-row">
                  <Input
                    className="custom-price-input"
                    value={item.price ? (item.price / 100).toString() : ""}
                    onInput={(e) =>
                      updateCustomItemPrice(gi, item.id, e.detail.value)
                    }
                    placeholder="单价（负数=优惠）"
                  />
                  <Text className="price-yuan">元</Text>
                </View>
              </View>
              <View className="qty-control">
                <View
                  className="qty-btn"
                  onClick={() => updateCustomItemQty(gi, item.id, -1)}
                >
                  <Text>-</Text>
                </View>
                <Text className="qty-value">{item.quantity}</Text>
                <View
                  className="qty-btn"
                  onClick={() => updateCustomItemQty(gi, item.id, 1)}
                >
                  <Text>+</Text>
                </View>
              </View>
              <Text
                className="custom-remove"
                onClick={() => removeCustomItem(gi, item.id)}
              >
                删除
              </Text>
            </View>
          ))}

          <View className="custom-add-btn" onClick={() => addCustomItem(gi)}>
            <Text>+ 自定义商品/优惠</Text>
          </View>

          {/* Delivery section */}
          <View className="guest-delivery">
            <View className="delivery-row">
              <Text className="delivery-label">配送：</Text>
              <View className="delivery-options">
                {deliveryMethods.map((m) => (
                  <Text
                    key={m}
                    className={`delivery-option ${
                      guest.deliveryMethod === m ? "active" : ""
                    }`}
                    onClick={() =>
                      updateGuest(gi, (g) => ({
                        ...g,
                        deliveryMethod: m,
                        deliveryAddress:
                          m === "delivery" ? defaultAddress : g.deliveryAddress,
                      }))
                    }
                  >
                    {DELIVERY_METHOD_MAP[m]}
                  </Text>
                ))}
              </View>
            </View>

            {guest.deliveryMethod === "express" && (
              <Input
                className="delivery-addr-input"
                value={guest.deliveryAddress}
                onInput={(e) =>
                  updateGuest(gi, (g) => ({
                    ...g,
                    deliveryAddress: e.detail.value,
                  }))
                }
                placeholder="请输入快递收货地址"
              />
            )}

            <Input
              className="remark-input"
              value={guest.remark}
              onInput={(e) =>
                updateGuest(gi, (g) => ({ ...g, remark: e.detail.value }))
              }
              placeholder="备注（选填）"
            />
          </View>

          {/* Guest subtotal */}
          <View className="guest-subtotal">
            <Text>小计：{guestItemCount(guest)}套</Text>
            <Text className="guest-subtotal-amount">
              ¥{(guestTotal(guest, displayProducts) / 100).toFixed(0)}
            </Text>
          </View>
        </View>
      ))}

      <View className="add-guest-btn" onClick={addGuest}>
        <Text>+ 添加游客</Text>
      </View>

      {/* Totals */}
      <View className="totals-bar">
        <View className="totals-row">
          <Text>总游客数</Text>
          <Text>{guests.length}人</Text>
        </View>
        <View className="totals-row">
          <Text>总套数</Text>
          <Text>{totalQuantity}套</Text>
        </View>
        <View className="totals-row">
          <Text>总金额</Text>
          <Text className="totals-amount">
            ¥{(totalAmount / 100).toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Bottom save bar */}
      <View className="bottom-bar">
        <View className="btn-save" onClick={saving ? undefined : handleSave}>
          <Text style={{ textAlign: "center", display: "block" }}>
            {saving ? "保存中..." : "保存白单"}
          </Text>
        </View>
      </View>
    </View>
  );
}
