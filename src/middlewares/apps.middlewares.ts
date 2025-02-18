import { ParamSchema, checkSchema } from 'express-validator'
import { ObjectId, WithId } from 'mongodb'
import { APP_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'
import MoneyAccount from '~/models/schemas/MoneyAccount.schemas'
import { TokenPayload } from '~/models/requests/User.requests'
import { Request } from 'express'
import { CashFlowType } from '~/constants/enums'

const accountBalanceSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.ACCOUNT_BALANCE_IS_REQUIRED
  },
  isNumeric: {
    errorMessage: APP_MESSAGES.ACCOUNT_BALANCE_MUST_BE_A_NUMBER
  },
  custom: {
    options: (value) => {
      if (value < 0) {
        throw new Error(APP_MESSAGES.ACCOUNT_BALANCE_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0)
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_NAME_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value, { req }) => {
      /*
        Nếu tồn tại money_account_id trong req.body
        -> Đang update tài khoản tiền
        -> Kiểm tra tên nếu mà không thay đổi thì bỏ qua
      */
      if (req.body.money_account_id) {
        const existingAccount = await databaseService.moneyAccounts.findOne(
          {
            _id: new ObjectId(req.body.money_account_id as string)
          },
          { projection: { name: 1 } }
        )
        if (existingAccount === null) {
          throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
        }
        // Nếu tên tài khoản không thay đổi, không cần kiểm tra trùng lặp
        if (existingAccount.name === value) {
          return true
        }
      }
      const isExist = await databaseService.moneyAccounts.findOne({ name: value })
      if (isExist !== null) {
        throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NAME_IS_EXIST)
      }
      return true
    }
  }
}

const moneyAccountTypeIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_MUST_BELONG_TO_MONEY_ACCOUNT_TYPE
  },
  isString: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_TYPE_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      // Kiểm tra xem id loại tài khoản có hợp lệ không
      const isValid = await databaseService.moneyAccountTypes.findOne({ _id: new ObjectId(value) })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.MONEY_ACCOUNT_TYPE_NOT_FOUND)
      }
      /*
        Kiểm tra nếu là thẻ tín dụng thì phải có credit_limit_number
        -> Nếu không có credit_limit_number thì báo lỗi
        Kiểm tra nếu không phải là tài khoản ngân hàng, thẻ tín dụng thì không được chọn ngân hàng
      */
      if (isValid.name === 'Thẻ tín dụng') {
        if (req.body.credit_limit_number === undefined) {
          throw new Error(APP_MESSAGES.CREDIT_LIMIT_NUMBER_IS_REQUIRED)
        }
      }
      if (isValid.name !== 'Thẻ tín dụng') {
        if (req.body.credit_limit_number !== undefined) {
          throw new Error(APP_MESSAGES.CREDIT_LIMIT_NUMBER_MUST_BELONG_TO_TYPE_CREDIT_CARD)
        }
      }
      if (isValid.name !== 'Tài khoản ngân hàng' && isValid.name !== 'Thẻ tín dụng') {
        if (req.body.select_bank !== undefined) {
          throw new Error(APP_MESSAGES.SELECT_BANK_MUST_BELONG_TO_TYPE_BANK)
        }
      }
      // Lấy user_id từ token sau khi decode
      const { user_id } = req.decoded_authorization as TokenPayload
      // Tạo mảng chứa các tài khoản tiền của user
      let moneyAccounts: MoneyAccount[] = []
      /*
        Nếu tồn tại money_account_id trong req.body
        -> Đang update tài khoản tiền
        -> Kiểm tra nếu loại tài khoản mà không thay đổi thì bỏ qua
      */
      if (req.body.money_account_id !== undefined) {
        // Kiểm tra tài khoản tiền có tồn tại không
        const isValidMoneyAccount = await databaseService.moneyAccounts.findOne(
          {
            _id: new ObjectId(req.body.money_account_id as string)
          },
          { projection: { _id: 0, money_account_type_id: 1 } }
        )
        if (isValidMoneyAccount === null) {
          throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
        }
        /*
           Kiểm tra tài khoản đã tồn tại chưa (1 acc chỉ có các loại tài khoản tiền khác nhau)
           -> $ne: not equal -> bỏ đi trường hợp giá trị money_account_type_id giống với trước khi update
           -> Tức là không check trường hợp money_account_type_id giống với trước khi update
        */
        moneyAccounts = await databaseService.moneyAccounts
          .find(
            {
              user_id: new ObjectId(user_id),
              money_account_type_id: { $ne: isValidMoneyAccount['money_account_type_id'] }
            },
            { projection: { money_account_type_id: 1 } }
          )
          .toArray()
      } else {
        // Kiểm tra tài khoản đã tồn tại chưa (1 acc chỉ có các loại tài khoản tiền khác nhau)
        moneyAccounts = await databaseService.moneyAccounts
          .find({ user_id: new ObjectId(user_id) }, { projection: { money_account_type_id: 1 } })
          .toArray()
      }
      // Nếu không có tài khoản tiền nào của user
      if (moneyAccounts.length === 0) {
        return true
      }
      // Duyệt qua các tài khoản tiền của user
      moneyAccounts.forEach((item) => {
        /* 
          Néu có 1 tài khoản tiền nào của user mà nó trùng với loại tài khoản tiền mà user muốn thêm
          -> Báo lỗi
        */
        if ((item as WithId<MoneyAccount>).money_account_type_id.toString() === value) {
          throw new Error(APP_MESSAGES.MONEY_ACCOUNT_IS_EXIST)
        }
      })
    }
  }
}

