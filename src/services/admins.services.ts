import databaseService from './database.services'
import CashFlowCategory from '~/models/schemas/CashFlowCategory.schemas'
import { ObjectId } from 'mongodb'
import { ADMINS_MESSAGES } from '~/constants/messages'
import CashFlow from '~/models/schemas/CashFlow.schemas'
import CashFlowSubCategory from '~/models/schemas/CashFlowSubCategory.schemas'
import MoneyAccountType from '~/models/schemas/MoneyAccountType.schemas'
import {
  CashflowCategoryReqBody,
  CashflowReqBody,
  MoneyAccountTypeReqBody,
  RepeatSpendingLimitReqBody,
  UpdateCashflowReqBody,
  UpdateRepeatSpendingLimitReqBody
} from '~/models/requests/Admin.requests'
import { CashFlowType } from '~/constants/enums'
import SpendingLimitRepeat from '~/models/schemas/SpendingLimitRepeat.schemas'
class AdminsService {
  // Thêm mới dòng tiền
  async addCashflow(payload: CashflowReqBody) {
    if (payload.isChosen !== undefined) {
      payload.isChosen = parseInt(payload.isChosen.toString())
    }
    const cashFlow = new CashFlow({
      ...payload
    })
    await databaseService.cashFlows.insertOne(cashFlow)
    return ADMINS_MESSAGES.ADD_CASH_FLOW_SUCCESS
  }
  // Update dòng tiền
  async updateCashflow(payload: UpdateCashflowReqBody) {
    if (payload.isChosen !== undefined) {
      payload.isChosen = parseInt(payload.isChosen.toString())
    }
    await databaseService.cashFlows.updateOne({ _id: new ObjectId(payload.cash_flow_id) }, [
      {
        $set: {
          ...payload,
          updated_at: '$$NOW'
        }
      }
    ])
    return ADMINS_MESSAGES.UPDATE_CASH_FLOW_SUCCESS
  }

  // Xoá dòng tiền
  async deleteCashflow(cash_flow_id: string) {
    await databaseService.cashFlows.deleteOne({
      _id: new ObjectId(cash_flow_id)
    })
    return ADMINS_MESSAGES.DELETE_CASH_FLOW_SUCCESS
  }

  // Thêm mới hạng mục theo dòng tiền
  async addCashflowCategory(payload: CashflowCategoryReqBody) {
    // Kiểm tra tồn tại của parent_id -> (sub_category)
    if (payload.parent_id !== undefined) {
      // Thêm mới sub category
      const cashFlowSubCategory = new CashFlowSubCategory({
        icon: payload.icon,
        name: payload.name,
        isChosen: 0, // Mặc định: không chọn
        parent_id: new ObjectId(payload.parent_id)
      })
      await databaseService.cashFlowCategories.findOneAndUpdate({ _id: new ObjectId(payload.parent_id) }, [
        {
          $set: {
            sub_category: {
              $concatArrays: ['$sub_category', [cashFlowSubCategory]]
            }
          }
        }
      ])
      return ADMINS_MESSAGES.ADD_CASH_FLOW_CATEGORY_SUCCESS
    }
    /*
      Kiểm tra loại dòng tiền
      -> Nếu là 'Chi tiền' thì cash_flow_type = 0 (Spending)
      -> Nếu là 'Thu tiền' thì cash_flow_type = 1 (Revenue)
    */
    let cash_flow_type: number = -1
    if (payload.cash_flow_type === undefined) {
      const checkType = await databaseService.cashFlows.findOne(
        { _id: new ObjectId(payload.cash_flow_id) },
        { projection: { name: 1 } }
      )
      if (checkType !== null) {
        checkType.name === 'Chi tiền'
          ? (cash_flow_type = CashFlowType.Spending)
          : (cash_flow_type = CashFlowType.Revenue)
      }
    } else {
      cash_flow_type = payload.cash_flow_type
    }
    // Chuyển sang kiểu số
    cash_flow_type = parseInt(cash_flow_type.toString())
    // Thêm mới parent category
    const cashFlowCategory = new CashFlowCategory({
      icon: payload.icon,
      name: payload.name,
      cash_flow_id: new ObjectId(payload.cash_flow_id),
      cash_flow_type: cash_flow_type
    })
    await databaseService.cashFlowCategories.insertOne(cashFlowCategory)
    return ADMINS_MESSAGES.ADD_CASH_FLOW_CATEGORY_SUCCESS
  }

  // Thêm mới loại tài khoản tiền (tiền mặt, ngân hàng, ...)
  async addMoneyAccountType(payload: MoneyAccountTypeReqBody) {
    const moneyAccountType = new MoneyAccountType({
      icon: payload.icon,
      name: payload.name
    })
    await databaseService.moneyAccountTypes.insertOne(moneyAccountType)
    return ADMINS_MESSAGES.ADD_MONEY_ACCOUNT_TYPE_SUCCESS
  }

  // Thêm mới loại lặp lại của hạn mức chi tiêu
  async addRepeatSpendingLimit(payload: RepeatSpendingLimitReqBody) {
    const repeatSpendingLimit = new SpendingLimitRepeat({
      name: payload.name
    })
    await databaseService.repeatSpendingLimits.insertOne(repeatSpendingLimit)
    return ADMINS_MESSAGES.ADD_REPEAT_SPENDING_LIMIT_SUCCESS
  }

  // Sửa loại lặp lại của hạn mức chi tiêu
  async updateRepeatSpendingLimit(payload: UpdateRepeatSpendingLimitReqBody) {
    await databaseService.repeatSpendingLimits.updateOne({ _id: new ObjectId(payload.repeat_spending_limit_id) }, [
      {
        $set: {
          name: payload.name,
          updated_at: '$$NOW'
        }
      }
    ])
    return ADMINS_MESSAGES.UPDATE_REPEAT_SPENDING_LIMIT_SUCCESS
  }

  // Xoá dòng tiền
  async deleteRepeatSpendingLimit(repeat_spending_limit_id: string) {
    await databaseService.repeatSpendingLimits.deleteOne({
      _id: new ObjectId(repeat_spending_limit_id)
    })
    return ADMINS_MESSAGES.DELETE_REPEAT_SPENDING_LIMIT_SUCCESS
  }

  // Lấy danh sách hạn mức chi tiêu
  async getInfoRepeatSpendingLimit() {
    const result = await databaseService.repeatSpendingLimits
      .find({}, { projection: { created_at: 0, updated_at: 0 } })
      .toArray()
    return result
  }
}

const adminsService = new AdminsService()
export default adminsService
