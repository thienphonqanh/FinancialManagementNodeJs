export enum UserVerifyStatus {
  Unverified, // Chưa xác thực email, mặc định = 0
  Verified, // Đã xác thực email
  Banned // Bị khoá
}

export enum GenderType {
  Male, // Nam, mặc định = 0
  Female // Nữ
}

export enum IncludedReport {
  Included, // Bao gồm, mặc định = 0
  NotIncluded // Không bao gồm
}

export enum Role {
  User, // Người dùng, mặc định = 0
  Admin // Quản trị viên
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  EmailVerifyToken,
  ForgotPasswordToken
}

export enum CashFlowType {
  Spending, // Chi tiêu, mặc định = 0
  Revenue // Thu
}
