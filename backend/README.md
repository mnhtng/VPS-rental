# 1. Relationships in SQLModel

#### ⚠️ IMPORTANT: KHÔNG dùng relationship trực tiếp trong API responses

#### ❌ Return role sẽ bị circular reference: Role → users → role →

#### ✅ Sử dụng schemas từ backend.schemas.roles thay thế

- #### Example: response_model=RoleRead hoặc RoleWithUsers

# 2. SQLModel Relationship

| Loại | Cần bảng trung gian? | Ví dụ          | Relationship                       |
| ---- | -------------------- | -------------- | ---------------------------------- |
| 1:1  | ❌                    | User ↔ Profile | `uselist=False` ở phía không có `FK`                    |
| 1:N  | ❌                    | Role → Users   | `users: list[User]` / `role: Role` |
| N:N  | ✅                    | User ↔ Project | `link_model=UserProjectLink`       |
