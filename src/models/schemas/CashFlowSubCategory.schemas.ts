import { ObjectId } from 'mongodb'

export interface CashFlowSubCategoryType {
  _id?: ObjectId
  icon: string
  name: string
  isChosen?: number
  parent_id: ObjectId
}

export default class CashFlowSubCategory {
  _id: ObjectId
  icon: string
  name: string
  isChosen: number
  parent_id: ObjectId

  constructor(cashFlowSubCategoryType: CashFlowSubCategoryType) {
    this._id = cashFlowSubCategoryType._id || new ObjectId()
    this.icon = cashFlowSubCategoryType.icon
    this.name = cashFlowSubCategoryType.name
    this.isChosen = cashFlowSubCategoryType.isChosen || 0 // Được chọn -> mặc định = 0 (không chọn)
    this.parent_id = cashFlowSubCategoryType.parent_id
  }
}
