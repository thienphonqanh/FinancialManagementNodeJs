import { ObjectId } from 'mongodb'

interface TypeOfMoneyAccountType {
  _id?: ObjectId
  icon: string
  name: string
  isChosen?: number // 0: false, 1: true
  created_at?: Date
  updated_at?: Date
}

export default class MoneyAccountType {
  _id: ObjectId
  icon: string
  name: string
  isChosen: number // 0: false, 1: true
  created_at: Date
  updated_at: Date

  constructor(moneyAccountType: TypeOfMoneyAccountType) {
    const date = new Date()
    this._id = moneyAccountType._id || new ObjectId()
    this.icon = moneyAccountType.icon
    this.name = moneyAccountType.name
    this.isChosen = moneyAccountType.isChosen || 0
    this.created_at = moneyAccountType.created_at || date
    this.updated_at = moneyAccountType.updated_at || date
  }
}
