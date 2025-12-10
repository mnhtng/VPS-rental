# Giải pháp xử lý Request Timeout và Race Condition

## Vấn đề gặp phải

### Triệu chứng
```
POST /[locale]/cart 200 in 494705ms
POST /[locale]/cart 200 in 494786ms
...
failed to forward action response [TypeError: fetch failed] {
  [cause]: [Error [HeadersTimeoutError]: Headers Timeout Error] {
    code: 'UND_ERR_HEADERS_TIMEOUT'
  }
}
```

### Nguyên nhân
1. **Fast tab switching**: Khi user chuyển tab nhanh, nhiều requests được tạo ra đồng thời
2. **No cleanup**: Requests không bị cancel khi component unmount
3. **Stale requests**: Requests cũ tiếp tục chờ response dù không còn cần thiết
4. **Connection limit**: Browser có giới hạn số lượng connections đồng thời, requests bị queue lại

### Kết quả
- Next.js server giữ requests pending trong ~8 phút (default timeout)
- Khi response về, client đã ngắt kết nối → `HeadersTimeoutError`
- Server log spam với các request chậm không cần thiết

---

## ⚠️ QUAN TRỌNG: Khi KHÔNG NÊN dùng AbortController

### Phân loại Operations

| Loại | Mô tả | Abort? | Ví dụ |
|------|-------|--------|-------|
| **READ (Idempotent)** | Lấy dữ liệu để hiển thị | ✅ CÓ THỂ abort | `getCartItems()`, `getPlans()`, `getProfile()` |
| **WRITE (Critical)** | Thay đổi dữ liệu quan trọng | ❌ KHÔNG abort | `setupVps()`, `processPayment()`, `sendEmail()` |
| **FIRE-AND-FORGET** | Phải hoàn thành bất kể user action | ❌ KHÔNG abort | Email notifications, VPS provisioning |

### Case Study: `setupVps()` trên trang chủ

```typescript
// ❌ SAI - KHÔNG làm như này cho critical operations
useEffect(() => {
    const controller = new AbortController();
    
    fetchPlans(controller.signal);
    setupVps(controller.signal);  // ❌ Gửi email - KHÔNG NÊN abort!
    
    return () => controller.abort();  // ← Sẽ abort cả email!
}, []);
```

```typescript
// ✅ ĐÚNG - Tách biệt abortable và non-abortable operations
useEffect(() => {
    const controller = new AbortController();
    
    // Abortable: Chỉ lấy data để hiển thị
    fetchPlans(controller.signal);
    
    // Non-abortable: Critical operation - chạy độc lập
    setupVps();  // ← KHÔNG pass signal, phải hoàn thành!
    
    return () => controller.abort();  // Chỉ abort fetchPlans
}, []);
```

### Quy tắc phân biệt

**✅ NÊN dùng AbortController khi:**
- Lấy dữ liệu để render UI (GET requests)
- User navigate đi → data không còn cần
- Polling/subscription có thể cancel
- Search/autocomplete với debounce

**❌ KHÔNG dùng AbortController khi:**
- Gửi email (verification, welcome, invoice)
- Xử lý thanh toán
- Setup/Provision VPS
- Webhook callbacks
- Analytics logging
- Bất kỳ side effect nào PHẢI hoàn thành

### Pattern cho Mixed Operations

```typescript
// page.tsx - Ví dụ trang chủ với cả 2 loại operations
useEffect(() => {
    const controller = new AbortController();
    
    // ===== ABORTABLE OPERATIONS =====
    // User có thể rời trang, data này chỉ dùng cho UI
    const fetchDisplayData = async () => {
        try {
            const result = await getPlans(controller.signal);
            if (controller.signal.aborted) return;
            setPlans(result.data);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            // Handle error...
        }
    };
    
    fetchDisplayData();
    
    // ===== CRITICAL OPERATIONS =====
    // KHÔNG pass signal - PHẢI hoàn thành bất kể user navigation
    // Đây là "fire-and-forget" pattern
    setupVps();  // Gửi email, setup server, etc.
    
    return () => controller.abort();  // Chỉ cancel abortable operations
}, []);
```

### Tại sao `setupVps()` không nên abort?

1. **Business logic**: Email welcome đã được gửi = user đã mua VPS
2. **User expectation**: User mong đợi email dù đã rời trang
3. **Irreversible**: Một khi bắt đầu gửi email, không thể "undo"
4. **Side effects**: Backend đã thực hiện actions (create VPS, send email)
5. **Data integrity**: Abort giữa chừng có thể gây inconsistent state

### Summary Table cho Project này

