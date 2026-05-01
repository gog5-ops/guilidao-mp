import { useEffect, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useAppStore } from "../../store";
import { login, getUser, createUser } from "../../services/user";
import { getToursByGuide } from "../../services/tour";
import type { Tour, UserRole } from "../../types";
import { TOUR_STATUS_MAP } from "../../types";
import "./index.css";

export default function Index() {
  const { user, setUser } = useAppStore();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doLogin();
  }, []);

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

  async function doLogin() {
    try {
      const { openId } = await login();
      const existingUser = await getUser(openId);
      if (existingUser) {
        setUser(existingUser);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function handleRegister(role: UserRole) {
    try {
      const { openId } = await login();
      const name = role === "guide" ? "导游" : "供货商";
      await createUser(openId, role, name, "");
      const newUser = await getUser(openId);
      setUser(newUser);
    } catch {
      Taro.showToast({ title: "注册失败", icon: "none" });
    }
  }

  async function loadTours() {
    if (!user) return;
    const data = await getToursByGuide(user._id);
    setTours(data);
  }

  function handleCreateTour() {
    Taro.navigateTo({ url: "/pages/tour/create/index" });
  }

  function handleTourDetail(id: string) {
    Taro.navigateTo({ url: `/pages/tour/detail/index?id=${id}` });
  }

  if (loading) {
    return (
      <View className="page-center">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="page-center">
        <View className="brand">
          <Text className="brand-title">桂礼道</Text>
          <Text className="brand-sub">旅游特产销售管理</Text>
        </View>
        <View className="role-select">
          <Text className="role-title">请选择您的身份</Text>
          <Button className="btn-primary" onClick={() => handleRegister("guide")}>
            我是导游
          </Button>
          <Button className="btn-secondary" onClick={() => handleRegister("supplier")}>
            我是供货商
          </Button>
        </View>
      </View>
    );
  }

  if (user.role === "supplier") {
    Taro.switchTab({ url: "/pages/supplier/orders/index" });
    return null;
  }

  return (
    <View className="page">
      <View className="header">
        <Text className="welcome">你好，{user.name}</Text>
        <Button className="btn-create" onClick={handleCreateTour}>
          + 创建团次
        </Button>
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
