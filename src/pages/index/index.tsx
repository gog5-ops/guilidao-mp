import { useEffect, useState } from "react";
import { View, Text, Input, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../store";
import { getUserByPhone, createUser } from "../../services/user";
import { getToursByGuide } from "../../services/tour";
import type { Tour, UserRole } from "../../types";
import { TOUR_STATUS_MAP } from "../../types";
import "./index.css";

type AuthTab = "login" | "register";

export default function Index() {
  const { user, setUser } = useAppStore();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  // Auth form state
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("guide");

  useEffect(() => {
    if (user?.role === "guide") {
      loadTours();
    }
  }, [user]);

  useDidShow(() => {
    if (user?.role === "guide") {
      loadTours();
    }
  });

  async function handleLogin() {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Taro.showToast({ title: "请输入手机号", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      const found = await getUserByPhone(trimmedPhone);
      if (!found) {
        Taro.showToast({ title: "手机号未注册", icon: "none" });
        setLoading(false);
        return;
      }
      setUser(found);
    } catch {
      Taro.showToast({ title: "登录失败", icon: "none" });
    }
    setLoading(false);
  }

  async function handleRegister() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      Taro.showToast({ title: "请输入姓名", icon: "none" });
      return;
    }
    if (!trimmedPhone) {
      Taro.showToast({ title: "请输入手机号", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      const existing = await getUserByPhone(trimmedPhone);
      if (existing) {
        Taro.showToast({ title: "该手机号已注册", icon: "none" });
        setLoading(false);
        return;
      }
      const openId = `phone_${trimmedPhone}`;
      await createUser(openId, role, trimmedName, trimmedPhone);
      const newUser = await getUserByPhone(trimmedPhone);
      setUser(newUser);
    } catch {
      Taro.showToast({ title: "注册失败", icon: "none" });
    }
    setLoading(false);
  }

  async function loadTours() {
    if (!user) return;
    const data = await getToursByGuide(user._id);
    setTours(data);
  }

  function handleLogout() {
    setUser(null);
    setTours([]);
    setPhone("");
    setName("");
    setAuthTab("login");
  }

  function handleCreateTour() {
    Taro.navigateTo({ url: "/pages/tour/create/index" });
  }

  function handleTourDetail(id: string) {
    Taro.navigateTo({ url: `/pages/tour/detail/index?id=${id}` });
  }

  if (!user) {
    return (
      <View className="page-center">
        <View className="brand">
          <Text className="brand-title">桂礼道</Text>
          <Text className="brand-sub">旅游特产销售管理</Text>
        </View>

        <View className="auth-tabs">
          <Text
            className={`auth-tab ${authTab === "login" ? "active" : ""}`}
            onClick={() => { setAuthTab("login"); setPhone(""); setName(""); }}
          >
            登录
          </Text>
          <Text
            className={`auth-tab ${authTab === "register" ? "active" : ""}`}
            onClick={() => { setAuthTab("register"); setPhone(""); setName(""); }}
          >
            注册
          </Text>
        </View>

        <View className="auth-form">
          {authTab === "register" && (
            <View className="form-group">
              <Text className="form-label">姓名</Text>
              <Input
                className="form-input"
                placeholder="请输入姓名"
                value={name}
                onInput={(e) => setName(e.detail.value)}
              />
            </View>
          )}
          <View className="form-group">
            <Text className="form-label">手机号</Text>
            <Input
              className="form-input"
              type="number"
              placeholder="请输入手机号"
              maxlength={11}
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          {authTab === "register" && (
            <View className="form-group">
              <Text className="form-label">选择角色</Text>
              <View className="role-chips">
                <Text
                  className={`role-chip ${role === "guide" ? "active" : ""}`}
                  onClick={() => setRole("guide")}
                >
                  导游
                </Text>
                <Text
                  className={`role-chip ${role === "supplier" ? "active" : ""}`}
                  onClick={() => setRole("supplier")}
                >
                  供货商
                </Text>
                <Text
                  className={`role-chip ${role === "admin" ? "active" : ""}`}
                  onClick={() => setRole("admin")}
                >
                  管理员
                </Text>
              </View>
            </View>
          )}
          <Button
            className="btn-primary"
            onClick={authTab === "login" ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? "请稍候..." : authTab === "login" ? "登录" : "注册"}
          </Button>
        </View>
      </View>
    );
  }

  if (user.role === "supplier") {
    Taro.reLaunch({ url: "/pages/supplier/orders/index" });
    return null;
  }

  if (user.role === "admin") {
    Taro.reLaunch({ url: "/pages/admin/index" });
    return null;
  }

  return (
    <View className="page">
      <View className="header">
        <View className="header-top">
          <Text className="welcome" onClick={() => Taro.navigateTo({ url: "/pages/profile/index" })}>你好，{user.name} &gt;</Text>
          <Text className="btn-logout" onClick={handleLogout}>退出</Text>
        </View>
        <View className="header-buttons">
          <Button className="btn-create" onClick={handleCreateTour}>
            + 创建团次
          </Button>
          <Button className="btn-history" onClick={() => Taro.navigateTo({ url: "/pages/history/index" })}>
            订单历史
          </Button>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">我的团次</Text>
        {tours.length === 0 ? (
          <View className="empty">
            <Text>暂无团次，点击上方创建</Text>
          </View>
        ) : (
          tours.map((tour) => (
            <View
              key={tour._id}
              className="tour-card"
              onClick={() => handleTourDetail(tour._id)}
            >
              <View className="tour-header">
                <Text className="tour-code">{tour.tourCode}</Text>
                <Text className={`tour-status status-${tour.status}`}>
                  {TOUR_STATUS_MAP[tour.status]}
                </Text>
              </View>
              <View className="tour-info">
                <Text className="tour-date">{tour.date}</Text>
                <Text className="tour-count">{tour.orderCount}单</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
