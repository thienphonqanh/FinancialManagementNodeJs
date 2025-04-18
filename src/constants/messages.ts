export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email không hợp lệ',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Mật khẩu phải từ 6 đến 50 ký tự',
  PASSWORD_MUST_BE_STRONG:
    'Mật khẩu phải từ 6 đến 50 ký tự và chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Mật khẩu phải từ 6 đến 50 ký tự',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Mật khẩu phải từ 6 đến 50 ký tự và chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Mật khẩu không trùng khớp',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Ngày sinh phải là ISO8601',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
  LOGOUT_SUCCESS: 'Logout success',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  USER_NOT_FOUND: 'Người dùng không hợp lệ',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  USER_NOT_VERIFIED: 'User not verified',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  GET_ME_SUCCESS: 'Lấy thông tin người dùng thành công',
  UPDATE_ME_SUCCESS: 'Sửa thông tin người dùng thành công',
  LOCATION_LENGTH: 'Độ dài địa chỉ phải từ 1 đến 200',
  IMAGE_URL_MUST_BE_STRING: 'Đường dẫn ảnh phải là chuỗi',
  IMAGE_URL_LENGTH: 'Độ dài đường dẫn ảnh phải từ 1 đến 500',
  JOB_LENGTH: 'Độ dài nghề nghiệp phải từ 1 đến 100',
  GENDER_MUST_BE_NUMBER: 'Giới tính phải là số',
  GENDER_MUST_BE_0_OR_1: 'Giới tính phải là 0 hoặc 1',
  AGREE_TO_THE_POLICY_MUST_BE_NUMBER: 'Đồng ý với chính sách phải là số',
  AGREE_TO_THE_POLICY_MUST_BE_0_OR_1: 'Đồng ý với chính sách phải là 0 hoặc 1',
  PHONE_IS_INVALID: 'Số điện thoại không hợp lệ',
  OLD_PASSWORD_NOT_MATCH: 'Mật khẩu cũ không đúng',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công'
} as const