| Function | Loại | Abort? | Lý do |
|----------|------|--------|-------|
| `getPlans()` | READ | ✅ | Chỉ display data |
| `getCartItems()` | READ | ✅ | Chỉ display data |
| `getAvailablePromotions()` | READ | ✅ | Chỉ display data |
| `getProfile()` | READ | ✅ | Chỉ display data |
| `setupVps()` | CRITICAL | ❌ | Gửi email, provision VPS |
| `processPayment()` | CRITICAL | ❌ | Xử lý thanh toán |
| `proceedToCheckout()` | CRITICAL | ❌ | Tạo order, lock inventory |
| `sendVerificationEmail()` | CRITICAL | ❌ | Gửi email |
| `addToCart()` | WRITE | ⚠️ Tùy | Có thể abort nếu chưa submit |
| `removeCartItem()` | WRITE | ⚠️ Tùy | User action, có thể retry |

## Giải pháp

### Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                         Component                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ useEffect(() => {                                        │    │
│  │   const controller = new AbortController();              │    │
│  │   fetchData(controller.signal);                          │    │
│  │   return () => controller.abort(); // ← CLEANUP          │    │
│  │ }, []);                                                  │    │
│  └────────────────────────┬────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │ signal
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      apiPattern()                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Nhận external signal từ component                      │    │
│  │ • Tạo internal timeout signal (30s)                      │    │
│  │ • Kết hợp cả hai signals                                 │    │
│  │ • Abort nếu: timeout HOẶC component unmount              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chi tiết Implementation

### 1. `utils/pattern.ts` - Core API Handler

```typescript
// Timeout mặc định 30 giây
const DEFAULT_TIMEOUT = 30000;

interface ApiPatternOptions extends RequestInit {
    timeout?: number;
}

export const apiPattern = async (url: string, options: ApiPatternOptions = {}) => {
    const { timeout = DEFAULT_TIMEOUT, signal: externalSignal, ...fetchOptions } = options;

    // Tạo timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

    // Kết hợp signals
    const combinedSignal = externalSignal
        ? createCombinedSignal(externalSignal, timeoutController.signal)
        : timeoutController.signal;

    try {
        // ... fetch logic với combinedSignal
    } finally {
        clearTimeout(timeoutId); // Cleanup timeout
    }
};
```

**Tính năng:**
- ✅ Timeout 30s mặc định (configurable)
- ✅ Kết hợp multiple AbortSignals
- ✅ Tự động cleanup timeout
- ✅ Backward compatible (không cần thay đổi existing code)

### 2. `createCombinedSignal()` - Signal Combiner

```typescript
function createCombinedSignal(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort(signal.reason);
            break;
        }
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }

    return controller.signal;
}
```

**Cách hoạt động:**
- Tạo một signal mới
- Listen tất cả input signals
- Abort ngay khi BẤT KỲ signal nào abort

### 2.1. Khi KHÔNG truyền signal vào `apiPattern()`

**Câu hỏi thường gặp:** Nếu không truyền `signal` khi gọi `apiPattern()`, request có bị abort bởi `createCombinedSignal` không?

**Trả lời: KHÔNG.** Request sẽ **không** bị abort bởi `createCombinedSignal`.

```typescript
// Logic trong apiPattern()
const combinedSignal = externalSignal
    ? createCombinedSignal(externalSignal, timeoutController.signal)
    : timeoutController.signal;
```

**Giải thích:**

| Trường hợp | `externalSignal` | `combinedSignal` | `createCombinedSignal()` |
|------------|------------------|------------------|--------------------------|
| Không truyền signal | `undefined` | `timeoutController.signal` | **KHÔNG được gọi** |
| Có truyền signal | `AbortSignal` | Combined signal | **Được gọi** |

**Ví dụ thực tế:**

```typescript
// ❌ addToCart() - KHÔNG truyền signal
const addToCart = async (payload: AddToCartPayload): Promise<ApiResponse> => {
    const response = await apiPattern(`${API_URL}/cart`, {
        method: 'POST',
        body: JSON.stringify(payload),
        // Không có signal!
    });
    // ...
};
// → Chỉ bị abort khi TIMEOUT (30s)
// → Component unmount KHÔNG ảnh hưởng

// ✅ getCartItems() - CÓ truyền signal
const getCartItems = async (signal?: AbortSignal): Promise<ApiResponse> => {
    const response = await apiPattern(`${API_URL}/cart`, {
        method: 'GET',
        signal,  // ← Có signal
    });
    // ...
};
// → Bị abort khi TIMEOUT hoặc signal.abort()
// → Component unmount SẼ abort request
```

