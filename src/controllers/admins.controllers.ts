import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  CashflowCategoryReqBody,
  CashflowReqBody,
  DeleteCashflowReqParams,
  DeleteRepeatSpendingLimitReqParams,
  MoneyAccountTypeReqBody,
  RepeatSpendingLimitReqBody,
  UpdateCashflowReqBody,
  UpdateRepeatSpendingLimitReqBody
} from '~/models/requests/Admin.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import adminsService from '~/services/admins.services'

export const addCashFlowController = async (
  req: Request<ParamsDictionary, any, CashflowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await adminsService.addCashflow(req.body)
  return res.json({ result })
}

export const updateCashFlowController = async (
  req: Request<ParamsDictionary, any, UpdateCashflowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await adminsService.updateCashflow(req.body)
  return res.json({ result })
}

export const deleteCashFlowController = async (
  req: Request<DeleteCashflowReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { cash_flow_id } = req.params
  const result = await adminsService.deleteCashflow(cash_flow_id)
  return res.json({ result })
}

export const addCashflowCategoryController = async (
  req: Request<ParamsDictionary, any, CashflowCategoryReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await adminsService.addCashflowCategory(req.body)
  return res.json({ result })
}

export const addMoneyAccountTypeController = async (
  req: Request<ParamsDictionary, any, MoneyAccountTypeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await adminsService.addMoneyAccountType(req.body)
  return res.json({ result })
}

export const addRepeatSpendingLimitController = async (
  req: Request<ParamsDictionary, any, RepeatSpendingLimitReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await adminsService.addRepeatSpendingLimit(req.body)
  return res.json({ result })
}

export const updateRepeatSpendingLimitController = async (
  req: Request<ParamsDictionary, any, UpdateRepeatSpendingLimitReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await adminsService.updateRepeatSpendingLimit(req.body)
  return res.json({ result })
}

export const deleteRepeatSpendingLimitController = async (
  req: Request<DeleteRepeatSpendingLimitReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { repeat_spending_limit_id } = req.params
  const result = await adminsService.deleteRepeatSpendingLimit(repeat_spending_limit_id)
  return res.json({ result })
}

export const getInfoRepeatSpendingLimitController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await adminsService.getInfoRepeatSpendingLimit()
  return res.json({ result })
}