export const ADMINS_MESSAGES = {
  CASH_FLOW_NAME_IS_REQUIRED: 'Tên dòng tiền không được để trống',
  CASH_FLOW_NAME_MUST_BE_A_STRING: 'Tên dòng tiền phải là chuỗi',
  CASH_FLOW_NAME_IS_EXIST: 'Tên dòng tiền đã tồn tại',
  CHOOSE_OR_NOT_MUST_BE_A_NUMBER: 'Đang được chọn hoặc không được chọn phải là số',
  CHOOSE_OR_NOT_MUST_BE_0_OR_1: 'Đang được chọn hoặc không được chọn phải là 0 hoặc 1',
  ICON_PATH_IS_REQUIRED: 'Đường dẫn ảnh không được để trống',
  ICON_PATH_MUST_BE_A_STRING: 'Đường dẫn ảnh phải là chuỗi',
  CASH_FLOW_TYPE_BE_A_NUMBER: 'Loại dòng tiền phải là số',
  CASH_FLOW_TYPE_BE_0_OR_1: 'Loại dòng tiền phải là 0 hoặc 1',
  LOAN_CATEGORY_MUST_CHOOSE_REVENUE_OR_SPENDING: 'Hạng mục vay nợ phải chọn là thu hoặc chi',
  ONLY_LOAN_CATEGORY_MUST_BE_CHOOSE_REVENUE_OR_SPENDING: 'Chỉ hạng mục vay nợ mới phải chọn là thu hoặc chi',
  CASH_FLOW_ID_IS_REQUIRED: 'ID dòng tiền không được để trống',
  CASH_FLOW_ID_MUST_BE_A_STRING: 'ID dòng tiền phải là chuỗi',
  CASH_FLOW_PARENT_CATEGORY_ID_IS_REQUIRED: 'ID hạng mục cha không được để trống',
  CASH_FLOW_CATEGORY_NAME_IS_REQUIRED: 'Tên hạng mục không được để trống',
  CASH_FLOW_CATEGORY_NAME_MUST_BE_A_STRING: 'Tên hạng mục phải là chuỗi',
  CASH_FLOW_CATEGORY_NAME_IS_EXIST: 'Tên hạng mục đã tồn tại',
  CASH_FLOW_CATEGORY_MUST_BELONG_TO_CASH_FLOW: 'Hạng mục phải thuộc về dòng tiền',
  CASH_FLOW_NOT_FOUND: 'Không tìm thấy dòng tiền',
  CASH_FLOW_PARENT_CATEGORY_NOT_FOUND: 'Không tìm thấy hạng mục cha',
  ADD_CASH_FLOW_SUCCESS: 'Thêm dòng tiền thành công',
  UPDATE_CASH_FLOW_SUCCESS: 'Cập nhật dòng tiền thành công',
  DELETE_CASH_FLOW_SUCCESS: 'Xoá dòng tiền thành công',
  ADD_CASH_FLOW_CATEGORY_SUCCESS: 'Thêm hạng mục thành công',
  USER_IS_NOT_ADMIN: 'Bạn không có quyền này',
  MONEY_ACCOUNT_TYPE_NAME_IS_REQUIRED: 'Tên loại tài khoản được để trống',
  MONEY_ACCOUNT_TYPE_NAME_MUST_BE_A_STRING: 'Tên loại tài khoản phải là chuỗi',
  MONEY_ACCOUNT_TYPE_NAME_IS_EXIST: 'Tên loại tài khoản đã tồn tại',
  ADD_MONEY_ACCOUNT_TYPE_SUCCESS: 'Thêm loại tài khoản thành công',
  CAN_NOT_BE_BOTH_A_PARENT_AND_A_CHILD_CATEGORY: 'Không thể vừa là hạng mục cha vừa là hạng mục con',
  MUST_BE_A_PARENT_OR_CHILD_CATEGORY: 'Phải là hạng mục cha hoặc hạng mục con',
  REPEAT_SPENDING_LIMIT_NAME_IS_REQUIRED: 'Tên loại lặp lại hạn mức chi tiêu không được để trống',
  REPEAT_SPENDING_LIMIT_NAME_MUST_BE_A_STRING: 'Tên loại lặp lại hạn mức chi tiêu phải là chuỗi',
  REPEAT_SPENDING_LIMIT_NAME_IS_EXIST: 'Tên loại lặp lại hạn mức chi tiêu đã tồn tại',
  ADD_REPEAT_SPENDING_LIMIT_SUCCESS: 'Thêm loại lặp lại hạn mức chi tiêu thành công',
  UPDATE_REPEAT_SPENDING_LIMIT_SUCCESS: 'Sửa loại lặp lại hạn mức chi tiêu thành công',
  REPEAT_SPENDING_LIMIT_TYPE_NOT_FOUND: 'Không tìm thấy loại lặp lại hạn mức chi tiêu',
  DELETE_REPEAT_SPENDING_LIMIT_SUCCESS: 'Xoá loại lặp lại hạn mức chi tiêu thành công'
} as const

