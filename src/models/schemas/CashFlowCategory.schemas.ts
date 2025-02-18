import { ObjectId } from 'mongodb'
import { CashFlowType } from '~/constants/enums'

export interface CashFlowCategoryType {
  _id?: ObjectId
  icon: string
  name: string
  cash_flow_id: ObjectId
  cash_flow_type: CashFlowType
  sub_category?: []
  created_at?: Date
  updated_at?: Date
  isChosen?: number
  isExpanded?: number
}

export default class CashFlowCategory {
  _id: ObjectId
  icon: string
  name: string
  cash_flow_id: ObjectId
  cash_flow_type: CashFlowType
  sub_category: []
  created_at: Date
  updated_at: Date
  isChosen: number
  isExpanded: number

  constructor(cashFlowCategoryType: CashFlowCategoryType) {
    const date = new Date()
    this._id = cashFlowCategoryType._id || new ObjectId()
    this.icon = cashFlowCategoryType.icon
    this.name = cashFlowCategoryType.name
    this.cash_flow_id = cashFlowCategoryType.cash_flow_id
    this.cash_flow_type = cashFlowCategoryType.cash_flow_type
    this.sub_category = cashFlowCategoryType.sub_category || []
    this.created_at = cashFlowCategoryType.created_at || date
    this.updated_at = cashFlowCategoryType.updated_at || date
    this.isChosen = cashFlowCategoryType.isChosen || 0 // Được chọn -> mặc định = 0 (không chọn)
    this.isExpanded = cashFlowCategoryType.isExpanded || 1 // Parent category có thể mở rộng -> mặc định = 1 (có thể mở rộng)
  }
}
