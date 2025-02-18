import { Router } from 'express'
import {
  getCashFlowController,
  getCashFlowCategoryController,
  addMoneyAccountController,
  getMoneyAccountTypeController,
  getMoneyAccountController,
  addExpenseRecordController,
  updateMoneyAccountController,
  deleteMoneyAccountController,
  getInfoMoneyAccountController,
  getExpenseRecordForStatisticsController,
  getExpenseRecordOfEachMoneyAccountController,
  getHistoryOfExpenseRecordController,
  deleteExpenseRecordController,
  updateExpenseRecordController,
  addSpendingLimitController,
  deleteSpendingLimitController,
  getSpendingLimitController,
  getAllSpendingLimitController,
  updateSpendingLimitController
} from '~/controllers/app.controller'
import {
  moneyAccountValidator,
  expenseRecordValidator,
  updateMoneyAccountValidator,
  getInfoMoneyAccountValidator,
  getExpenseRecordOfEachMoneyAccountValidator,
  getHistoryOfExpenseRecordValidator,
  deleteExpenseRecordValidator,
  updateExpenseRecordValidator,
  getExpenseRecordForStatisticsValidator,
  deleteMoneyAccountValidator,
  spendingLimitValidator,
  deleteSpendingLimitValidator,
  getSpendingLimitValidator,
  updateSpendingLimitValidator
} from '~/middlewares/apps.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const appsRouter = Router()

/**
 * Description. Get cash flow
 * Path: /get-cash-flow
 * Method: GET
 */
appsRouter.get('/get-cash-flow', wrapRequestHandler(getCashFlowController))

/**
 * Description. Get cash flow category
 * Path: /get-cash-flow-category
 * Method: GET
 */
appsRouter.get('/get-cash-flow-category', wrapRequestHandler(getCashFlowCategoryController))

/**
 * Description. Get money account type
 * Path: /get-money-account-type
 * Method: GET
 */
appsRouter.get('/get-money-account-type', wrapRequestHandler(getMoneyAccountTypeController))

/**
 * Description. Get money account of user
 * Path: /get-money-account
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
appsRouter.get(
  '/get-money-account',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getMoneyAccountController)
)

/**
 * Description. Add new money acccount
 * Path: /add-money-acccount
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {
 *  name: string, account_balance: string (Decimal128),
 *  money_account_type_id: string (ObjectId),
 * (Optional)
 *  description: string, report: string (0 - 1) (enum IncludedReport),
 *  select_bank: string, credit_limit_number: string (Decimal128)
 * }
 */
appsRouter.post(
  '/add-money-account',
  accessTokenValidator,
  verifiedUserValidator,
  moneyAccountValidator,
  wrapRequestHandler(addMoneyAccountController)
)

/**
 * Description. Update money acccount
 * Path: /update-money-acccount
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: { money_account_id: string (ObjectId), MoneyAccountSchema }
 */
appsRouter.patch(
  '/update-money-account',
  accessTokenValidator,
  verifiedUserValidator,
  updateMoneyAccountValidator,
  wrapRequestHandler(updateMoneyAccountController)
)

/**
 * Description: DELETE money account of user
 * Path: /delete-money-account/:money_account_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { money_account_id: string (ObjectId) }
 */
appsRouter.delete(
  '/delete-money-account/:money_account_id',
  accessTokenValidator,
  verifiedUserValidator,
  deleteMoneyAccountValidator,
  wrapRequestHandler(deleteMoneyAccountController)
)

/**
 * Description: Get information of money account
 * Path: /money-account/money-account-id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { money_account_id: string (ObjectId) }
 */
appsRouter.get(
  '/money-account/:money_account_id',
  accessTokenValidator,
  verifiedUserValidator,
  getInfoMoneyAccountValidator,
  wrapRequestHandler(getInfoMoneyAccountController)
)

/**
 * Description. Add new expense record
 * Path: /add-expense-record
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {
 *  amount_of_money: string (Decimal128), cash_flow_category_id: string (ObjectId),
 *  money_account_id: string (ObjectId),
 * (Optional)
 *  description: string, report: number (enum IncludedReport),
 *  occur_date: date, trip_or_event: string, location: string,
 *  pay_for_who: string, collect_from_who: string,
 *  repayment_date: date, debt_collection_date: date,
 *  cost_incurred: string (Decimal128), cost_incurred_category_id: string (ObjectId),
 *  proof_image: string
 * }
 */
