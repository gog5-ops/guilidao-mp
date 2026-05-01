export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/tour/create/index",
    "pages/tour/detail/index",
    "pages/order/create/index",
    "pages/order/detail/index",
    "pages/order/summary/index",
    "pages/supplier/orders/index",
    "pages/supplier/detail/index",
    "pages/delivery/index",
    "pages/notes/index",
    "pages/stats/index",
    "pages/admin/index",
    "pages/product/index",
    "pages/profile/index",
    "pages/red-slip/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#8B5E3C",
    navigationBarTitleText: "桂礼道",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    color: "#999999",
    selectedColor: "#8B5E3C",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
      },
      {
        pagePath: "pages/supplier/orders/index",
        text: "订单",
      },
      {
        pagePath: "pages/stats/index",
        text: "统计",
      },
    ],
  },
});
