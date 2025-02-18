### Các thư mục nằm trong src - giải thích chi tiết

- src/constants: Chứa các file chứa các hằng số
- src/middlewares: Chứa các file chứa các hàm xử lý middleware, như validate, check token, ...
- src/controllers: Chứa các file nhận request, gọi đến service để xử lý logic nghiệp vụ, trả về response
- src/services: Chứa các file chứa method gọi đến database để xử lý logic nghiệp vụ
- src/models: Chứa các file chứa các model
- src/routes: Chứa các file chứa các route
- src/utils: Chứa các file chứa các hàm tiện ích, như mã hóa, gửi email, ...

### Chạy dự án trong môi trường dev

```[BASH]
npm run dev
```

### Build dự án TypeScript sang JavaScript cho production

```[BASH]
npm run build
```

```[BASH]
npm run start
```
