import { ObjectId } from 'mongodb'

interface SpendingLimitRepeatType {
  _id?: ObjectId
  name: string
  created_at?: Date
  updated_at?: Date
}

export default class SpendingLimitRepeat {
  _id?: ObjectId
  name: string
  created_at: Date
  updated_at: Date

  constructor(spendingLimitRepeatType: SpendingLimitRepeatType) {
    const date = new Date()
    this._id = spendingLimitRepeatType._id
    this.name = spendingLimitRepeatType.name
    this.created_at = spendingLimitRepeatType.created_at || date
    this.updated_at = spendingLimitRepeatType.updated_at || date
  }
}
