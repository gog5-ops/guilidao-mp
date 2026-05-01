# 数据模型设计

## ER 关系

```
Product ──< OrderItem >── Order ──< OrderNote
                            │
                            ├── Tour
                            └── DeliveryInfo ── DeliveryLocation
```

## 表结构

### Product (商品)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 商品名称（罗汉果、桂圆肉等） |
| description | string | 商品介绍 |
| spec | string | 规格（如 "38克/盒"） |
| price | number | 价格（分） |
| unit | string | 销售单位（如 "4盒/套"） |
| imageUrl | string | 商品图片 |
| isActive | boolean | 是否上架 |
| sortOrder | number | 排序 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### Tour (团次)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| tourCode | string | 团号 |
| date | date | 出团日期 |
| guideId | string | 导游 ID |
| orderCount | number | 订单数 |
| status | enum | draft / submitted / completed |
| createdAt | datetime | 创建时间 |

### Order (订单)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| orderNo | string | 订单编号（白单编号） |
| tourId | string | 团次 ID |
| guideId | string | 下单导游 |
| supplierId | string | 供货商 ID |
| status | enum | pending / confirmed / shipping / delivered |
| deliveryMethod | enum | hotel / pickup / express |
| deliveryLocationId | string | 配送地点 ID（可选） |
| deliveryAddress | string | 自定义地址（快递到家） |
| deliveryTime | string | 期望送达时间 |
| totalAmount | number | 总金额（分） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### OrderItem (订单明细)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| orderId | string | 订单 ID |
| productId | string | 商品 ID |
| productName | string | 商品名称（冗余，防改价后显示错误） |
| quantity | number | 数量 |
| unitPrice | number | 下单时单价（分） |
| subtotal | number | 小计（分） |

### OrderNote (订单备注)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| orderId | string | 订单 ID |
| userId | string | 发送者 ID |
| role | enum | guide / supplier |
| content | string | 备注内容 |
| createdAt | datetime | 创建时间 |

### DeliveryLocation (常用配送地点)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 地点名称（如 "桂林漓江大瀑布饭店"） |
| type | enum | hotel / pickup_point |
| address | string | 详细地址 |
| contactPhone | string | 联系电话 |
| isActive | boolean | 是否启用 |
| usageCount | number | 使用次数（排序用） |

### User (用户)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| openId | string | 微信 OpenID |
| role | enum | guide / supplier / admin |
| name | string | 姓名 |
| phone | string | 手机号 |
| wechatId | string | 微信号（联系用） |
| createdAt | datetime | 创建时间 |

## 索引建议

- Order: `tourId`, `guideId`, `supplierId`, `status`, `createdAt`
- OrderItem: `orderId`, `productId`
- DeliveryLocation: `type`, `usageCount`
