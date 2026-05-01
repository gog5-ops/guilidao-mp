import { useState } from "react";
import { View, Text, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useAppStore } from "../../store";
import { updateUser } from "../../services/user";
import "./index.css";

const ROLE_LABEL: Record<string, string> = {
  guide: "导游",
  supplier: "供货商",
  admin: "管理员",
};

export default function Profile() {
  const { user, setUser } = useAppStore();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [wechatId, setWechatId] = useState(user?.wechatId || "");
  const [saving, setSaving] = useState(false);

  if (!user) {
    Taro.reLaunch({ url: "/pages/index/index" });
    return null;
  }

  async function handleSave() {
    if (!name.trim()) {
      Taro.showToast({ title: "请填写姓名", icon: "none" });
      return;
    }
    if (!phone.trim()) {
      Taro.showToast({ title: "请填写手机号", icon: "none" });
      return;
    }
    setSaving(true);
    try {
      await updateUser(user!._id, {
        name: name.trim(),
        phone: phone.trim(),
        wechatId: wechatId.trim(),
      });
      setUser({ ...user!, name: name.trim(), phone: phone.trim(), wechatId: wechatId.trim() });
      Taro.showToast({ title: "保存成功", icon: "success" });
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    setUser(null);
    Taro.reLaunch({ url: "/pages/index/index" });
  }

  return (
    <View className="page">
      <View className="back-bar" onClick={() => Taro.navigateBack()}>
        <Text className="back-arrow">&larr; 返回</Text>
      </View>
      <View className="avatar-section">
        <View className="avatar">{name.slice(0, 1) || "?"}</View>
        <Text className="role-badge">{ROLE_LABEL[user.role] || user.role}</Text>
      </View>

      <View className="form-card">
        <View className="form-group">
          <Text className="form-label">姓名</Text>
          <Input
            className="form-input"
            value={name}
            onInput={(e) => setName(e.detail.value)}
            placeholder="输入姓名"
          />
        </View>
        <View className="form-group">
          <Text className="form-label">手机号</Text>
          <Input
            className="form-input"
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
            placeholder="输入手机号"
            type="number"
          />
        </View>
        <View className="form-group">
          <Text className="form-label">微信号</Text>
          <Input
            className="form-input"
            value={wechatId}
            onInput={(e) => setWechatId(e.detail.value)}
            placeholder="选填"
          />
        </View>
        <View className="form-group">
          <Text className="form-label">注册时间</Text>
          <Text className="form-value">{new Date(user.createdAt).toLocaleDateString("zh-CN")}</Text>
        </View>
      </View>

      <Button className="btn-save" onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "保存修改"}
      </Button>

      <Button className="btn-logout" onClick={handleLogout}>
        退出登录
      </Button>
    </View>
  );
}
