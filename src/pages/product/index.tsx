import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
} from "../../services/product";
import type { Product } from "../../types";
import "./index.css";

interface ProductForm {
  name: string;
  spec: string;
  priceYuan: string; // display in yuan, store in cents
  unit: string;
  description: string;
  sortOrder: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  spec: "",
  priceYuan: "",
  unit: "",
  description: "",
  sortOrder: "",
  imageUrl: "",
};

function formFromProduct(p: Product): ProductForm {
  return {
    name: p.name,
    spec: p.spec,
    priceYuan: (p.price / 100).toString(),
    unit: p.unit,
    description: p.description,
    sortOrder: p.sortOrder.toString(),
    imageUrl: p.imageUrl,
  };
}

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getAllProducts();
    setProducts(data);
  }

  function handleField(field: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
  }

  function openEdit(product: Product) {
    setShowAdd(false);
    setEditingId(product._id);
    setForm(formFromProduct(product));
  }

  function cancelForm() {
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return "请输入商品名称";
    if (!form.spec.trim()) return "请输入规格";
    const price = parseFloat(form.priceYuan);
    if (isNaN(price) || price <= 0) return "请输入正确的价格";
    if (!form.unit.trim()) return "请输入单位";
    const sort = parseInt(form.sortOrder, 10);
    if (isNaN(sort) || sort < 0) return "请输入正确的排序号";
    return null;
  }

  async function handleSave() {
    const err = validateForm();
    if (err) {
      Taro.showToast({ title: err, icon: "none" });
      return;
    }
    setSaving(true);
    try {
      const priceInCents = Math.round(parseFloat(form.priceYuan) * 100);
      const sortNum = parseInt(form.sortOrder, 10);

      if (editingId) {
        await updateProduct(editingId, {
          name: form.name.trim(),
          spec: form.spec.trim(),
          price: priceInCents,
          unit: form.unit.trim(),
          description: form.description.trim(),
          sortOrder: sortNum,
          imageUrl: form.imageUrl.trim(),
        });
        Taro.showToast({ title: "已更新", icon: "success" });
      } else {
        await createProduct({
          name: form.name.trim(),
          spec: form.spec.trim(),
          price: priceInCents,
          unit: form.unit.trim(),
          description: form.description.trim(),
          sortOrder: sortNum,
          imageUrl: form.imageUrl.trim(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        Taro.showToast({ title: "已添加", icon: "success" });
      }
      cancelForm();
      await loadProducts();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(product: Product) {
    const nextActive = !product.isActive;
    try {
      await toggleProductActive(product._id, nextActive);
      Taro.showToast({
        title: nextActive ? "已上架" : "已下架",
        icon: "success",
      });
      await loadProducts();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  }

  function renderForm(title: string) {
    return (
      <View className="form-card">
        <Text className="form-title">{title}</Text>

        <View className="form-group">
          <Text className="form-label">商品名称</Text>
          <Input
            className="form-input"
            value={form.name}
            onInput={(e) => handleField("name", e.detail.value)}
            placeholder="如：罗汉果"
          />
        </View>

        <View className="form-row">
          <View className="form-group">
            <Text className="form-label">规格</Text>
            <Input
              className="form-input"
              value={form.spec}
              onInput={(e) => handleField("spec", e.detail.value)}
              placeholder="如：38克/盒"
            />
          </View>
          <View className="form-group">
            <Text className="form-label">单位</Text>
            <Input
              className="form-input"
              value={form.unit}
              onInput={(e) => handleField("unit", e.detail.value)}
              placeholder="如：4盒/套"
            />
          </View>
        </View>

        <View className="form-row">
          <View className="form-group">
            <Text className="form-label">价格（元）</Text>
            <Input
              className="form-input"
              type="digit"
              value={form.priceYuan}
              onInput={(e) => handleField("priceYuan", e.detail.value)}
              placeholder="如：120"
            />
          </View>
          <View className="form-group">
            <Text className="form-label">排序号</Text>
            <Input
              className="form-input"
              type="number"
              value={form.sortOrder}
              onInput={(e) => handleField("sortOrder", e.detail.value)}
              placeholder="如：1"
            />
          </View>
        </View>

        <View className="form-group">
          <Text className="form-label">描述</Text>
          <Input
            className="form-input"
            value={form.description}
            onInput={(e) => handleField("description", e.detail.value)}
            placeholder="商品描述..."
          />
        </View>

        <View className="form-actions">
          <Text className="btn-cancel" onClick={cancelForm}>
            取消
          </Text>
          <Text
            className="btn-save"
            onClick={saving ? undefined : handleSave}
          >
            {saving ? "保存中..." : "保存"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="page-header">
        <Text className="page-title">商品管理</Text>
        <Text className="btn-add" onClick={openAdd}>
          + 添加商品
        </Text>
      </View>

      {showAdd && renderForm("添加商品")}

      {products.length === 0 ? (
        <View className="empty">
          <Text>暂无商品</Text>
        </View>
      ) : (
        products.map((product) =>
          editingId === product._id ? (
            <View key={product._id}>{renderForm("编辑商品")}</View>
          ) : (
            <View
              key={product._id}
              className={`product-card${product.isActive ? "" : " inactive"}`}
            >
              <View className="card-header">
                <Text className="product-name">{product.name}</Text>
                <Text
                  className={`badge ${product.isActive ? "badge-active" : "badge-inactive"}`}
                >
                  {product.isActive ? "上架" : "下架"}
                </Text>
              </View>

              <View className="card-info">
                <Text className="info-item">
                  <Text className="info-label">规格</Text>
                  <Text className="info-value">{product.spec}</Text>
                </Text>
                <Text className="info-item">
                  <Text className="info-label">单位</Text>
                  <Text className="info-value">{product.unit}</Text>
                </Text>
                <Text className="info-item">
                  <Text className="info-label">价格</Text>
                  <Text className="price-value">
                    ¥{(product.price / 100).toFixed(2)}
                  </Text>
                </Text>
                <Text className="info-item">
                  <Text className="info-label">排序</Text>
                  <Text className="info-value">{product.sortOrder}</Text>
                </Text>
              </View>

              <View className="card-actions">
                <Text className="btn-edit" onClick={() => openEdit(product)}>
                  编辑
                </Text>
                <Text
                  className={`btn-toggle ${product.isActive ? "deactivate" : "activate"}`}
                  onClick={() => handleToggle(product)}
                >
                  {product.isActive ? "下架" : "上架"}
                </Text>
              </View>
            </View>
          )
        )
      )}
    </View>
  );
}