const creditLimitNumberSchema: ParamSchema = {
  optional: true,
  isNumeric: {
    errorMessage: APP_MESSAGES.CREDIT_LIMIT_NUMBER_MUST_BE_A_NUMBER
  },
  custom: {
    options: async (value) => {
      if (value <= 0) {
        throw new Error(APP_MESSAGES.CREDIT_LIMIT_NUMBER_MUST_BE_GREATER_THAN_0)
      }
      return true
    }
  }
}

const reportSchema: ParamSchema = {
  optional: true,
  isNumeric: {
    errorMessage: APP_MESSAGES.REPORT_MUST_BE_A_NUMBER
  },
  custom: {
    options: (value) => {
      // Kiểm tra nằm ngoài 0 và 1
      if (value < 0 || value > 1) {
        throw new Error(APP_MESSAGES.REPORT_MUST_BE_0_OR_1)
      }
      return true
    }
  }
}

const moneyAccountId: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
      }
      // Kiểm tra xem id tài khoản tiền có hợp lệ không
      const isValid = await databaseService.moneyAccounts.findOne({ _id: new ObjectId(value) })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
      }
    }
  }
}

const dateSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: APP_MESSAGES.DATE_MUST_BE_ISO8601
  }
}

const expenseRecordIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.EXPENSE_RECORD_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.EXPENSE_RECORD_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.EXPENSE_RECORD_NOT_FOUND)
      }
      // Kiểm tra xem id giao dịch có hợp lệ không
      const isValid = await databaseService.expenseRecords.findOne({ _id: new ObjectId(value) })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.EXPENSE_RECORD_NOT_FOUND)
      }
    }
  }
}

const amountOfMoneySchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.EXPENSE_RECORD_AMOUNT_OF_MONEY_IS_REQUIRED
  },
  isNumeric: {
    errorMessage: APP_MESSAGES.EXPENSE_RECORD_AMOUNT_OF_MONEY_MUST_BE_A_NUMBER
  },
  custom: {
    options: async (value) => {
      if (value < 0) {
        throw new Error(APP_MESSAGES.EXPENSE_RECORD_AMOUNT_OF_MONEY_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0)
      }
      return true
    }
  }
}

const costIncurredSchema: ParamSchema = {
  optional: true,
  notEmpty: {
    errorMessage: APP_MESSAGES.COST_INCURRED_IS_REQUIRED
  },
  isNumeric: {
    errorMessage: APP_MESSAGES.COST_INCURRED_MUST_BE_A_NUMBER
  },
  custom: {
    options: (value, { req }) => {
      if (value < 0) {
        throw new Error(APP_MESSAGES.COST_INCURRED_MUST_BE_GREATER_THAN_OR_EQUAL_TO_0)
      }
      if (req.body.cost_incurred_category_id === undefined) {
        throw new Error(APP_MESSAGES.COST_INCURRED_CATEGORY_ID_IS_REQUIRED)
      }
      return true
    }
  }
}

const cashFlowCategoryIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
      }
      // Kiểm tra xem id hạng mục có hợp lệ không
      const isValid = await databaseService.cashFlowCategories.findOne({
        $or: [{ _id: new ObjectId(value) }, { 'sub_category._id': new ObjectId(value) }]
      })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
      }
      /*
        Kiểm tra loại hạng mục thuộc về thu hay chi
        -> Spending: 0 -> Chi tiền
        -> Revenue: 1 -> Thu tiền
        -> Đối với loại chi tiền thì mới có chi phí phát sinh, chi cho ai, ngày trả nợ (cost_incurred, cost_incurred_category_id, pay_for_who, repayment_date)
        -> Đối với loại thu tiền thì mới có thu tiền từ ai, ngày thu nợ (collect_from_who, debt_collection_date)
      */
      if (isValid.cash_flow_type === CashFlowType.Revenue) {
        if (req.body.cost_incurred !== undefined || req.body.cost_incurred_category_id !== undefined) {
          throw new Error(APP_MESSAGES.COST_INCURRED_MUST_BELONG_TO_SPENDING)
        }
        if (req.body.pay_for_who !== undefined) {
          throw new Error(APP_MESSAGES.PAY_FOR_WHO_MUST_BELONG_TO_SPENDING)
        }
        if (req.body.repayment_date !== undefined) {
          throw new Error(APP_MESSAGES.REPAYMENT_DATE_MUST_BELONG_TO_SPENDING)
        }
      }
      if (isValid.cash_flow_type === CashFlowType.Spending) {
        if (req.body.collect_from_who !== undefined) {
          throw new Error(APP_MESSAGES.COLLECT_FROM_WHO_MUST_BELONG_TO_REVENUE)
        }
        if (req.body.debt_collection_date !== undefined) {
          throw new Error(APP_MESSAGES.DEBT_COLLECTION_DATE_MUST_BELONG_TO_REVENUE)
        }
      }
    }
  }
}

const costIncurredCategoryIdSchema: ParamSchema = {
  optional: true,
  notEmpty: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
      }
      // Kiểm tra xem id hạng mục có hợp lệ không
      const isValid = await databaseService.cashFlowCategories.findOne({
        $or: [{ _id: new ObjectId(value) }, { 'sub_category._id': new ObjectId(value) }]
      })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
      }
    }
  }
}

const startAndEndTimeSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: APP_MESSAGES.TIME_TO_GET_EXPENSE_RECORD_MUST_BE_A_STRING
  },
  custom: {
    options: (value, { req }) => {
      if (req.params && req.params.end_time !== undefined) {
        // reverse() -> đổi định dạng "DD-MM-YYYY" sang "YYYY-MM-DD"
        const start = new Date(value.split('-').reverse().join('-'))
        const end = new Date(req.params.end_time.split('-').reverse().join('-'))
        if (start > end) {
          throw new Error(APP_MESSAGES.END_TIME_MUST_BE_THE_DAY_BEHIN_START_TIME)
        }
      }
      const [day, month, year] = value.split('-').map(Number)
      if (isNaN(day) || isNaN(month) || isNaN(year) || day === undefined || month === undefined || year === undefined) {
        throw new Error(APP_MESSAGES.TIME_IS_NOT_FOUND)
      }
      if (day < 1 || day > 31) {
        throw new Error(APP_MESSAGES.DAY_MUST_BE_BETWEEN_1_AND_31)
      }
      if (month < 1 || month > 12) {
        throw new Error(APP_MESSAGES.MONTH_MUST_BE_BETWEEN_1_AND_12)
      }
      if (year < 2000) {
        throw new Error(APP_MESSAGES.YEAR_MUST_BE_GREATER_THAN_2000)
      }
      if (year > 2100) {
        throw new Error(APP_MESSAGES.YEAR_MUST_BE_LESS_THAN_2100)
      }
      return true
    }
  }
}

const spendingLimitIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.SPENDING_LIMIT_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.SPENDING_LIMIT_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.SPENDING_LIMIT_NOT_FOUND)
      }
      const isValid = await databaseService.spendingLimits.findOne({ _id: new ObjectId(value) })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.SPENDING_LIMIT_NOT_FOUND)
      }
    }
  }
}

const nameOfSpendingLimitSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.SPENDING_LIMIT_NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.SPENDING_LIMIT_NAME_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (req.body.spending_limit_id !== undefined) {
        const checkNameSpendingLimit = await databaseService.spendingLimits.findOne(
          {
            _id: new ObjectId(req.body.spending_limit_id as string)
          },
          { projection: { name: 1 } }
        )
        if (checkNameSpendingLimit === null) {
          throw new Error(APP_MESSAGES.SPENDING_LIMIT_NOT_FOUND)
        }
        if (checkNameSpendingLimit.name === value) {
          return true
        }
      }
      const isExist = await databaseService.spendingLimits.findOne({ name: value })
      if (isExist !== null) {
        throw new Error(APP_MESSAGES.SPENDING_LIMIT_NAME_IS_EXIST)
      }
      return true
    }
  }
}

const repeatSpendingLimitSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.REPEAT_SPENDING_LIMIT_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: APP_MESSAGES.REPEAT_SPENDING_LIMIT_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new Error(APP_MESSAGES.REPEAT_SPENDING_LIMIT_NOT_FOUND)
      }
      const isValid = await databaseService.repeatSpendingLimits.findOne({ _id: new ObjectId(value) })
      if (isValid === null) {
        throw new Error(APP_MESSAGES.REPEAT_SPENDING_LIMIT_NOT_FOUND)
      }
    }
  }
}

const cashFlowCategoryIdSpendingLimitSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_IS_REQUIRED
  },
  isArray: {
    errorMessage: APP_MESSAGES.CASH_FLOW_CATEGORY_ID_MUST_BE_AN_ARRAY
  },
  custom: {
    options: async (value) => {
      await Promise.all(
        value.map(async (item: string) => {
          if (!ObjectId.isValid(item)) {
            throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
          }
          const isValid = await databaseService.cashFlowCategories.findOne({
            $or: [{ _id: new ObjectId(item) }, { 'sub_category._id': new ObjectId(item) }]
          })
          if (isValid === null) {
            throw new Error(APP_MESSAGES.CASH_FLOW_CATEGORY_NOT_FOUND)
          }
        })
      )
    }
  }
}

const moneyAccountIdSpendingLimitSchema: ParamSchema = {
  notEmpty: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_ID_IS_REQUIRED
  },
  isArray: {
    errorMessage: APP_MESSAGES.MONEY_ACCOUNT_ID_MUST_BE_AN_ARRAY
  },
  custom: {
    options: async (value) => {
      await Promise.all(
        value.map(async (item: string) => {
          if (!ObjectId.isValid(item)) {
            throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
          }
          const isValid = await databaseService.moneyAccounts.findOne({ _id: new ObjectId(item) })
          if (isValid === null) {
            throw new Error(APP_MESSAGES.MONEY_ACCOUNT_NOT_FOUND)
          }
        })
      )
    }
  }
}

// Validator cho thêm mới tài khoản tiền
export const moneyAccountValidator = validate(
  checkSchema(
    {
      account_balance: accountBalanceSchema,
      name: nameSchema,
      money_account_type_id: moneyAccountTypeIdSchema,
      credit_limit_number: creditLimitNumberSchema,
      report: reportSchema
    },
    ['body']
  )
)

export const expenseRecordValidator = validate(
  checkSchema(
    {
      amount_of_money: amountOfMoneySchema,
      occur_date: {
        optional: true,
        ...dateSchema
      },
      repayment_date: {
        optional: true,
        ...dateSchema
      },
      debt_collection_date: {
        optional: true,
        ...dateSchema
      },
      cost_incurred: costIncurredSchema,
      pay_for_who: {
        optional: true,
        isString: {
          errorMessage: APP_MESSAGES.PAY_FOR_WHO_MUST_BE_A_STRING
        }
      },
      collect_from_who: {
        optional: true,
        isString: {
          errorMessage: APP_MESSAGES.COLLECT_FROM_WHO_MUST_BE_A_STRING
        }
      },
      cash_flow_category_id: cashFlowCategoryIdSchema,
      cost_incurred_category_id: costIncurredCategoryIdSchema,
      report: reportSchema,
      money_account_id: moneyAccountId
    },
    ['body']
  )
)

