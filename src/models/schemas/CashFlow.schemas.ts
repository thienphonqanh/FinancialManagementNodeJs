import { ObjectId } from 'mongodb'

interface CashFlowType {
  _id?: ObjectId
  icon: string
  name: string
  isChosen?: number // 0: false, 1: true
  created_at?: Date
  updated_at?: Date
}

export default class CashFlow {
  _id: ObjectId
  icon: string
  name: string
  isChosen: number // 0: false, 1: true
  created_at: Date
  updated_at: Date

  constructor(cashFlowType: CashFlowType) {
    const date = new Date()
    this._id = cashFlowType._id || new ObjectId()
    this.icon = cashFlowType.icon
    this.name = cashFlowType.name
    this.isChosen = cashFlowType.isChosen || 0
    this.created_at = cashFlowType.created_at || date
    this.updated_at = cashFlowType.updated_at || date
  }
}