appsRouter.post(
  '/add-expense-record',
  accessTokenValidator,
  verifiedUserValidator,
  expenseRecordValidator,
  wrapRequestHandler(addExpenseRecordController)
)

/**
 * Description: Update one record in expense record
 * Path: /update-expense-record
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: { expense_record_id: string (ObjectId), ExpenseRecordSchema }
 */
appsRouter.patch(
  '/update-expense-record',
  accessTokenValidator,
  verifiedUserValidator,
  updateExpenseRecordValidator,
  wrapRequestHandler(updateExpenseRecordController)
)

/**
 * Description: Delete one record in expense record
 * Path: /delete-expense-record/:expense_record_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { expense_record_id: string (ObjectId) }
 */
appsRouter.delete(
  '/delete-expense-record/:expense_record_id',
  accessTokenValidator,
  verifiedUserValidator,
  deleteExpenseRecordValidator,
  wrapRequestHandler(deleteExpenseRecordController)
)

/**
 * Description: Get information of expense record for statistics (filter over time)
 * Path: /expense-record-for-statistics/:start_time?/:end_time?
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { start_time: string (Date dd-MM-yyy), end_time: string (Date dd-MM-yyy) }
 */
appsRouter.get(
  '/expense-record-for-statistics/:start_time?/:end_time?',
  accessTokenValidator,
  verifiedUserValidator,
  getExpenseRecordForStatisticsValidator,
  wrapRequestHandler(getExpenseRecordForStatisticsController)
)

/**
 * Description: Get information of expense record of each money account (filter over time)
 * Path: /expense-record/money-account/:money_account_id/:start_time?/:end_time?
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { money_account_id: string (ObjectId),
 * start_time: string (Date dd-MM-yyy), end_time: string (Date dd-MM-yyy) }
 */
appsRouter.get(
  '/expense-record/money-account/:money_account_id/:start_time?/:end_time?',
  accessTokenValidator,
  verifiedUserValidator,
  getExpenseRecordOfEachMoneyAccountValidator,
  wrapRequestHandler(getExpenseRecordOfEachMoneyAccountController)
)

/**
 * Description: Get information of history of expense record (filter over time)
 * Path: /expense-record/history/:start_time?/:end_time?
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { start_time: string (Date dd-MM-yyy), end_time: string (Date dd-MM-yyy) }
 */
appsRouter.get(
  '/expense-record/history/:start_time?/:end_time?',
  accessTokenValidator,
  verifiedUserValidator,
  getHistoryOfExpenseRecordValidator,
  wrapRequestHandler(getHistoryOfExpenseRecordController)
)

/**
 * Description: Add new spending limit of user
 * Path: /add-spending-limit
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {
 *  amount_of_money: string (Decimal128), name: string,
 *  cash_flow_category_id: array (ObjectId[]), money_account_id: array (ObjectId[]),
 *  repeat: string (ObjectId), start_time: date
 * (Optional)
 *  end_time: date
 * }
 */
appsRouter.post(
  '/add-spending-limit',
  accessTokenValidator,
  verifiedUserValidator,
  spendingLimitValidator,
  wrapRequestHandler(addSpendingLimitController)
)

/**
 * Description: Delete spending limit of user
 * Path: /delete-spending-limit/:spending_limit_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { spending_limit_id: string (ObjectId) }
 */
appsRouter.delete(
  '/delete-spending-limit/:spending_limit_id',
  accessTokenValidator,
  verifiedUserValidator,
  deleteSpendingLimitValidator,
  wrapRequestHandler(deleteSpendingLimitController)
)

/**
 * Description: Get information of spending limit
 * Path: /spending-limit/:spending_limit_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { spending_limit_id: string (ObjectId) }
 */
appsRouter.get(
  '/spending-limit/:spending_limit_id',
  accessTokenValidator,
  verifiedUserValidator,
  getSpendingLimitValidator,
  wrapRequestHandler(getSpendingLimitController)
)

/**
 * Description: Get information of all spending limit
 * Path: /spending-limit
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { spending_limit_id: string (ObjectId) }
 */
appsRouter.get(
  '/spending-limit',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getAllSpendingLimitController)
)

/**
 * Description: Update information of spending limit
 * Path: /update-spending-limit
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: { spending_limit_id: string (ObjectId), SpendingLimitSchema }
 */
appsRouter.patch(
  '/update-spending-limit',
  accessTokenValidator,
  verifiedUserValidator,
  updateSpendingLimitValidator,
  wrapRequestHandler(updateSpendingLimitController)
)

export default appsRouter
