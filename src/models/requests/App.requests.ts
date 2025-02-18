import { Decimal128, ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'
export interface MoneyAccountReqBody {
  name: string
  account_balance: string
  user_id: ObjectId
  money_account_type_id: ObjectId
  description?: string // Optional
  report?: number // Optional
  select_bank?: string // Optional
  credit_limit_number?: string // Optional
}

export interface UpdateMoneyAccountReqBody {
  money_account_id?: ObjectId
  name?: string
  account_balance?: Decimal128
  user_id?: ObjectId
  money_account_type_id?: ObjectId
  description?: string
  report?: number
  select_bank?: string
  credit_limit_number?: Decimal128
}

export interface DeleteMoneyAccountReqBody {
  money_account_id?: ObjectId
  user_id?: ObjectId
}

export interface ExpenseRecordReqBody {
  amount_of_money: string
  cash_flow_category_id: ObjectId
  money_account_id: ObjectId
  user_id: ObjectId
  description?: string
  occur_date?: Date
  trip_or_event?: string
  location?: string
  report?: number
  pay_for_who?: string
  collect_from_who?: string
  borrow_from_who?: string
  repayment_date?: Date
  cost_incurred?: string
  cost_incurred_category_id?: ObjectId
  debtor?: string
  debt_collection_date?: Date
  proof_image?: string
}

export interface UpdateExpenseRecordReqBody {
  expense_record_id?: ObjectId
  amount_of_money?: Decimal128
  cash_flow_category_id?: ObjectId
  money_account_id?: ObjectId
  user_id?: ObjectId
  description?: string
  occur_date?: Date
  trip_or_event?: string
  location?: string
  report?: number
  pay_for_who?: string
  collect_from_who?: string
  borrow_from_who?: string
  repayment_date?: Date
  cost_incurred?: Decimal128
  cost_incurred_category_id?: ObjectId
  debtor?: string
  debt_collection_date?: Date
  proof_image?: string
}

export interface ExpenseRecordOfEachMoneyAccountReqParams extends ParamsDictionary {
  money_account_id: string
  start_time: string
  end_time: string
}

export interface HistoryOfExpenseRecordReqParams extends ParamsDictionary {
  start_time: string
  end_time: string
}

export interface ExpenseRecordForStatisticsReqParams extends ParamsDictionary {
  start_time: string
  end_time: string
}

export interface DeleteExpenseRecordReqParams extends ParamsDictionary {
  expense_record_id: string
}

export interface DeleteMoneyAccountReqParams extends ParamsDictionary {
  money_account_id: string
}

export interface SpendingLimitReqBody {
  amount_of_money: string
  name: string
  user_id: ObjectId
  cash_flow_category_id: ObjectId[]
  money_account_id: ObjectId[]
  repeat: ObjectId
  start_time: Date
  end_time?: Date
}

export interface DeleteSpendingLimitReqParams extends ParamsDictionary {
  spending_limit_id: string
}

export interface SpendingLimitReqParams extends ParamsDictionary {
  spending_limit_id: string
}

export interface UpdateSpendingLimitReqBody {
  spending_limit_id?: ObjectId
  amount_of_money: Decimal128
  name: string
  user_id: ObjectId
  cash_flow_category_id: ObjectId[]
  money_account_id: ObjectId[]
  repeat: ObjectId
  start_time: Date
  end_time?: Date
}
