import { Decimal128, ObjectId, WithId } from 'mongodb'
import databaseService from './database.services'
import CashFlowCategory, { CashFlowCategoryType } from '~/models/schemas/CashFlowCategory.schemas'
import CashFlowSubCategory, { CashFlowSubCategoryType } from '~/models/schemas/CashFlowSubCategory.schemas'
import MoneyAccount from '~/models/schemas/MoneyAccount.schemas'
import { APP_MESSAGES } from '~/constants/messages'
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
  UpdateMoneyAccountReqBody,
  UpdateSpendingLimitReqBody
} from '~/models/requests/App.requests'
import ExpenseRecord from '~/models/schemas/ExpenseRecord.schemas'
import { CashFlowType, IncludedReport } from '~/constants/enums'
import SpendingLimit from '~/models/schemas/SpendingLimit.schemas'
import { differenceInDays } from 'date-fns'

interface CashFlowCategoryResponseType {
  parent_category: CashFlowCategoryType
  sub_category: CashFlowSubCategoryType[]
}

interface ExpenseRecordForStatistics {
  parent_id: ObjectId
  parent_name: string
  parent_icon: string
  total_money?: Decimal128
  percentage?: string
  items: (ExpenseRecord & { name: string; icon: string; cash_flow_type: number; cash_flow_id: ObjectId })[]
}

interface ExpenseRecordOfEachMoneyAccount {
  date: string
  total_money: Decimal128
  records: ExpenseRecord[]
}

interface ExpenseRecordWithCashFlowType extends ExpenseRecord {
  cash_flow_type?: number
}

class AppServices {
  async getCashFlow() {
    const data = await databaseService.cashFlows.find({}).toArray()
    return data
  }

  async getMoneyAccountType() {
    const result = await databaseService.moneyAccountTypes.find({}).toArray()
    return result
  }

  async getCashFlowCategory() {
    const result: CashFlowCategory[] = await databaseService.cashFlowCategories.find({}).toArray()
    // Tạo các nhóm cash flow
    const spending_money: CashFlowCategoryResponseType[] = [] // Chi tiền
    const revenue_money: CashFlowCategoryResponseType[] = [] // Thu tiền
    const loan_money: CashFlowCategoryResponseType[] = [] // Vay nợ

    // Sử dụng Promise.all để đợi tất cả các promises hoàn thành
    await Promise.all(
      result.map(async (item) => {
        // Lấy tên cash flow
        const cashFlowName = await databaseService.cashFlows.findOne(
          { _id: item.cash_flow_id },
          { projection: { _id: 0, name: 1 } }
        )
        // Tạo value trả về
        const responseValue: CashFlowCategoryResponseType = {
          parent_category: {
            _id: item._id,
            icon: item.icon,
            name: item.name,
            cash_flow_id: item.cash_flow_id,
            cash_flow_type: item.cash_flow_type,
            created_at: item.created_at,
            updated_at: item.updated_at,
            isChosen: item.isChosen,
            isExpanded: item.isExpanded
          },
          sub_category: item.sub_category.map((subItem: CashFlowSubCategory) => ({
            _id: subItem._id,
            icon: subItem.icon,
            name: subItem.name,
            isChosen: subItem.isChosen,
            parent_id: subItem.parent_id
          }))
        }
        // Kiểm tra cash_flow
        if (cashFlowName?.name === 'Chi tiền') {
          spending_money.push(responseValue)
        } else if (cashFlowName?.name === 'Thu tiền') {
          revenue_money.push(responseValue)
        } else {
          loan_money.push(responseValue)
        }
      })
    )

    return {
      spending_money: spending_money,
      revenue_money: revenue_money,
      loan_money: loan_money
    }
  }

  // Thêm mới loại tài khoản tiền (tiền mặt, ngân hàng, ...)
  async addMoneyAccount(payload: MoneyAccountReqBody) {
    if (payload.report !== undefined && (payload.report.toString() === '0' || payload.report.toString() === '1')) {
      payload.report = parseInt(payload.report.toString())
    }
    const moneyAccount = new MoneyAccount({
      ...payload,
      user_id: new ObjectId(payload.user_id),
      money_account_type_id: new ObjectId(payload.money_account_type_id),
      account_balance: new Decimal128(payload.account_balance),
      credit_limit_number: new Decimal128(payload.credit_limit_number || '0')
    })
    await databaseService.moneyAccounts.insertOne(moneyAccount)
    return APP_MESSAGES.ADD_MONEY_ACCOUNT_SUCCESS
  }

  // Lấy danh sách các tài khoản tiền của người dùng
  async getMoneyAccount(user_id: string) {
    const result = await databaseService.moneyAccounts
      .aggregate([
        {
          $match: {
            user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'money_account_types',
            localField: 'money_account_type_id', // Trường trong moneyAccounts
            foreignField: '_id', // Trường trong money_account_types
            as: 'money_type_information' // Tên trường kết quả join
          }
        },
        {
          $unwind: '$money_type_information' // Dùng để "mở" mảng money_type_information ra để truy cập các trường bên trong.
        },
        {
          // Chỉ định các trường mà bạn muốn bao gồm trong kết quả cuối cùng
          $project: {
            _id: 1,
            name: 1,
            account_balance: 1,
            user_id: 1,
            money_account_type_id: 1,
            description: 1,
            report: 1,
            select_bank: 1,
            credit_limit_number: 1,
            'money_type_information.icon': 1,
            'money_type_information.name': 1
          }
        }
      ])
      .toArray()

    return result
  }

