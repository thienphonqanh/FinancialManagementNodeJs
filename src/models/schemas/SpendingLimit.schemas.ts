import { Decimal128, ObjectId } from 'mongodb'

interface SpendingLimitType {
  _id?: ObjectId
  amount_of_money: Decimal128
  name: string
  user_id: ObjectId
  cash_flow_category_id: ObjectId[]
  money_account_id: ObjectId[]
  repeat: ObjectId
  start_time: Date
  end_time?: Date
  created_at?: Date
  updated_at?: Date
}

export default class SpendingLimit {
  _id?: ObjectId
  amount_of_money: Decimal128
  name: string
  user_id: ObjectId
  cash_flow_category_id: ObjectId[]
  money_account_id: ObjectId[]
  repeat: ObjectId
  start_time: Date
  end_time: Date | undefined
  created_at: Date
  updated_at: Date

  constructor(spendingLimitType: SpendingLimitType) {
    const date = new Date()
    this._id = spendingLimitType._id
    this.amount_of_money = spendingLimitType.amount_of_money
    this.name = spendingLimitType.name
    this.user_id = spendingLimitType.user_id
    this.cash_flow_category_id = spendingLimitType.cash_flow_category_id
    this.money_account_id = spendingLimitType.money_account_id
    this.repeat = spendingLimitType.repeat
    this.start_time = spendingLimitType.start_time
    this.end_time = spendingLimitType.end_time || undefined
    this.created_at = spendingLimitType.created_at || date
    this.updated_at = spendingLimitType.updated_at || date
  }
}
