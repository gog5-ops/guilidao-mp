import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { getAllRedSlips, createRedSlip, updateRedSlip, toggleRedSlipActive } from "../../services/red-slip";
import { getProducts } from "../../services/product";
import type { RedSlip, RedSlipItem, Product } from "../../types";
import "./index.css";

export default function RedSlipPage() {
  const [slips, setSlips] = useState<RedSlip[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  useDidShow(() => {
    loadData();
  });

  async function loadData() {
    const [slipData, productData] = await Promise.all([
      getAllRedSlips(),
      getProducts(),
    ]);
    setSlips(slipData);
    setProducts(productData);
  }

  function openCreate() {
    setEditId(null);
    setFormName("");
    const defaultPrices: Record<string, number> = {};
    products.forEach((p) => { defaultPrices[p._id] = p.price; });
    setPrices(defaultPrices);
    setSelectedIds(new Set());
    setShowForm(true);
  }

  function openEdit(slip: RedSlip) {
    setEditId(slip._id);
    setFormName(slip.name);
    const ids = new Set(slip.items.map((i) => i.productId));
    setSelectedIds(ids);
    const p: Record<string, number> = {};
    products.forEach((prod) => { p[prod._id] = prod.price; });
    slip.items.forEach((i) => { p[i.productId] = i.price; });
    setPrices(p);
    setShowForm(true);
  }

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handlePriceChange(productId: string, val: string) {
    const yuan = parseFloat(val);
    if (!isNaN(yuan)) {
      setPrices((prev) => ({ ...prev, [productId]: Math.round(yuan * 100) }));
    } else if (val === "") {
      setPrices((prev) => ({ ...prev, [productId]: 0 }));
    }
  }

  function buildItems(): RedSlipItem[] {
    return products
      .filter((p) => selectedIds.has(p._id))
      .map((p) => ({
        productId: p._id,
        productName: p.name,
        price: prices[p._id] || p.price,
        unit: p.unit,
        spec: p.spec,
      }));
  }

  async function handleSave() {
    if (!formName.trim()) {
      Taro.showToast({ title: "请输入红单名称", icon: "none" });
      return;
    }
    if (selectedIds.size === 0) {
      Taro.showToast({ title: "请至少选择一个商品", icon: "none" });
      return;
    }
    const items = buildItems();
    try {
      if (editId) {
        await updateRedSlip(editId, { name: formName.trim(), items });
      } else {
        await createRedSlip({
          name: formName.trim(),
          items,
          isActive: true,
          createdBy: "admin",
          createdAt: new Date().toISOString(),
        });
      }
      setShowForm(false);
      Taro.showToast({ title: editId ? "已更新" : "已创建", icon: "success" });
      await loadData();
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    }
  }

  async function handleToggle(slip: RedSlip) {
    await toggleRedSlipActive(slip._id, !slip.isActive);
    await loadData();
  }

  return (
    <View className="page">
      <Text className="page-title">红单管理</Text>

      <Text className="btn-create" onClick={openCreate}>+ 创建红单</Text>

      {slips.length === 0 ? (
        <View className="empty"><Text>暂无红单</Text></View>
      ) : (
        slips.map((slip) => (
          <View key={slip._id} className="slip-card">
            <View className="slip-header">
              <Text className="slip-name">{slip.name}</Text>
              <Text className={`slip-badge ${slip.isActive ? "active" : "inactive"}`}>
                {slip.isActive ? "启用" : "停用"}
              </Text>
            </View>
            <Text className="slip-info">
              商品：{slip.items.map((i) => i.productName).join("、")}
            </Text>
            <Text className="slip-info">{slip.items.length}个商品</Text>
            <View className="slip-footer">
              <Text className="slip-date">
                {new Date(slip.createdAt).toLocaleDateString("zh-CN")}
              </Text>
              <View className="slip-actions">
                <Text className="btn-edit" onClick={() => openEdit(slip)}>编辑</Text>
                <Text className="btn-toggle" onClick={() => handleToggle(slip)}>
                  {slip.isActive ? "停用" : "启用"}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      {showForm && (
        <View className="form-overlay" onClick={() => setShowForm(false)}>
          <View className="form-panel" onClick={(e) => e.stopPropagation()}>
            <Text className="form-title">{editId ? "编辑红单" : "创建红单"}</Text>

            <View className="form-group">
              <Text className="label">红单名称</Text>
              <Input
                className="input"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
                placeholder="如：桂林经典套餐"
              />
            </View>

            <View className="form-group">
              <Text className="label">选择商品并设置价格</Text>
              <View className="product-check-list">
                {products.map((p) => {
                  const checked = selectedIds.has(p._id);
                  return (
                    <View key={p._id} className="product-check-item">
                      <View
                        className={`check-box ${checked ? "checked" : ""}`}
                        onClick={() => toggleProduct(p._id)}
                      >
                        {checked && <Text className="check-mark">✓</Text>}
                      </View>
                      <View className="check-info" onClick={() => toggleProduct(p._id)}>
                        <Text className="check-name">{p.name}</Text>
                        <Text className="check-spec">{p.spec} / {p.unit}</Text>
                      </View>
                      {checked && (
                        <View className="price-input-wrap">
                          <Input
                            className="price-input"
                            type="digit"
                            value={((prices[p._id] || 0) / 100).toString()}
                            onInput={(e) => handlePriceChange(p._id, e.detail.value)}
                          />
                          <Text className="price-unit">元</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="form-btns">
              <Text className="btn-cancel" onClick={() => setShowForm(false)}>取消</Text>
              <Text className="btn-save" onClick={handleSave}>保存</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