  // Thêm mới bản ghi chi tiêu
  async addExpenseRecord(payload: ExpenseRecordReqBody) {
    // Kiểm tra tồn tại các trường date -> chuyển string thành date
    if (payload.occur_date !== undefined) {
      payload.occur_date = new Date(payload.occur_date)
    }
    if (payload.debt_collection_date !== undefined) {
      payload.debt_collection_date = new Date(payload.debt_collection_date)
    }
    if (payload.repayment_date !== undefined) {
      payload.repayment_date = new Date(payload.repayment_date)
    }
    if (payload.report !== undefined && (payload.report.toString() === '0' || payload.report.toString() === '1')) {
      payload.report = parseInt(payload.report.toString())
    }
    if (payload.cost_incurred_category_id !== undefined) {
      payload.cost_incurred_category_id = new ObjectId(payload.cost_incurred_category_id)
    }
    const expenseRecord = new ExpenseRecord({
      ...payload,
      amount_of_money: new Decimal128(payload.amount_of_money),
      cash_flow_category_id: new ObjectId(payload.cash_flow_category_id),
      money_account_id: new ObjectId(payload.money_account_id),
      cost_incurred: new Decimal128(payload.cost_incurred || '0')
    })
    // Kiểm tra số dư tài khoản tiền và loại chi tiêu
    const [checkBalance, checkCashFlowType] = await Promise.all([
      databaseService.moneyAccounts.findOne(
        { _id: new ObjectId(payload.money_account_id) },
        { projection: { account_balance: 1 } }
      ),
      databaseService.cashFlowCategories.findOne(
        {
          $or: [
            { _id: new ObjectId(payload.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(payload.cash_flow_category_id) }
          ]
        },
        { projection: { cash_flow_type: 1 } }
      )
    ])
    // Nếu chi tiền thì trừ tiền, nếu thu tiền thì cộng tiền
    if (checkCashFlowType !== null && checkBalance !== null) {
      if (checkCashFlowType.cash_flow_type === CashFlowType.Spending) {
        checkBalance.account_balance = new Decimal128(
          (
            parseFloat(checkBalance.account_balance.toString()) -
            parseFloat(payload.amount_of_money.toString()) -
            parseFloat(payload.cost_incurred?.toString() ?? '0')
          ).toString()
        )
      } else {
        checkBalance.account_balance = new Decimal128(
          (
            parseFloat(checkBalance.account_balance.toString()) + parseFloat(payload.amount_of_money.toString())
          ).toString()
        )
      }
    }
    // Update lại số dư tài khoản tiền và thêm bản ghi chi tiêu
    await Promise.all([
      databaseService.moneyAccounts.updateOne({ _id: new ObjectId(payload.money_account_id) }, [
        {
          $set: {
            account_balance: checkBalance?.account_balance,
            updated_at: '$$NOW'
          }
        }
      ]),
      databaseService.expenseRecords.insertOne(expenseRecord)
    ])

    return APP_MESSAGES.ADD_EXPENSE_RECORD_SUCCESS
  }

  async updateExpenseRecord(payload: UpdateExpenseRecordReqBody) {
    if (payload.report !== undefined && (payload.report.toString() === '0' || payload.report.toString() === '1')) {
      payload.report = parseInt(payload.report.toString())
    }
    /*
      Đây là bản ghi chép chi, thu
        - Khi cập nhật lưu ý số tiền chi tiêu và số tiền chi phí phát sinh, hoặc thu tiền 
        - Nếu có sự thay đổi về các loại tiền chi tiêu hoặc chí phí phát sinh, hoặc thu tiền 
          -> Cập nhật lại số dư tài khoản tiền
        - Để cập nhập lại số dư
          - Cộng lại toàn bộ tiền chi tiêu và chi phí phát sinh vào lại tài khoản tiền (nếu là chi)
          - Trừ toàn bộ tiền thu từ tài khoản tiền (nếu là thu)
            -> Dù là cái nào cũng sẽ đưa số dư tài khoan tiền về mặc định (lúc chưa tạo bản ghi)
          - Tiến hành trừ hoặc cộng số dư tài khoản tiền theo những gì đã update
    */
    // Tạo bién lưu số dư
    let accountBalance: Decimal128 = new Decimal128('0')
    // Lấy thông tin bản ghi từ expense_record_id
    const getExpenseRecord = await databaseService.expenseRecords.findOne(
      {
        _id: new ObjectId(payload.expense_record_id)
      },
      { projection: { money_account_id: 1, amount_of_money: 1, cost_incurred: 1, cash_flow_category_id: 1 } }
    )
    // Nếu không truyền money_account_id (không thay đổi) -> lấy từ bản ghi cũ
    if (payload.money_account_id === undefined) {
      payload.money_account_id = getExpenseRecord?.money_account_id
    }
    // Nếu không truyền cash_flow_category_id (không thay đổi) -> lấy từ bản ghi cũ
    if (payload.cash_flow_category_id === undefined) {
      payload.cash_flow_category_id = getExpenseRecord?.cash_flow_category_id
    }
    // Lấy số dư tài khoản tiền và loại chi tiêu
    const [checkBalance, checkCashFlowType] = await Promise.all([
      databaseService.moneyAccounts.findOne(
        { _id: new ObjectId(payload.money_account_id) },
        { projection: { account_balance: 1 } }
      ),
      databaseService.cashFlowCategories.findOne(
        {
          $or: [
            { _id: new ObjectId(payload.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(payload.cash_flow_category_id) }
          ]
        },
        { projection: { cash_flow_type: 1 } }
      )
    ])
    // Nếu chi tiền thì trừ tiền, nếu thu tiền thì cộng tiền
    if (checkCashFlowType !== null && checkBalance !== null) {
      const oldAmount = parseFloat(getExpenseRecord?.amount_of_money.toString() || '0')
      const newAmount = parseFloat(payload.amount_of_money?.toString() || oldAmount.toString())
      const oldCostIncurred = parseFloat(getExpenseRecord?.cost_incurred?.toString() || '0')
      const newCostIncurred = parseFloat(payload.cost_incurred?.toString() || oldCostIncurred.toString())

      if (checkCashFlowType.cash_flow_type === CashFlowType.Spending) {
        checkBalance.account_balance = new Decimal128(
          (
            parseFloat(checkBalance.account_balance.toString()) -
            (newAmount - oldAmount) -
            (newCostIncurred - oldCostIncurred)
          ).toString()
        )
      } else {
        checkBalance.account_balance = new Decimal128(
          (parseFloat(checkBalance.account_balance.toString()) + (newAmount - oldAmount)).toString()
        )
        payload.cost_incurred = new Decimal128('0')
      }
      // Kiểm tra xem loại chi tiêu cũ và mới có giống nhau không
      // Nếu không thì đang chuyển từ thu sang chi hoặc ngược lại
      const checkOldCashFlowType = await databaseService.cashFlowCategories.findOne(
        {
          $or: [
            { _id: new ObjectId(getExpenseRecord?.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(getExpenseRecord?.cash_flow_category_id) }
          ]
        },
        { projection: { cash_flow_type: 1 } }
      )
      // Xử lý việc chuyển loại chi tiêu
      if (checkOldCashFlowType !== null) {
        if (checkOldCashFlowType.cash_flow_type !== checkCashFlowType.cash_flow_type) {
          if (
            checkOldCashFlowType.cash_flow_type === CashFlowType.Spending &&
            checkCashFlowType.cash_flow_type === CashFlowType.Revenue
          ) {
            checkBalance.account_balance = new Decimal128(
              (parseFloat(checkBalance.account_balance.toString()) + oldAmount + oldCostIncurred + newAmount).toString()
            )
          } else if (
            checkOldCashFlowType.cash_flow_type === CashFlowType.Revenue &&
            checkCashFlowType.cash_flow_type === CashFlowType.Spending
          ) {
            checkBalance.account_balance = new Decimal128(
              (
                parseFloat(checkBalance.account_balance.toString()) -
                oldAmount -
                (oldCostIncurred + newAmount)
              ).toString()
            )
          }
        }
      }
      accountBalance = checkBalance.account_balance
    }

    const expense_record_id = payload.expense_record_id
    // Xoá expense_record_id khỏi payload
    delete payload.expense_record_id

    await Promise.all([
      databaseService.moneyAccounts.updateOne({ _id: new ObjectId(getExpenseRecord?.money_account_id) }, [
        {
          $set: {
            account_balance: accountBalance,
            updated_at: '$$NOW'
          }
        }
      ]),
      databaseService.expenseRecords.updateOne({ _id: new ObjectId(expense_record_id) }, [
        {
          $set: {
            ...payload,
            updated_at: '$$NOW'
          }
        }
      ])
    ])

    return APP_MESSAGES.UPDATE_EXPENSE_RECORD_SUCCESS
  }

  async deleteMoneyAccount(user_id: string, payload: DeleteMoneyAccountReqParams) {
    await Promise.all([
      databaseService.expenseRecords.deleteMany({
        money_account_id: new ObjectId(payload.money_account_id),
        user_id: new ObjectId(user_id)
      }),
      databaseService.moneyAccounts.deleteOne({ _id: new ObjectId(payload.money_account_id) })
    ])
    return APP_MESSAGES.DELETE_MONEY_ACCOUNT_SUCCESS
  }

  async updateMoneyAccount(payload: UpdateMoneyAccountReqBody) {
    // Chuyển report từ string sang number
    if (payload.report !== undefined && (payload.report.toString() === '0' || payload.report.toString() === '1')) {
      payload.report = parseInt(payload.report.toString())
    }
    /*
      Kiểm tra xem các số Decimal có không
      Có -> Dạng string chuyển thành Decimal128
      Không -> Giữ nguyên
    */
    const money_account_id = payload.money_account_id
    /*
      Tạo biến để chứa money_account_type_id (loại tài khoản tiền)
      -> Nếu req.body (payload) người dùng truyền không có money_account_type_id 
      -> Update nhưng không thay đổi loại tài khoản tiền
      -> Lấy từ database loại hiện tại đang dùng
    */
    let money_account_type_id: string = ''
    if (payload.money_account_type_id !== undefined) {
      // !== undefined là req.body có truyền -> người dùng có thay đổi loại tài khoản tiền
      money_account_type_id = payload.money_account_type_id.toString()
    } else {
      // Kiểm tra loại từ database
      const checkTypeId = await databaseService.moneyAccounts.findOne(
        { _id: new ObjectId(money_account_id) },
        { projection: { money_account_type_id: 1 } }
      )
      if (checkTypeId !== null) {
        money_account_type_id = checkTypeId.money_account_type_id.toString()
      }
    }
    /*
      Lấy money_account_type_id từ req.body (payload)
      -> Kiểm tra xem loại tài khoản tiền có phải là thẻ tín dụng không
        -> Nếu không thì set credit_limit_number = 0
        -> Phải set = 0 (trở về mặc định) vì nếu ban đầu là thẻ tín dụng thì mới có credit_limit_number
        -> Sau khi update nếu không là thẻ tín dụng thì không cần credit_limit_number
      -> Kiểm tra xem loại tài khoản tiền có phải là tài khoản ngân hàng, thẻ tín dụng không
        -> Nếu không thì set select_bank = ''
        -> Phải set = 0 (trở về mặc định) vì nếu ban đầu là tài khoản ngân hàng, thẻ tín dụng thì mới có select_bank
        -> Sau khi update nếu không là tài khoản ngân hàng, thẻ tín dụng thì không cần select_bank
    */
    const checkType = await databaseService.moneyAccountTypes.findOne(
      { _id: new ObjectId(money_account_type_id) },
      { projection: { name: 1 } }
    )
    if (checkType?.name !== 'Thẻ tín dụng') {
      payload.credit_limit_number = new Decimal128('0')
    }
    if (checkType?.name !== 'Tài khoản ngân hàng' && checkType?.name !== 'Thẻ tín dụng') {
      payload.select_bank = ''
    }
    // Xóa money_account_id khỏi _payload
    delete payload.money_account_id
    // Tìm và cập nhật tài khoản tiền theo money_account_id
    await databaseService.moneyAccounts.findOneAndUpdate(
      {
        _id: new ObjectId(money_account_id)
      },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return APP_MESSAGES.UPDATE_MONEY_ACCOUNT_SUCCESS
  }

  async getInfoMoneyAccount(money_account_id: string) {
    const result = await databaseService.moneyAccounts
      .aggregate([
        {
          $match: {
            _id: new ObjectId(money_account_id)
          }
        },
        {
          $lookup: {
            from: 'money_account_types',
            localField: 'money_account_type_id', // Trường trong moneyAccounts
            foreignField: '_id', // Trường trong money_account_types
            as: 'money_type_information' // Tên trường kết quả join
          }
        },
        {
          $unwind: '$money_type_information' // Dùng để "mở" mảng money_type_information ra để truy cập các trường bên trong.
        },
        {
          // Chỉ định các trường mà bạn muốn bao gồm trong kết quả cuối cùng
          $project: {
            _id: 1,
            name: 1,
            account_balance: 1,
            user_id: 1,
            money_account_type_id: 1,
            description: 1,
            report: 1,
            select_bank: 1,
            credit_limit_number: 1,
            'money_type_information.icon': 1,
            'money_type_information.name': 1
          }
        }
      ])
      .next() // Next để chỉ trả về 1 kết quả -> vì chắc chắn nó sẽ chỉ có 1 nên không dùng toArray()
    return result
  }

  // Lấy danh sách các bản ghi chi tiêu của người dùng để thống kê
  async getExpenseRecordForStatistics(user_id: string, payload: ExpenseRecordForStatisticsReqParams) {
    /*
      Ý tưởng: sẽ đưa về dạng parent - sub
      - Trong response trả về sẽ chia làm 2 phần: spending_money và revenue_money
      - Đối với spending_money (chi tiền): thì có parent_category và sub_category
        Dạng trả về sẽ là: {
          id parent_category
          tên parent_category
          tổng tiền
          phần trăm tiền theo tổng tiền tất cả các bản ghi
          items: {
            Mảng các bản ghi chi tiêu (bao gồm cả parent (nếu có) và sub)
          }
        }
      - Logic code: 
        - Lấy tất cả các bản ghi chi tiêu của user_id
        - Duyệt qua từng bản ghi, từ cash_flow_category_id lấy ra cash_flow_type (chi tiêu hay thu tiền)
          - Nếu là chi tiêu thì push vào spending_money
          - Nếu là thu tiền thì push vào revenue_money
        - Spending_money: duyệt qua từng bản ghi, check id trong cả parent và sub_category trong bảng cash_flow_categories
          - Kiểm tra nếu id trùng với parent thì push vào parent { ExpenseRecordForStatistics }
          - Kiểm tra nếu id trùng với sub thì push vào sub { ExpenseRecordForStatistics }
        - Sau khi có parent và sub, duyệt 2 vòng lặp để merge lại
          - Nếu sub có parent_id trùng với id của parent (trong mảng parent -> tức là đã có trong mảng parent) thì push vào parent)
          - Nếu không (không có trong mảng parent) thì tạo một mảng mới từ sub và push vào
        - Revenue_money: xử lý tương tự như spending_money
        - Tính tiền spending_money: duyệt qua từng parent và sub, tính tổng tiền của từng parent và sub
          - Tính % tiền của từng parent và sub
        - Tính tiền revenue_money: cũng tương tự như spending_money
    */
    let result: WithId<ExpenseRecord>[] = []
    if (!payload.start_time && !payload.end_time) {
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id),
          report: IncludedReport.Included
        })
        .toArray()
    } else {
      /*
        Date.UTC đảm bảo rằng ngày được tạo theo giờ phối hợp quốc tế (UTC) để tránh các vấn đề liên quan đến múi giờ
          - month - 1: chỉ mục tháng JS bắt đầu từ 0 -> trừ 1 để được tháng chính xác
          - 1: ngày đầu tiên của tháng
          - 0, 0, 0: giờ, phút và giây được đặt thành 0
          - Tương tự endDate nhưng lấy ngày cuối cùng của tháng 23, 59, 59 -> 11:59:59 PM và 999 milliseconds
      */
      // Khởi tạo biến chứa thời gian
      let startDate: Date = new Date()
      let endDate: Date = new Date()
      /*
        Nếu có thời gian bắt đầu và không có thời gian kết thúc 
        -> Hôm nay
        -> Lấy ngày tháng năm tại thời gian bắt đầu -> Thời gian kết thúc sẽ là cuối ngày đó
      */
      if (payload.start_time && !payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
      }
      /*
        Nếu có thời gian bắt đầu và có thời gian kết thúc
        -> Lấy ngày tháng năm tại thời gian bắt đầu, thời gian kết thúc (cuối ngày)
      */
      if (payload.start_time && payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày bắt đầu (00:00:00)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        const [endDay, endMonth, endYear] = payload.end_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày kết thúc (23:59:59.999)
        endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999))
      }
      // Lấy tất cả các bản ghi chi tiêu của user_id
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id),
          report: IncludedReport.Included,
          // Lấy các bản ghi trong khoảng thời gian startDate và endDate ($lte: less than or equal, $gte: greater than or equal)
          occur_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
        .toArray()
    }

    const spending_money: ExpenseRecord[] = [] // Chi tiền
    const revenue_money: ExpenseRecord[] = [] // Thu tiền
    // Duyệt qua từng bản ghi - dùng Promise.all để tăng hiệu suất
    await Promise.all(
      result.map(async (item) => {
        const cashFlowType = await databaseService.cashFlowCategories.findOne(
          {
            $or: [
              { _id: new ObjectId(item.cash_flow_category_id) },
              { 'sub_category._id': new ObjectId(item.cash_flow_category_id) }
            ]
          },
          { projection: { cash_flow_type: 1 } }
        )
        // Kiểm tra cash_flow_type (chi tiêu - 0 hay thu tiền - 1)
        if (cashFlowType?.cash_flow_type === CashFlowType.Spending) {
          spending_money.push(item)
        } else {
          revenue_money.push(item)
        }
      })
    )
    const parent: ExpenseRecordForStatistics[] = []
    const sub: ExpenseRecordForStatistics[] = []
    const response_spending_money: ExpenseRecordForStatistics[] = []
    await Promise.all(
      spending_money.map(async (item) => {
        const cashFlowCategories = await databaseService.cashFlowCategories.findOne({
          $or: [
            { _id: new ObjectId(item.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(item.cash_flow_category_id) }
          ]
        })
        // Kiểm tra id là của parent hay nằm trong sub_category (là của sub)
        if (cashFlowCategories !== null) {
          if (cashFlowCategories._id.equals(item.cash_flow_category_id)) {
            // Kiểm tra xem bản ghi loại parent đã tồn tại chưa
            if (parent) {
              const parentIndex = parent.findIndex((parentItem) =>
                parentItem.parent_id.equals(item.cash_flow_category_id)
              )
              if (parentIndex !== -1) {
                parent[parentIndex].items.push({
                  name: cashFlowCategories.name,
                  icon: cashFlowCategories.icon,
                  cash_flow_type: cashFlowCategories.cash_flow_type,
                  cash_flow_id: cashFlowCategories.cash_flow_id,
                  ...item
                })
                return
              }
            }
            // Thêm vào parent
            parent.push({
              parent_id: cashFlowCategories._id,
              parent_name: cashFlowCategories.name,
              parent_icon: cashFlowCategories.icon,
              items: [
                {
                  name: cashFlowCategories.name,
                  icon: cashFlowCategories.icon,
                  cash_flow_type: cashFlowCategories.cash_flow_type,
                  cash_flow_id: cashFlowCategories.cash_flow_id,
                  ...item
                }
              ]
            })
          } else if (cashFlowCategories.sub_category) {
            // Tìm sub_category
            const subCategory = cashFlowCategories.sub_category.find((sub: CashFlowSubCategory) =>
              sub._id.equals(item.cash_flow_category_id)
            )
            if (subCategory) {
              // Kiểm tra xem parent của sub đã tồn tại chưa -> nếu chưa thì thêm vào
              const checkParent = parent.find((parentItem) => parentItem.parent_id.equals(cashFlowCategories._id))
              if (checkParent === undefined) {
                parent.push({
                  parent_id: cashFlowCategories._id,
                  parent_name: cashFlowCategories.name,
                  parent_icon: cashFlowCategories.icon,
                  items: []
                })
              }
              // Thêm vào sub
              sub.push({
                parent_id: cashFlowCategories._id,
                parent_name: cashFlowCategories.name,
                parent_icon: cashFlowCategories.icon,
                items: [
                  {
                    name: (subCategory as CashFlowSubCategory).name,
                    icon: (subCategory as CashFlowSubCategory).icon,
                    cash_flow_id: cashFlowCategories.cash_flow_id,
                    cash_flow_type: cashFlowCategories.cash_flow_type,
                    ...item
                  }
                ]
              })
            }
          }
        }
      })
    )
    // Merge parent và sub
    parent.forEach((parentItem) => {
      sub.forEach((subItem) => {
        // Néu đã có sẵn trong parent thì push cái sub thuộc về parent vào items của parent
        if (parentItem.parent_id.equals(subItem.parent_id)) {
          parentItem.items.push(...subItem.items)
        }
      })
    })
    // Dùng Set để lọc ra các parent_id đã có trong parent (để tránh trùng lặp)
    const mergedParentIds = new Set(parent.map((item) => item.parent_id.toString()))
    // Tạo một mảng chứa các phần tử từ sub mà parent_id của chúng không nằm trong mergedParentIds
    const filteredSub = sub.filter((subItem) => !mergedParentIds.has(subItem.parent_id.toString()))
    // Tính tổng tiền và % tiền cho chi tiêu
    let totalMoneyAllSpendingRecord: number = 0
    parent.forEach((parentItem) => {
      const totalAmount = parentItem.items.reduce(
        (sum, item) => sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString()),
        0
      )
      parentItem.total_money = Decimal128.fromString(totalAmount.toString())
      totalMoneyAllSpendingRecord += totalAmount
    })

    filteredSub.forEach((subItem) => {
      const totalAmount = subItem.items.reduce(
        (sum, item) => sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString()),
        0
      )
      subItem.total_money = Decimal128.fromString(totalAmount.toString())
      totalMoneyAllSpendingRecord += totalAmount
    })

    parent.forEach((parentItem) => {
      if (parentItem.total_money !== undefined) {
        parentItem.percentage =
          ((parseFloat(parentItem.total_money.toString()) / totalMoneyAllSpendingRecord) * 100).toFixed(2) + '%'
      }
    })

    filteredSub.forEach((subItem) => {
      if (subItem.total_money !== undefined) {
        subItem.percentage =
          ((parseFloat(subItem.total_money.toString()) / totalMoneyAllSpendingRecord) * 100).toFixed(2) + '%'
      }
    })

    const parent_revenue: ExpenseRecordForStatistics[] = []
    const response_revenue_money: ExpenseRecordForStatistics[] = []
    await Promise.all(
      revenue_money.map(async (item) => {
        const cashFlowCategories = await databaseService.cashFlowCategories.findOne({
          _id: new ObjectId(item.cash_flow_category_id)
        })
        // Kiểm tra id là của parent hay nằm trong sub_category (là của sub)
        if (cashFlowCategories !== null) {
          // Kiểm tra xem bản ghi loại parent đã tồn tại chưa
          if (parent_revenue) {
            const parentIndex = parent_revenue.findIndex((parentItem) =>
              parentItem.parent_id.equals(item.cash_flow_category_id)
            )
            if (parentIndex !== -1) {
              parent_revenue[parentIndex].items.push({
                name: cashFlowCategories.name,
                icon: cashFlowCategories.icon,
                cash_flow_type: cashFlowCategories.cash_flow_type,
                cash_flow_id: cashFlowCategories.cash_flow_id,
                ...item
              })
              return
            }
          }
          // Thêm vào parent
          parent_revenue.push({
            parent_id: cashFlowCategories._id,
            parent_name: cashFlowCategories.name,
            parent_icon: cashFlowCategories.icon,
            items: [
              {
                name: cashFlowCategories.name,
                icon: cashFlowCategories.icon,
                cash_flow_type: cashFlowCategories.cash_flow_type,
                cash_flow_id: cashFlowCategories.cash_flow_id,
                ...item
              }
            ]
          })
        }
      })
    )

    // Tính tổng tiền và % tiền cho thu tiền
    let totalMoneyAllRevenueRecord: number = 0
    parent_revenue.forEach((parentItem) => {
      const totalAmount = parentItem.items.reduce(
        (sum, item) => sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString()),
        0
      )
      parentItem.total_money = Decimal128.fromString(totalAmount.toString())
      totalMoneyAllRevenueRecord += totalAmount
    })

    parent_revenue.forEach((parentItem) => {
      if (parentItem.total_money !== undefined) {
        parentItem.percentage =
          ((parseFloat(parentItem.total_money.toString()) / totalMoneyAllRevenueRecord) * 100).toFixed(2) + '%'
      }
    })

    // Mảng trả về
    response_spending_money.push(...parent, ...filteredSub)
    response_revenue_money.push(...parent_revenue)

    return {
      spending_money: response_spending_money,
      revenue_money: response_revenue_money
    }
  }

  async getExpenseRecordOfEachMoneyAccount(user_id: string, payload: ExpenseRecordOfEachMoneyAccountReqParams) {
    let result: WithId<ExpenseRecordWithCashFlowType>[] = []
    if (!payload.start_time && !payload.end_time) {
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id),
          money_account_id: new ObjectId(payload.money_account_id)
        })
        .toArray()
    } else {
      /*
        Date.UTC đảm bảo rằng ngày được tạo theo giờ phối hợp quốc tế (UTC) để tránh các vấn đề liên quan đến múi giờ
          - month - 1: chỉ mục tháng JS bắt đầu từ 0 -> trừ 1 để được tháng chính xác
          - 1: ngày đầu tiên của tháng
          - 0, 0, 0: giờ, phút và giây được đặt thành 0
          - Tương tự endDate nhưng lấy ngày cuối cùng của tháng 23, 59, 59 -> 11:59:59 PM và 999 milliseconds
      */
      // Khởi tạo biến chứa thời gian
      let startDate: Date = new Date()
      let endDate: Date = new Date()
      /*
        Nếu có thời gian bắt đầu và không có thời gian kết thúc 
        -> Hôm nay
        -> Lấy ngày tháng năm tại thời gian bắt đầu -> Thời gian kết thúc sẽ là cuối ngày đó
      */
      if (payload.start_time && !payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
      }
      /*
        Nếu có thời gian bắt đầu và có thời gian kết thúc
        -> Lấy ngày tháng năm tại thời gian bắt đầu, thời gian kết thúc (cuối ngày)
      */
      if (payload.start_time && payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày bắt đầu (00:00:00)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        const [endDay, endMonth, endYear] = payload.end_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày kết thúc (23:59:59.999)
        endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999))
      }
      // Lấy tất cả các bản ghi chi tiêu của user_id
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id),
          money_account_id: new ObjectId(payload.money_account_id),
          // Lấy các bản ghi trong khoảng thời gian startDate và endDate ($lte: less than or equal, $gte: greater than or equal)
          occur_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
        .toArray()
    }

    await Promise.all(
      result.map(async (item) => {
        const cashFlowCategories = await databaseService.cashFlowCategories.findOne({
          $or: [
            { _id: new ObjectId(item.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(item.cash_flow_category_id) }
          ]
        })

        if (cashFlowCategories !== null) {
          if (cashFlowCategories._id.equals(item.cash_flow_category_id)) {
            Object.assign(item, {
              icon: cashFlowCategories.icon,
              name: cashFlowCategories.name,
              cash_flow_type: cashFlowCategories.cash_flow_type,
              cash_flow_id: cashFlowCategories.cash_flow_id
            })
          } else if (cashFlowCategories.sub_category) {
            // Tìm sub_category
            const subCategory = cashFlowCategories.sub_category.find((sub: CashFlowSubCategory) =>
              sub._id.equals(item.cash_flow_category_id)
            )
            if (subCategory) {
              Object.assign(item, {
                icon: (subCategory as CashFlowSubCategory).icon,
                name: (subCategory as CashFlowSubCategory).name,
                cash_flow_type: cashFlowCategories.cash_flow_type,
                cash_flow_id: cashFlowCategories.cash_flow_id
              })
            }
          }
        }
      })
    )

    // Khởi tạo Map để chứa các bản ghi chi tiêu theo ngày
    const expenseRecordMap = new Map<string, ExpenseRecordWithCashFlowType[]>()
    // Khởi tạo mảng trả về
    const response_expense_record: ExpenseRecordOfEachMoneyAccount[] = []
    let totalMoneySpending: number = 0
    let totalMoneyRevenue: number = 0
    // Lặp để set key cho Map là ngày và value là mảng các bản ghi chi tiêu
    result.forEach((item) => {
      /* 
        Một ISOString của ngày có dạng: 2024-09-01T08:05:13.769Z -> cắt từ T để lấy ngày và giờ
        Sau khi split -> [ '2024-09-01', '08:05:13.769Z' ] -> lấy ngày là phần tử thứ 0
        Kiểm tra xem Map đã có key chưa (has) 
        -> nếu có thì push vào mảng value của key đó
        -> nếu không thì set key và value mới
      */
      const [key] = item.occur_date.toISOString().split('T')
      if (expenseRecordMap.has(key)) {
        expenseRecordMap.get(key)?.push(item)
      } else {
        expenseRecordMap.set(key, [item])
      }
      // Tính toán tổng chi tổng thu theo loại (0 - 1)
      if (item.cash_flow_type === 0) {
        totalMoneySpending =
          totalMoneySpending + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
      } else if (item.cash_flow_type === 1) {
        totalMoneyRevenue =
          totalMoneyRevenue + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
      }
    })
    // Duyệt qua Map để push vào mảng trả về
    expenseRecordMap.forEach((value, key) => {
      response_expense_record.push({ date: key, total_money: new Decimal128('0'), records: value })
    })
    // Tính tổng tiền và thêm vào mảng
    response_expense_record.forEach((item) => {
      const totalAmount = item.records.reduce(
        (sum, item) => sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString()),
        0
      )
      item.total_money = Decimal128.fromString(totalAmount.toString())
    })

    // Chuyển tổng tiền chi tiêu và thu nhập thành Decimal128
    const response_spending_money = new Decimal128(totalMoneySpending.toString())
    const response_revenue_money = new Decimal128(totalMoneyRevenue.toString())
    /*
      Dùng hàm sort sắp xếp giảm dần theo ngày
      Nếu giá trị trả về < 0, phần tử a sẽ đứng trước phần tử b
      Nếu giá trị trả về > 0, phần tử b sẽ đứng trước phần tử a
      Nếu giá trị trả về = 0, thứ tự của a và b không thay đổi
    */
    response_expense_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return { response_expense_record, response_spending_money, response_revenue_money }
  }

  async getHistoryOfExpenseRecord(user_id: string, payload: HistoryOfExpenseRecordReqParams) {
    let result: WithId<ExpenseRecordWithCashFlowType>[] = []
    if (!payload.start_time && !payload.end_time) {
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id)
        })
        .toArray()
    } else {
      /*
        Date.UTC đảm bảo rằng ngày được tạo theo giờ phối hợp quốc tế (UTC) để tránh các vấn đề liên quan đến múi giờ
          - month - 1: chỉ mục tháng JS bắt đầu từ 0 -> trừ 1 để được tháng chính xác
          - 1: ngày đầu tiên của tháng
          - 0, 0, 0: giờ, phút và giây được đặt thành 0
          - Tương tự endDate nhưng lấy ngày cuối cùng của tháng 23, 59, 59 -> 11:59:59 PM và 999 milliseconds
      */
      // Khởi tạo biến chứa thời gian
      let startDate: Date = new Date()
      let endDate: Date = new Date()
      /*
        Nếu có thời gian bắt đầu và không có thời gian kết thúc 
        -> Hôm nay
        -> Lấy ngày tháng năm tại thời gian bắt đầu -> Thời gian kết thúc sẽ là cuối ngày đó
      */
      if (payload.start_time && !payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        endDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
      }
      /*
        Nếu có thời gian bắt đầu và có thời gian kết thúc
        -> Lấy ngày tháng năm tại thời gian bắt đầu, thời gian kết thúc (cuối ngày)
      */
      if (payload.start_time && payload.end_time) {
        const [startDay, startMonth, startYear] = payload.start_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày bắt đầu (00:00:00)
        startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0))
        const [endDay, endMonth, endYear] = payload.end_time.split('-').map(Number)
        // Tạo đối tượng Date cho ngày kết thúc (23:59:59.999)
        endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999))
      }
      // Lấy tất cả các bản ghi chi tiêu của user_id
      result = await databaseService.expenseRecords
        .find({
          user_id: new ObjectId(user_id),
          // Lấy các bản ghi trong khoảng thời gian startDate và endDate ($lte: less than or equal, $gte: greater than or equal)
          occur_date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
        .toArray()
    }

    await Promise.all(
      result.map(async (item) => {
        const cashFlowCategories = await databaseService.cashFlowCategories.findOne({
          $or: [
            { _id: new ObjectId(item.cash_flow_category_id) },
            { 'sub_category._id': new ObjectId(item.cash_flow_category_id) }
          ]
        })

        if (cashFlowCategories !== null) {
          if (cashFlowCategories._id.equals(item.cash_flow_category_id)) {
            Object.assign(item, {
              icon: cashFlowCategories.icon,
              name: cashFlowCategories.name,
              cash_flow_type: cashFlowCategories.cash_flow_type,
              cash_flow_id: cashFlowCategories.cash_flow_id
            })
          } else if (cashFlowCategories.sub_category) {
            // Tìm sub_category
            const subCategory = cashFlowCategories.sub_category.find((sub: CashFlowSubCategory) =>
              sub._id.equals(item.cash_flow_category_id)
            )
            if (subCategory) {
              Object.assign(item, {
                icon: (subCategory as CashFlowSubCategory).icon,
                name: (subCategory as CashFlowSubCategory).name,
                cash_flow_type: cashFlowCategories.cash_flow_type,
                cash_flow_id: cashFlowCategories.cash_flow_id
              })
            }
          }
        }
      })
    )

    // Khởi tạo Map để chứa các bản ghi chi tiêu theo ngày
    const expenseRecordMap = new Map<string, ExpenseRecordWithCashFlowType[]>()
    // Khởi tạo mảng trả về
    const response_expense_record: ExpenseRecordOfEachMoneyAccount[] = []
    let totalMoneySpending: number = 0
    let totalMoneyRevenue: number = 0
    // Lặp để set key cho Map là ngày và value là mảng các bản ghi chi tiêu
    result.forEach((item) => {
      /* 
        Một ISOString của ngày có dạng: 2024-09-01T08:05:13.769Z -> cắt từ T để lấy ngày và giờ
        Sau khi split -> [ '2024-09-01', '08:05:13.769Z' ] -> lấy ngày là phần tử thứ 0
        Kiểm tra xem Map đã có key chưa (has) 
        -> nếu có thì push vào mảng value của key đó
        -> nếu không thì set key và value mới
      */
      const [key] = item.occur_date.toISOString().split('T')
      if (expenseRecordMap.has(key)) {
        expenseRecordMap.get(key)?.push(item)
      } else {
        expenseRecordMap.set(key, [item])
      }
      // Tính toán tổng chi tổng thu theo loại (0 - 1)
      if (item.cash_flow_type === 0) {
        totalMoneySpending =
          totalMoneySpending + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
      } else if (item.cash_flow_type === 1) {
        totalMoneyRevenue =
          totalMoneyRevenue + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
      }
    })
    // Duyệt qua Map để push vào mảng trả về
    expenseRecordMap.forEach((value, key) => {
      response_expense_record.push({ date: key, total_money: new Decimal128('0'), records: value })
    })
    // Tính tổng tiền và thêm vào mảng
    response_expense_record.forEach((item) => {
      const totalAmount = item.records.reduce(
        (sum, item) => sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString()),
        0
      )
      item.total_money = Decimal128.fromString(totalAmount.toString())
    })

    // Chuyển tổng tiền chi tiêu và thu nhập thành Decimal128
    const response_spending_money = new Decimal128(totalMoneySpending.toString())
    const response_revenue_money = new Decimal128(totalMoneyRevenue.toString())
    /*
      Dùng hàm sort sắp xếp giảm dần theo ngày
      Nếu giá trị trả về < 0, phần tử a sẽ đứng trước phần tử b
      Nếu giá trị trả về > 0, phần tử b sẽ đứng trước phần tử a
      Nếu giá trị trả về = 0, thứ tự của a và b không thay đổi
    */
    response_expense_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return { response_expense_record, response_spending_money, response_revenue_money }
  }

  async deleteExpenseRecord(user_id: string, payload: DeleteExpenseRecordReqParams) {
    /*
      Từ payload (req.params) lấy ra expense_record_id
      -> Tìm bản ghi chi tiêu theo expense_record_id -> amount_of_money, money_account_id, cash_flow_category_id
      -> Kiểm tra số dư tài khoản tiền và loại chi tiêu (chi tiêu hay thu tiền)
      -> Nếu là chi tiêu thì cộng tiền, nếu là thu tiền thì trừ tiền
      -> Update lại số dư tài khoản tiền và xóa bản ghi chi tiêu
    */
    const getExpenseRecord = await databaseService.expenseRecords.findOne(
      {
        _id: new ObjectId(payload.expense_record_id),
        user_id: new ObjectId(user_id)
      },
      { projection: { amount_of_money: 1, money_account_id: 1, cash_flow_category_id: 1, cost_incurred: 1 } }
    )

    if (getExpenseRecord !== null) {
      const [checkBalance, checkCashFlowType] = await Promise.all([
        databaseService.moneyAccounts.findOne(
          { _id: new ObjectId(getExpenseRecord.money_account_id), user_id: new ObjectId(user_id) },
          { projection: { account_balance: 1 } }
        ),
        databaseService.cashFlowCategories.findOne(
          {
            $or: [
              { _id: new ObjectId(getExpenseRecord.cash_flow_category_id) },
              { 'sub_category._id': new ObjectId(getExpenseRecord.cash_flow_category_id) }
            ]
          },
          { projection: { cash_flow_type: 1 } }
        )
      ])
      if (checkBalance !== null && checkCashFlowType !== null) {
        if (checkCashFlowType.cash_flow_type === CashFlowType.Spending) {
          checkBalance.account_balance = new Decimal128(
            (
              parseFloat(checkBalance.account_balance.toString()) +
              parseFloat(getExpenseRecord.amount_of_money.toString()) +
              parseFloat(getExpenseRecord.cost_incurred?.toString() ?? '0')
            ).toString()
          )
        } else {
          checkBalance.account_balance = new Decimal128(
            (
              parseFloat(checkBalance.account_balance.toString()) -
              parseFloat(getExpenseRecord.amount_of_money.toString())
            ).toString()
          )
        }
      }
      await Promise.all([
        databaseService.moneyAccounts.updateOne({ _id: getExpenseRecord.money_account_id }, [
          {
            $set: {
              account_balance: checkBalance?.account_balance,
              updated_at: '$$NOW'
            }
          }
        ]),
        databaseService.expenseRecords.deleteOne({ _id: new ObjectId(payload.expense_record_id) })
      ])
    }
    return APP_MESSAGES.DELETE_EXPENSE_RECORD_SUCCESS
  }

  async addSpendingLimit(payload: SpendingLimitReqBody) {
    /*
      Ở payload giá trị nhận được ở trong cash_flow_category_id và money_account_id là mảng các string
      -> Duyệt mảng và chuyển lần lượt các id dạng string thành ObjectId
      -> Đưa vào mảng mới
      -> Gán mảng mới vào lại payload để thêm mới
    */
    const newCashFlowCategories = payload.cash_flow_category_id.map((item) => new ObjectId(item))
    const newMoneyAccounts = payload.money_account_id.map((item) => new ObjectId(item))
    // Gán ngược lại cho payload
    payload.cash_flow_category_id = newCashFlowCategories
    payload.money_account_id = newMoneyAccounts
    if (payload.end_time !== undefined) {
      payload.end_time = new Date(payload.end_time)
    }
    // Tạo đối tượng SpendingLimit từ payload
    const spendingLimit = new SpendingLimit({
      ...payload,
      amount_of_money: new Decimal128(payload.amount_of_money),
      repeat: new ObjectId(payload.repeat),
      start_time: new Date(payload.start_time)
    })
    await databaseService.spendingLimits.insertOne(spendingLimit)
    return APP_MESSAGES.ADD_SPENDING_LIMIT_SUCCESS
  }

  async deleteSpendingLimit(user_id: string, payload: DeleteSpendingLimitReqParams) {
    await databaseService.spendingLimits.deleteOne({
      _id: new ObjectId(payload.spending_limit_id),
      user_id: new ObjectId(user_id)
    })
    return APP_MESSAGES.DELETE_SPENDING_LIMIT_SUCCESS
  }

  async getSpendingLimit(user_id: string, payload: SpendingLimitReqParams) {
    /*
      Lấy ra bản ghi spending limit của user_id và spending_limit_id
      -> Từ đó lấy ngày bắt đầu và ngày kết thúc
      -> Tính toán tổng số ngày (từ bắt đầu đến kết thúc)
      -> Tính toán số ngày đã chi tiêu
      -> Lấy ra các bản ghi chi tiêu trong khoảng thời gian đó
      -> Lọc ra các bản ghi chi tiêu thuộc spending limit (cash_flow_type = Spending (0)) 
      -> Tính các thông tin
    */
    const result = await databaseService.spendingLimits.findOne(
      {
        user_id: new ObjectId(user_id),
        _id: new ObjectId(payload.spending_limit_id)
      },
      { projection: { created_at: 0, updated_at: 0 } }
    )

    let startTime: Date = new Date()
    let endTime: Date = new Date()
    let numberOfDaysSpending: number = 0
    if (result !== null) {
      if (result.start_time !== undefined && result.end_time === null) {
        const getStartTime = result.start_time.toISOString().split('T')[0]
        const [startYear, startMonth, startDay] = getStartTime.split('-').map(Number)
        startTime = new Date(getStartTime)
        endTime = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
        // Hàm differenceInDays trả về số ngày giữa 2 thời gian
        numberOfDaysSpending = differenceInDays(endTime, startTime) + 1
      }
      if (result.start_time !== undefined && result.end_time !== null && result.end_time !== undefined) {
        const getStartTime = result.start_time.toISOString().split('T')[0]
        const getEndTime = result.end_time.toISOString().split('T')[0]
        const [startYear, startMonth, startDay] = getEndTime.split('-').map(Number)
        startTime = new Date(getStartTime)
        endTime = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
        // Hàm differenceInDays trả về số ngày giữa 2 thời gian
        numberOfDaysSpending = differenceInDays(endTime, startTime) + 1
      }
    }
    // Tính thời gian đã chi tiêu (ngày hiện tại - ngày bắt đầu)
    const currentTime = new Date().toISOString()
    const timeSpending = differenceInDays(currentTime, startTime) + 1
    /*
      Lấy ra các bản ghi chi tiêu của user_id trong khoảng thời gian bắt đầu và kết thúc
      Chỉ lấy những bản ghi có money_account_id là các tài khoản được chọn trong hạn mức
      Đưa vào mảng getExpenseRecord
    */
    const getExpenseRecord: WithId<ExpenseRecord>[] = []
    if (result && result.money_account_id) {
      await Promise.all(
        result.money_account_id.map(async (item) => {
          const getExpenseRecordOfEachMoneyAccount = await databaseService.expenseRecords
            .find(
              {
                user_id: new ObjectId(user_id),
                money_account_id: new ObjectId(item),
                occur_date: { $gte: startTime, $lte: endTime }
              },
              { projection: { created_at: 0, updated_at: 0 } }
            )
            .toArray()

          getExpenseRecord.push(...getExpenseRecordOfEachMoneyAccount)
        })
      )
    }
    // Lọc ra các bản ghi chi tiêu thuộc spending limit (cash_flow_type = Spending (0))
    const getExpenseRecordOfSpendingLimit = await Promise.all(
      getExpenseRecord.map(async (item) => {
        const cashFlowCategories = await databaseService.cashFlowCategories.findOne(
          {
            $or: [{ _id: item.cash_flow_category_id }, { 'sub_category._id': item.cash_flow_category_id }]
          },
          { projection: { created_at: 0, updated_at: 0 } }
        )
        // Kiểm tra id trùng với parent hay sub để thêm name, icon, cash_flow_type, cash_flow_id
        if (cashFlowCategories !== null) {
          if (cashFlowCategories._id.equals(item.cash_flow_category_id)) {
            if (cashFlowCategories.cash_flow_type !== CashFlowType.Revenue) {
              return Object.assign(item, {
                icon: cashFlowCategories.icon,
                name: cashFlowCategories.name,
                cash_flow_type: cashFlowCategories.cash_flow_type,
                cash_flow_id: cashFlowCategories.cash_flow_id
              })
            }
          } else if (cashFlowCategories.sub_category) {
            const subCategory = cashFlowCategories.sub_category.find((sub: CashFlowSubCategory) =>
              sub._id.equals(item.cash_flow_category_id)
            )
            if (subCategory) {
              if (cashFlowCategories.cash_flow_type !== CashFlowType.Revenue) {
                return Object.assign(item, {
                  icon: (subCategory as CashFlowSubCategory).icon,
                  name: (subCategory as CashFlowSubCategory).name,
                  cash_flow_type: cashFlowCategories.cash_flow_type,
                  cash_flow_id: cashFlowCategories.cash_flow_id
                })
              }
            }
          }
        }
        return null
      })
    )
    // Lọc ra các bản ghi chi tiêu thuộc spending limit (cash_flow_type = Spending (0)) và khác null
    // Mảng getExpenseRecordOfSpendingLimit khi chưa lọc sẽ chứa các bản ghi chi tiêu thuộc spending limit và null (null vì thuộc Revenue)
    const filterExpenseRecordOfSpendingLimit = getExpenseRecordOfSpendingLimit.filter((item) => item !== null)
    // Tính tổng số tiền đã chi tiêu dựa trên các bản ghi
    const totalAmountSpending = filterExpenseRecordOfSpendingLimit.reduce((sum, item) => {
      if (item !== null) {
        return sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
      }
      return sum
    }, 0)
    // Tính số tiền còn lại của spending limit
    const remainingAmountOfLimit =
      parseFloat((result as WithId<SpendingLimit>).amount_of_money.toString()) - totalAmountSpending
    // Tính số ngày còn lại (tổng số ngày - số ngày đã chi tiêu)
    const remainingDays = numberOfDaysSpending - timeSpending
    // Tính số tiền thực tế đã chi tiêu (tổng số tiền đã chi tiêu / số ngày đã chi tiêu)
    // Nếu số ngày đã chi tiêu = 0 thì số tiền thực tế đã chi tiêu = 0
    let actualSpending = totalAmountSpending / timeSpending
    if (timeSpending === 0) {
      actualSpending = 0
    }
    // Tính số tiền nên chi tiêu (số tiền còn lại / số ngày còn lại)
    // Nếu số ngày còn lại <= 0 thì số tiền nên chi tiêu = 0
    // Nếu số tiền nên chi tiêu < 0 -> 0
    let shouldSpending = remainingAmountOfLimit / remainingDays
    if (remainingDays <= 0) {
      shouldSpending = 0
    }
    if (shouldSpending < 0) {
      shouldSpending = 0
    }
    // Tính số tiền dự kiến cần chi tiêu (số tiền thực tế đã chi tiêu * số ngày còn lại + tổng số tiền đã chi tiêu)
    // Nếu số ngày còn lại < 0 thì số tiền dự kiến cần chi tiêu = 0
    let expectedSpending = actualSpending * remainingDays + totalAmountSpending
    if (remainingDays < 0) {
      expectedSpending = 0
    }
    const response_spending_limit = {
      ...result,
      expense_records: filterExpenseRecordOfSpendingLimit,
      remaining_amount_of_limit: new Decimal128(remainingAmountOfLimit.toString()),
      total_amount_spending: new Decimal128(totalAmountSpending.toString()),
      actual_spending: new Decimal128(actualSpending.toString()),
      should_spending: new Decimal128(shouldSpending.toString()),
      expected_spending: new Decimal128(expectedSpending.toString())
    }

    return response_spending_limit
  }

  async getAllSpendingLimit(user_id: string) {
    /*
      Ở lấy all cách xử lý tương tự lấy riêng từng cái (khác là phải xử lý dạng mảng các item)
      Lấy ra tất cả các bản ghi spending limit của user_id
      -> Từ đó lấy ngày bắt đầu và ngày kết thúc
      -> Tính toán tổng số ngày (từ bắt đầu đến kết thúc)
      -> Tính toán số ngày đã chi tiêu
      -> Lấy ra các bản ghi chi tiêu trong khoảng thời gian đó
      -> Lọc ra các bản ghi chi tiêu thuộc spending limit (cash_flow_type = Spending (0))
      -> Tính các thông tin
    */
    const results = await databaseService.spendingLimits
      .find({ user_id: new ObjectId(user_id) }, { projection: { created_at: 0, updated_at: 0, repeat: 0 } })
      .toArray()

    const response_spending_limits = await Promise.all(
      results.map(async (result) => {
        let startTime: Date = new Date()
        let endTime: Date = new Date()

        if (result.start_time !== undefined && result.end_time === null) {
          const getStartTime = result.start_time.toISOString().split('T')[0]
          const [startYear, startMonth, startDay] = getStartTime.split('-').map(Number)
          startTime = new Date(getStartTime)
          endTime = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
        }
        if (result.start_time !== undefined && result.end_time !== null && result.end_time !== undefined) {
          const getStartTime = result.start_time.toISOString().split('T')[0]
          const getEndTime = result.end_time.toISOString().split('T')[0]
          const [startYear, startMonth, startDay] = getEndTime.split('-').map(Number)
          startTime = new Date(getStartTime)
          endTime = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999))
        }

        const getExpenseRecord: WithId<ExpenseRecord>[] = []
        if (result.money_account_id) {
          await Promise.all(
            result.money_account_id.map(async (item) => {
              const getExpenseRecordOfEachMoneyAccount = await databaseService.expenseRecords
                .find(
                  {
                    user_id: new ObjectId(user_id),
                    money_account_id: new ObjectId(item),
                    occur_date: { $gte: startTime, $lte: endTime }
                  },
                  { projection: { created_at: 0, updated_at: 0 } }
                )
                .toArray()

              getExpenseRecord.push(...getExpenseRecordOfEachMoneyAccount)
            })
          )
        }

        const getExpenseRecordOfSpendingLimit = await Promise.all(
          getExpenseRecord.map(async (item) => {
            const cashFlowCategories = await databaseService.cashFlowCategories.findOne(
              {
                $or: [{ _id: item.cash_flow_category_id }, { 'sub_category._id': item.cash_flow_category_id }]
              },
              { projection: { created_at: 0, updated_at: 0 } }
            )
            // Kiểm tra id trùng với parent hay sub để thêm name, icon, cash_flow_type, cash_flow_id
            if (cashFlowCategories !== null) {
              if (cashFlowCategories._id.equals(item.cash_flow_category_id)) {
                if (cashFlowCategories.cash_flow_type !== CashFlowType.Revenue) {
                  return Object.assign(item, {
                    icon: cashFlowCategories.icon,
                    name: cashFlowCategories.name,
                    cash_flow_type: cashFlowCategories.cash_flow_type,
                    cash_flow_id: cashFlowCategories.cash_flow_id
                  })
                }
              } else if (cashFlowCategories.sub_category) {
                const subCategory = cashFlowCategories.sub_category.find((sub: CashFlowSubCategory) =>
                  sub._id.equals(item.cash_flow_category_id)
                )
                if (subCategory) {
                  if (cashFlowCategories.cash_flow_type !== CashFlowType.Revenue) {
                    return Object.assign(item, {
                      icon: (subCategory as CashFlowSubCategory).icon,
                      name: (subCategory as CashFlowSubCategory).name,
                      cash_flow_type: cashFlowCategories.cash_flow_type,
                      cash_flow_id: cashFlowCategories.cash_flow_id
                    })
                  }
                }
              }
            }
            return null
          })
        )

        const filterExpenseRecordOfSpendingLimit = getExpenseRecordOfSpendingLimit.filter((item) => item !== null)

        const totalAmountSpending = filterExpenseRecordOfSpendingLimit.reduce((sum, item) => {
          if (item !== null) {
            return sum + parseFloat(item.amount_of_money.toString()) + parseFloat(item.cost_incurred.toString())
          }
          return sum
        }, 0)

        return {
          ...result,
          total_spending: new Decimal128(totalAmountSpending.toString())
        }
      })
    )

    return response_spending_limits
  }

  async updateSpendingLimit(user_id: string, payload: UpdateSpendingLimitReqBody) {
    /*
      Ở payload giá trị nhận được ở trong cash_flow_category_id và money_account_id là mảng các string
      -> Duyệt mảng và chuyển lần lượt các id dạng string thành ObjectId
      -> Đưa vào mảng mới
      -> Gán mảng mới vào lại payload để thêm mới
    */
    // Gán spending_limit_id vào biến riêng và xóa khỏi payload -> ..payload sẽ không xuất hiện spending_limit_id khi update
    const spendingLimitId = payload.spending_limit_id
    delete payload.spending_limit_id
    if (payload.cash_flow_category_id !== undefined) {
      const newCashFlowCategories = payload.cash_flow_category_id.map((item) => new ObjectId(item))
      // Gán ngược lại cho payload
      payload.cash_flow_category_id = newCashFlowCategories
    }
    if (payload.money_account_id !== undefined) {
      const newMoneyAccounts = payload.money_account_id.map((item) => new ObjectId(item))
      // Gán ngược lại cho payload
      payload.money_account_id = newMoneyAccounts
    }
    if (payload.end_time !== undefined) {
      // Gán ngược lại cho payload
      payload.end_time = new Date(payload.end_time)
    }
    if (payload.start_time !== undefined) {
      // Gán ngược lại cho payload
      payload.start_time = new Date(payload.start_time)
    }
    if (payload.amount_of_money !== undefined) {
      // Gán ngược lại cho payload
      payload.amount_of_money = new Decimal128(payload.amount_of_money.toString())
    }
    await databaseService.spendingLimits.updateOne(
      { _id: new ObjectId(spendingLimitId), user_id: new ObjectId(user_id) },
      [
        {
          $set: {
            ...payload,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return APP_MESSAGES.UPDATE_SPENDING_LIMIT_SUCCESS
  }
}

const appServices = new AppServices()
export default appServices
