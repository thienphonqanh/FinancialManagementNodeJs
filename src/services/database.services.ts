import { MongoClient, Db, Collection } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import MoneyAccount from '~/models/schemas/MoneyAccount.schemas'
import CashFlow from '~/models/schemas/CashFlow.schemas'
import CashFlowCategory from '~/models/schemas/CashFlowCategory.schemas'
import RefreshToken from '~/models/schemas/Refresh.schemas'
import MoneyAccountType from '~/models/schemas/MoneyAccountType.schemas'
import ExpenseRecord from '~/models/schemas/ExpenseRecord.schemas'
import { envConfig } from '~/constants/configs'
import SpendingLimit from '~/models/schemas/SpendingLimit.schemas'
import SpendingLimitRepeat from '~/models/schemas/SpendingLimitRepeat.schemas'

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@financialmanagement.kiplzgn.mongodb.net/`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error', error)
      throw error
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection)
  }

  get moneyAccountTypes(): Collection<MoneyAccountType> {
    return this.db.collection(envConfig.dbMoneyAccountTypesCollection)
  }

  get moneyAccounts(): Collection<MoneyAccount> {
    return this.db.collection(envConfig.dbMoneyAccountsCollection)
  }

  get cashFlows(): Collection<CashFlow> {
    return this.db.collection(envConfig.dbCashFlowsCollection)
  }

  get cashFlowCategories(): Collection<CashFlowCategory> {
    return this.db.collection(envConfig.dbCashFlowCategoriesCollection)
  }

  get expenseRecords(): Collection<ExpenseRecord> {
    return this.db.collection(envConfig.dbExpenseRecordsCollection)
  }

  get spendingLimits(): Collection<SpendingLimit> {
    return this.db.collection(envConfig.dbSpendingLimitsCollection)
  }

  get repeatSpendingLimits(): Collection<SpendingLimitRepeat> {
    return this.db.collection(envConfig.dbRepeatSpendingLimitsCollection)
  }
}

const databaseService = new DatabaseService()
export default databaseService