**Tóm tắt:**

| Hook function | Có signal? | Abort bởi timeout? | Abort bởi unmount? |
|---------------|-----------|-------------------|-------------------|
| `addToCart()` | ❌ | ✅ 30s | ❌ |
| `clearCart()` | ❌ | ✅ 30s | ❌ |
| `removeCartItem()` | ❌ | ✅ 30s | ❌ |
| `getCartItems(signal)` | ✅ | ✅ 30s | ✅ |
| `getPlans(signal)` | ✅ | ✅ 30s | ✅ |

> [!NOTE]
> Đây là behavior **mong muốn** cho các write operations như `addToCart`, `checkout`, vv. Bạn không muốn user navigate away rồi request bị hủy giữa chừng.

### 3. Hooks - Signal Passthrough

```typescript
// useProduct.ts
const getCartItems = async (signal?: AbortSignal): Promise<ApiResponse> => {
    const response = await apiPattern(`${API_URL}/cart`, {
        method: 'GET',
        signal,  // Pass signal to apiPattern
    });
    // ...
};

// usePromotion.ts
const getAvailablePromotions = async (signal?: AbortSignal): Promise<ApiResponse> => {
    // Tương tự...
};
```

### 4. Components - Cleanup on Unmount

```typescript
// cart/page.tsx
useEffect(() => {
    const controller = new AbortController();

    fetchCart(controller.signal);
    fetchAvailablePromotions(controller.signal);

    // 🔑 KEY: Cleanup function
    return () => {
        controller.abort();
    };
}, []);

const fetchCart = async (signal?: AbortSignal) => {
    try {
        const result = await getCartItems(signal);
        
        // Bỏ qua nếu đã abort
        if (signal?.aborted) return;
        
        // Process result...
    } catch (error) {
        // Bỏ qua abort errors
        if (error instanceof Error && error.name === 'AbortError') return;
        // Handle other errors...
    }
};
```

---

## Flow Diagram

### Scenario: User chuyển tab nhanh

```
Time    User Action              System Response
─────────────────────────────────────────────────────────

t=0     Navigate to /cart        
        │                        ┌─ fetchCart() starts
        │                        ├─ fetchPromotions() starts
        │                        └─ Requests pending...

t=100ms Navigate to /plans       
        │                        ┌─ Cart component unmounts
        │                        ├─ controller.abort() called
        │                        ├─ All pending requests CANCELED
        │                        └─ New /plans requests start

        ❌ OLD BEHAVIOR:
        - Requests continue for 8+ minutes
        - HeadersTimeoutError when finally complete
        
        ✅ NEW BEHAVIOR:
        - Requests canceled IMMEDIATELY
        - No stale data, no errors
```

---

## Cách sử dụng cho các components khác

### Template

```typescript
'use client';
import { useEffect, useState } from 'react';

const MyComponent = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Tạo AbortController
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                // 2. Pass signal vào API call
                const result = await myApiCall(controller.signal);
                
                // 3. Check abort trước khi update state
                if (controller.signal.aborted) return;
                
                setData(result);
            } catch (error) {
                // 4. Bỏ qua AbortError
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Error:', error);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // 5. Return cleanup function
        return () => controller.abort();
    }, []);

    return <div>{/* ... */}</div>;
};
```

---

## Các hooks cần update (nếu gặp issue tương tự)

| Hook | Functions cần thêm `signal?` |
|------|------------------------------|
| `useProduct` | `getCartItems`, `getCartItemsAmount` |
| `usePromotion` | `getAvailablePromotions` |
| `usePayment` | `proceedToCheckout`, `getPaymentStatus` |
| `useMember` | `getProfile`, `updateProfile` |
| `useProxmox` | Tất cả VPS control functions |

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Request cleanup** | ❌ None | ✅ Automatic on unmount |
| **Timeout** | ❌ 8+ minutes (browser default) | ✅ 30 seconds |
| **Stale requests** | ❌ Continue running | ✅ Canceled immediately |
| **Error handling** | ❌ HeadersTimeoutError | ✅ Graceful abort |
| **Resource usage** | ❌ Blocked connections | ✅ Released immediately |

---

## Testing

1. **Restart dev server**: `npm run dev`
2. **Open Network tab** trong DevTools
3. **Navigate nhanh** giữa các tabs
4. **Observe**: Các requests cũ sẽ hiển thị status "Canceled"
5. **Console**: Không còn spam logs về requests chậm

---

## References

- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React: Fetching data with Effects](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- [Abort Signal Any](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) - Future enhancement
