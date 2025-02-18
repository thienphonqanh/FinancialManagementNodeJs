import { ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'

export interface CashflowReqBody {
  icon: string
  name: string
  isChosen: number
}

export interface UpdateCashflowReqBody {
  cash_flow_id: ObjectId
  icon: string
  name: string
  isChosen?: number
}

export interface DeleteCashflowReqParams extends ParamsDictionary {
  cash_flow_id: string
}

export interface CashflowCategoryReqBody {
  icon: string
  name: string
  cash_flow_id: ObjectId
  parent_id: ObjectId
  sub_category?: []
  cash_flow_type?: number
}

export interface MoneyAccountTypeReqBody {
  icon: string
  name: string
}

export interface RepeatSpendingLimitReqBody {
  name: string
}

export interface UpdateRepeatSpendingLimitReqBody {
  repeat_spending_limit_id: ObjectId
  name: string
}

export interface DeleteRepeatSpendingLimitReqParams extends ParamsDictionary {
  repeat_spending_limit_id: string
}
