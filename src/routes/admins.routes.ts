import { Router } from 'express'
import {
  addCashflowCategoryController,
  addCashFlowController,
  addMoneyAccountTypeController,
  updateCashFlowController,
  deleteCashFlowController,
  addRepeatSpendingLimitController,
  updateRepeatSpendingLimitController,
  deleteRepeatSpendingLimitController,
  getInfoRepeatSpendingLimitController
} from '~/controllers/admins.controllers'
import {
  cashFlowCategoryValidator,
  cashFlowValidator,
  moneyAccountTypeValidator,
  updateCashFlowValidator,
  deleteCashFlowValidator,
  repeatSpendingLimitValidator,
  updateRepeatSpendingLimitValidator,
  deleteRepeatSpendingLimitValidator
} from '~/middlewares/admins.middlewares'
import { accessTokenValidator, userRoleValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const adminsRouter = Router()

/**
 * Description. Add new cash flow
 * Path: /add-cash-flow
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { icon: string, name: string }
 */
adminsRouter.post(
  '/add-cash-flow',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  cashFlowValidator,
  wrapRequestHandler(addCashFlowController)
)

/**
 * Description. Update cash flow
 * Path: /update-cash-flow
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: { cash_flow_id: string (ObjectId), CashFlowSchema }
 */
adminsRouter.patch(
  '/update-cash-flow',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  updateCashFlowValidator,
  wrapRequestHandler(updateCashFlowController)
)

/**
 * Description. Delete cash flow
 * Path: /delete-cash-flow
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Params: { cash_flow_id: string (ObjectId) }
 */
adminsRouter.delete(
  '/delete-cash-flow/:cash_flow_id',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  deleteCashFlowValidator,
  wrapRequestHandler(deleteCashFlowController)
)

/**
 * Description. Add new cash flow category
 * Path: /add-cash-flow-category
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { icon: string, name: string, cash_flow_id: string, parent_id: string (sub_category) }
 */
adminsRouter.post(
  '/add-cash-flow-category',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  cashFlowCategoryValidator,
  wrapRequestHandler(addCashflowCategoryController)
)

/**
 * Description. Add new money acccount type
 * Path: /add-money-acccount-type
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { icon: string, name: string }
 */
adminsRouter.post(
  '/add-money-account-type',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  moneyAccountTypeValidator,
  wrapRequestHandler(addMoneyAccountTypeController)
)

/**
 * Description: Get information of all repeat spending limit
 * Path: /repeat-spending-limit
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
adminsRouter.get('/repeat-spending-limit', wrapRequestHandler(getInfoRepeatSpendingLimitController))

/**
 * Description. Add new type of repeat in spending limit
 * Path: /add-repeat-spending-limit
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { name: string }
 */
adminsRouter.post(
  '/add-repeat-spending-limit',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  repeatSpendingLimitValidator,
  wrapRequestHandler(addRepeatSpendingLimitController)
)

/**
 * Description. Update type of repeat in spending limit
 * Path: /update-repeat-spending-limit
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: { repeat_spending_limit_id: string (ObjectId), name: string }
 */
adminsRouter.patch(
  '/update-repeat-spending-limit',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  updateRepeatSpendingLimitValidator,
  wrapRequestHandler(updateRepeatSpendingLimitController)
)

/**
 * Description. Delete type of repeat in spending limit
 * Path: /delete-repeat-spending-limit/:repeat_spending_limit_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { repeat_spending_limit_id: string (ObjectId) }
 */
adminsRouter.delete(
  '/delete-repeat-spending-limit/:repeat_spending_limit_id',
  accessTokenValidator,
  userRoleValidator,
  verifiedUserValidator,
  deleteRepeatSpendingLimitValidator,
  wrapRequestHandler(deleteRepeatSpendingLimitController)
)

export default adminsRouter