export const updateMoneyAccountValidator = validate(
  checkSchema(
    {
      money_account_id: moneyAccountId,
      account_balance: {
        optional: true,
        ...accountBalanceSchema
      },
      name: {
        optional: true,
        ...nameSchema
      },
      money_account_type_id: {
        optional: true,
        ...moneyAccountTypeIdSchema
      },
      credit_limit_number: {
        ...creditLimitNumberSchema
      },
      report: {
        optional: true,
        ...reportSchema
      }
    },
    ['body']
  )
)

export const getInfoMoneyAccountValidator = validate(
  checkSchema(
    {
      money_account_id: moneyAccountId
    },
    ['params']
  )
)

export const getExpenseRecordOfEachMoneyAccountValidator = validate(
  checkSchema(
    {
      money_account_id: moneyAccountId,
      start_time: startAndEndTimeSchema,
      end_time: startAndEndTimeSchema
    },
    ['params']
  )
)

export const getHistoryOfExpenseRecordValidator = validate(
  checkSchema(
    {
      start_time: startAndEndTimeSchema,
      end_time: startAndEndTimeSchema
    },
    ['params']
  )
)

export const deleteExpenseRecordValidator = validate(
  checkSchema(
    {
      expense_record_id: expenseRecordIdSchema
    },
    ['params']
  )
)

export const updateExpenseRecordValidator = validate(
  checkSchema(
    {
      expense_record_id: expenseRecordIdSchema,
      amount_of_money: {
        optional: true,
        ...amountOfMoneySchema
      },
      occur_date: {
        optional: true,
        ...dateSchema
      },
      repayment_date: {
        optional: true,
        ...dateSchema
      },
      debt_collection_date: {
        optional: true,
        ...dateSchema
      },
      cost_incurred: costIncurredSchema,
      pay_for_who: {
        optional: true,
        isString: {
          errorMessage: APP_MESSAGES.PAY_FOR_WHO_MUST_BE_A_STRING
        }
      },
      collect_from_who: {
        optional: true,
        isString: {
          errorMessage: APP_MESSAGES.COLLECT_FROM_WHO_MUST_BE_A_STRING
        }
      },
      cash_flow_category_id: {
        optional: true,
        ...cashFlowCategoryIdSchema
      },
      cost_incurred_category_id: costIncurredCategoryIdSchema,
      report: reportSchema,
      money_account_id: {
        optional: true,
        ...moneyAccountId
      }
    },
    ['body']
  )
)

export const getExpenseRecordForStatisticsValidator = validate(
  checkSchema(
    {
      start_time: startAndEndTimeSchema,
      end_time: startAndEndTimeSchema
    },
    ['params']
  )
)

export const deleteMoneyAccountValidator = validate(checkSchema({ money_account_id: moneyAccountId }, ['params']))

export const spendingLimitValidator = validate(
  checkSchema(
    {
      amount_of_money: amountOfMoneySchema,
      name: nameOfSpendingLimitSchema,
      repeat: repeatSpendingLimitSchema,
      cash_flow_category_id: cashFlowCategoryIdSpendingLimitSchema,
      money_account_id: moneyAccountIdSpendingLimitSchema,
      start_time: dateSchema,
      end_time: {
        optional: true,
        ...dateSchema
      }
    },
    ['body']
  )
)

export const deleteSpendingLimitValidator = validate(
  checkSchema(
    {
      spending_limit_id: spendingLimitIdSchema
    },
    ['params']
  )
)

export const getSpendingLimitValidator = validate(
  checkSchema(
    {
      spending_limit_id: spendingLimitIdSchema
    },
    ['params']
  )
)

export const updateSpendingLimitValidator = validate(
  checkSchema(
    {
      spending_limit_id: spendingLimitIdSchema,
      amount_of_money: {
        optional: true,
        ...amountOfMoneySchema
      },
      name: {
        optional: true,
        ...nameOfSpendingLimitSchema
      },
      repeat: {
        optional: true,
        ...repeatSpendingLimitSchema
      },
      cash_flow_category_id: {
        optional: true,
        ...cashFlowCategoryIdSpendingLimitSchema
      },
      money_account_id: {
        optional: true,
        ...moneyAccountIdSpendingLimitSchema
      },
      start_time: {
        optional: true,
        ...dateSchema
      },
      end_time: {
        optional: true,
        ...dateSchema
      }
    },
    ['body']
  )
)