export const APP_MESSAGES = {
  GET_CASH_FLOW_SUCCESS: 'Lấy dòng tiền thành công',
  GET_MONEY_ACCOUNT_SUCCESS: 'Lấy tài khoản tiền thành công',
  GET_MONEY_ACCOUNT_TYPE_SUCCESS: 'Lấy loại tài khoản tiền thành công',
  GET_INFORMATION_OF_MONEY_ACCOUNT_SUCCESS: 'Lấy thông tin tài khoản tiền thành công',
  USER_ID_IS_REQUIRED: 'ID người dùng là bắt buộc',
  USER_ID_MUST_BE_A_STRING: 'ID người dùng phải là chuỗi',
  CREDIT_LIMIT_NUMBER_IS_REQUIRED: 'Hạn mức tín dụng là bắt buộc',
  CREDIT_LIMIT_NUMBER_MUST_BE_A_NUMBER: 'Hạn mức tín dụng phải là số',
  CREDIT_LIMIT_NUMBER_MUST_BE_GREATER_THAN_0: 'Hạn mức tín dụng phải lớn hơn 0',
  DELETE_MONEY_ACCOUNT_SUCCESS: 'Xóa tài khoản thành công',
  REPORT_MUST_BE_A_NUMBER: 'Bao gồm báo cáo phải là số',
  REPORT_MUST_BE_0_OR_1: 'Bao gồm báo cáo phải là 0 hoặc 1',
  ACCOUNT_BALANCE_IS_REQUIRED: 'Số dư tài khoản là bắt buộc',
  ACCOUNT_BALANCE_MUST_BE_A_NUMBER: 'Số dư tài khoản phải là số',
  ACCOUNT_BALANCE_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0: 'Số dư tài khoản phải lớn hơn hoặc bằng 0',
  MONEY_ACCOUNT_NAME_IS_EXIST: 'Tên tài khoản đã tồn tại',
  MONEY_ACCOUNT_MUST_BELONG_TO_MONEY_ACCOUNT_TYPE: 'Phải có loại tài khoản đối với một tài khoản tiền',
  MONEY_ACCOUNT_IS_EXIST: 'Tài khoản tiền đã tồn tại',
  ADD_MONEY_ACCOUNT_SUCCESS: 'Thêm tài khoản tiền thành công',
  MONEY_ACCOUNT_NAME_IS_REQUIRED: 'Tên tài khoản được để trống',
  MONEY_ACCOUNT_NAME_MUST_BE_A_STRING: 'Tên tài khoản phải là chuỗi',
  MONEY_ACCOUNT_TYPE_ID_MUST_BE_A_STRING: 'Loại tài khoản phải là chuỗi',
  MONEY_ACCOUNT_TYPE_NOT_FOUND: 'Loại tài khoản không hợp lệ',
  EXPENSE_RECORD_AMOUNT_OF_MONEY_IS_REQUIRED: 'Số tiền ghi chép là bắt buộc',
  EXPENSE_RECORD_AMOUNT_OF_MONEY_MUST_BE_A_NUMBER: 'Số tiền ghi chép phải là số',
  EXPENSE_RECORD_AMOUNT_OF_MONEY_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0: 'Số tiền ghi chép phải lớn hơn hoặc bằng 0',
  EXPENSE_RECORD_ID_IS_REQUIRED: 'ID bản ghi chép chi tiêu là bắt buộc',
  EXPENSE_RECORD_ID_MUST_BE_A_STRING: 'ID bản ghi chép chi tiêu phải là chuỗi',
  EXPENSE_RECORD_NOT_FOUND: 'ID bản ghi chép chi tiêu không hợp lệ',
  COST_INCURRED_IS_REQUIRED: 'Chi phí phát sinh là bắt buộc',
  COST_INCURRED_MUST_BE_A_NUMBER: 'Chi phí phát sinh phải là số',
  COST_INCURRED_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0: 'Chi phí phát sinh phải lớn hơn hoặc bằng 0',
  COST_INCURRED_MUST_BELONG_TO_SPENDING: 'Chi phí phát sinh phải thuộc về chi tiền',
  COST_INCURRED_CATEGORY_ID_IS_REQUIRED: 'Hạng mục cho chi phí phát sinh là bắt buộc',
  PAY_FOR_WHO_MUST_BE_A_STRING: 'Chi cho ai phải là chuỗi',
  PAY_FOR_WHO_MUST_BELONG_TO_SPENDING: 'Chi cho ai phải thuộc về chi tiền',
  COLLECT_FROM_WHO_MUST_BELONG_TO_REVENUE: 'Thu từ ai phải thuộc về thu tiền',
  COLLECT_FROM_WHO_MUST_BE_A_STRING: 'Thu từ ai phải là chuỗi',
  DATE_MUST_BE_ISO8601: 'Ngày phải là kiểu ISO8601',
  REPAYMENT_DATE_MUST_BELONG_TO_SPENDING: 'Ngày trả nợ phải thuộc về chi tiền',
  DEBT_COLLECTION_DATE_MUST_BELONG_TO_REVENUE: 'Ngày thu nợ phải thuộc về thu tiền',
  CASH_FLOW_CATEGORY_ID_IS_REQUIRED: 'Hạng mục của dòng tiền là bắt buộc',
  CASH_FLOW_CATEGORY_ID_MUST_BE_A_STRING: 'Hạng mục của dòng tiền phải là chuỗi',
  CASH_FLOW_CATEGORY_NOT_FOUND: 'Hạng mục của dòng tiền không hợp lệ',
  MONEY_ACCOUNT_ID_IS_REQUIRED: 'Tài khoản tiền là bắt buộc',
  MONEY_ACCOUNT_ID_MUST_BE_A_STRING: 'Tài khoản tiền phải là chuỗi',
  MONEY_ACCOUNT_NOT_FOUND: 'Tài khoản tiền không hợp lệ',
  TIME_TO_GET_EXPENSE_RECORD_MUST_BE_A_STRING: 'Thời gian lấy bản ghi chi tiêu phải là chuỗi',
  TIME_TO_GET_EXPENSE_RECORD_IS_REQUIRED: 'Thời gian lấy bản ghi chi tiêu là bắt buộc',
  END_TIME_MUST_BE_THE_DAY_BEHIN_START_TIME: 'Thời gian kết thúc phải là ngày phía sau của thời gian bắt đầu',
  DAY_MUST_BE_BETWEEN_1_AND_31: 'Ngày phải từ 1 đến 31',
  MONTH_MUST_BE_BETWEEN_1_AND_12: 'Tháng phải từ 1 đến 12',
  YEAR_MUST_BE_GREATER_THAN_2000: 'Năm phải từ 2000 trở đi',
  YEAR_MUST_BE_LESS_THAN_2100: 'Năm phải từ 2100 trở lại',
  TIME_IS_NOT_FOUND: 'Thời gian không hợp lệ',
  SELECT_BANK_MUST_BELONG_TO_TYPE_BANK: 'Không phải loại tài khoản ngân hàng thi không được chọn ngân hàng',
  CREDIT_LIMIT_NUMBER_MUST_BELONG_TO_TYPE_CREDIT_CARD:
    'Không phải loại thẻ tín dụng thi không được có hạn mức tín dụng',
  ADD_EXPENSE_RECORD_SUCCESS: 'Thêm mới bản ghi chi tiêu thành công',
  UPDATE_EXPENSE_RECORD_SUCCESS: 'Sửa bản ghi chi tiêu thành công',
  DELETE_EXPENSE_RECORD_SUCCESS: 'Xoá bản ghi chi tiêu thành công',
  UPDATE_MONEY_ACCOUNT_SUCCESS: 'Sửa tài khoản tiền thành công',
  SPENDING_LIMIT_NAME_IS_REQUIRED: 'Tên hạn mức chi tiêu không được để trống',
  SPENDING_LIMIT_NAME_MUST_BE_A_STRING: 'Tên hạn mức chi tiêu phải là chuỗi',
  SPENDING_LIMIT_NAME_IS_EXIST: 'Tên hạn mức chi tiêu đã tồn tại',
  REPEAT_SPENDING_LIMIT_ID_IS_REQUIRED: 'ID loại lặp lại hạn mức chi tiêu không được để trống',
  REPEAT_SPENDING_LIMIT_ID_MUST_BE_A_STRING: 'ID loại lặp lại hạn mức chi tiêu phải là chuỗi',
  REPEAT_SPENDING_LIMIT_NOT_FOUND: 'Không tìm thấy loại lặp lại hạn mức chi tiêu',
  ADD_SPENDING_LIMIT_SUCCESS: 'Thêm hạn mức chi tiêu thành công',
  CASH_FLOW_CATEGORY_ID_MUST_BE_AN_ARRAY: 'Hạng mục của dòng tiền phải là mảng các ID',
  MONEY_ACCOUNT_ID_MUST_BE_AN_ARRAY: 'Tài khoản tiền phải là mảng các ID',
  SPENDING_LIMIT_ID_IS_REQUIRED: 'ID hạn mức chi tiêu không được để trống',
  SPENDING_LIMIT_ID_MUST_BE_A_STRING: 'ID hạn mức chi tiêu phải là chuỗi',
  SPENDING_LIMIT_NOT_FOUND: 'Không tìm thấy hạn mức chi tiêu',
  DELETE_SPENDING_LIMIT_SUCCESS: 'Xoá hạn mức chi tiêu thành công',
  UPDATE_SPENDING_LIMIT_SUCCESS: 'Sửa hạn mức chi tiêu thành công'
} as const
