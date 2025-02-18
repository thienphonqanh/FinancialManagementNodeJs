import { Request, Response, NextFunction } from 'express'
import { APP_MESSAGES } from '~/constants/messages'
import appServices from '~/services/app.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/User.requests'
import { Decimal128, ObjectId } from 'mongodb'
import {
  DeleteExpenseRecordReqParams,
  DeleteMoneyAccountReqParams,
  DeleteSpendingLimitReqParams,
  ExpenseRecordForStatisticsReqParams,
  ExpenseRecordOfEachMoneyAccountReqParams,
  ExpenseRecordReqBody,
  HistoryOfExpenseRecordReqParams,
  MoneyAccountReqBody,
  SpendingLimitReqBody,
  SpendingLimitReqParams,
  UpdateExpenseRecordReqBody,
  UpdateSpendingLimitReqBody
} from '~/models/requests/App.requests'

export const getCashFlowController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await appServices.getCashFlow()
  return res.json({ message: APP_MESSAGES.GET_CASH_FLOW_SUCCESS, data: data })
}

export const getCashFlowCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await appServices.getCashFlowCategory()
  return res.json({ message: APP_MESSAGES.GET_CASH_FLOW_SUCCESS, result: result })
}

export const getMoneyAccountTypeController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await appServices.getMoneyAccountType()
  return res.json({ message: APP_MESSAGES.GET_MONEY_ACCOUNT_TYPE_SUCCESS, result: result })
}

export const getMoneyAccountController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getMoneyAccount(user_id)
  return res.json({ message: APP_MESSAGES.GET_MONEY_ACCOUNT_SUCCESS, result: result })
}

export const getExpenseRecordForStatisticsController = async (
  req: Request<ExpenseRecordForStatisticsReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getExpenseRecordForStatistics(user_id, req.params)
  return res.json({ result: result })
}

export const getExpenseRecordOfEachMoneyAccountController = async (
  req: Request<ExpenseRecordOfEachMoneyAccountReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getExpenseRecordOfEachMoneyAccount(user_id, req.params)
  return res.json({ result: result })
}

export const getHistoryOfExpenseRecordController = async (
  req: Request<HistoryOfExpenseRecordReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getHistoryOfExpenseRecord(user_id, req.params)
  return res.json({ result: result })
}

export const addMoneyAccountController = async (
  req: Request<ParamsDictionary, any, MoneyAccountReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  req.body.user_id = new ObjectId(user_id)
  const result = await appServices.addMoneyAccount(req.body)
  return res.json({ result })
}

export const addExpenseRecordController = async (
  req: Request<ParamsDictionary, any, ExpenseRecordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  req.body.user_id = new ObjectId(user_id)
  const result = await appServices.addExpenseRecord(req.body)
  return res.json({ result })
}

export const updateExpenseRecordController = async (
  req: Request<ParamsDictionary, any, UpdateExpenseRecordReqBody>,
  res: Response,
  next: NextFunction
) => {
  req.body.occur_date !== undefined ? (req.body.occur_date = new Date(req.body.occur_date)) : undefined
  req.body.debt_collection_date !== undefined
    ? (req.body.debt_collection_date = new Date(req.body.debt_collection_date))
    : undefined
  req.body.repayment_date !== undefined ? (req.body.repayment_date = new Date(req.body.repayment_date)) : undefined
  req.body.cost_incurred_category_id !== undefined
    ? (req.body.cost_incurred_category_id = new ObjectId(req.body.cost_incurred_category_id))
    : undefined
  req.body.amount_of_money !== undefined
    ? (req.body.amount_of_money = new Decimal128(req.body.amount_of_money.toString()))
    : undefined
  req.body.cash_flow_category_id !== undefined
    ? (req.body.cash_flow_category_id = new ObjectId(req.body.cash_flow_category_id))
    : undefined
  req.body.money_account_id !== undefined
    ? (req.body.money_account_id = new ObjectId(req.body.money_account_id))
    : undefined
  req.body.cost_incurred !== undefined
    ? (req.body.cost_incurred = new Decimal128(req.body.cost_incurred.toString()))
    : undefined
  const result = await appServices.updateExpenseRecord(req.body)
  return res.json({ result })
}

export const deleteExpenseRecordController = async (
  req: Request<DeleteExpenseRecordReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.deleteExpenseRecord(user_id, req.params)
  return res.json({ result })
}

export const updateMoneyAccountController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  req.body.user_id = new ObjectId(user_id)
  /*
    Các giá trị ban đầu nhận từ req là string
    -> Chuyển các giá trị cần thiết sang ObjectId hoặc Decimal128
    -> Các giá trị nào không truyền thì là undefined
    -> Gán lại req.body
  */
  req.body.money_account_type_id !== undefined
    ? (req.body.money_account_type_id = new ObjectId(req.body.money_account_type_id as string))
    : undefined
  req.body.account_balance !== undefined
    ? (req.body.account_balance = new Decimal128(req.body.account_balance))
    : undefined
  req.body.credit_limit_number !== undefined
    ? (req.body.credit_limit_number = new Decimal128(req.body.credit_limit_number))
    : undefined
  const result = await appServices.updateMoneyAccount(req.body)
  return res.json({ result })
}

export const getInfoMoneyAccountController = async (req: Request, res: Response, next: NextFunction) => {
  const { money_account_id } = req.params
  const result = await appServices.getInfoMoneyAccount(money_account_id)
  return res.json({ message: APP_MESSAGES.GET_INFORMATION_OF_MONEY_ACCOUNT_SUCCESS, result })
}

export const deleteMoneyAccountController = async (
  req: Request<DeleteMoneyAccountReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.deleteMoneyAccount(user_id, req.params)
  return res.json({ result })
}

export const addSpendingLimitController = async (
  req: Request<ParamsDictionary, any, SpendingLimitReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  req.body.user_id = new ObjectId(user_id)
  const result = await appServices.addSpendingLimit(req.body)
  return res.json({ result })
}

export const deleteSpendingLimitController = async (
  req: Request<DeleteSpendingLimitReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.deleteSpendingLimit(user_id, req.params)
  return res.json({ result })
}

export const getSpendingLimitController = async (
  req: Request<SpendingLimitReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getSpendingLimit(user_id, req.params)
  return res.json({ result })
}

export const getAllSpendingLimitController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.getAllSpendingLimit(user_id)
  return res.json({ result })
}

export const updateSpendingLimitController = async (
  req: Request<ParamsDictionary, any, UpdateSpendingLimitReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await appServices.updateSpendingLimit(user_id, req.body)
  return res.json({ result })
}
