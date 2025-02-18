import { config } from 'dotenv'
import argv from 'minimist'

const options = argv(process.argv.slice(2))
export const isProduction = options.env === 'production'
config({
  path: options.env ? `.env.${options.env}` : '.env'
})

export const envConfig = {
  port: (process.env.PORT as string) || 4000,
  verifyEmailURL: process.env.VERIFY_EMAIL_URL as string,
  forgotPasswordURL: process.env.FORGOT_PASSWORD_URL as string,
  dbName: process.env.DB_NAME as string,
  dbUsername: process.env.DB_USERNAME as string,
  dbPassword: process.env.DB_PASSWORD as string,
  dbUsersCollection: process.env.DB_USERS_COLLECTION as string,
  dbRefreshTokensCollection: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  dbMoneyAccountsCollection: process.env.DB_MONEY_ACCOUNTS_COLLECTION as string,
  dbMoneyAccountTypesCollection: process.env.DB_MONEY_ACCOUNT_TYPES_COLLECTION as string,
  dbCashFlowsCollection: process.env.DB_CASH_FLOWS_COLLECTION as string,
  dbCashFlowCategoriesCollection: process.env.DB_CASH_FLOW_CATEGORIES_COLLECTION as string,
  dbExpenseRecordsCollection: process.env.DB_EXPENSE_RECORDS_COLLECTION as string,
  dbSpendingLimitsCollection: process.env.DB_SPENDING_LIMITS_COLLECTION as string,
  dbRepeatSpendingLimitsCollection: process.env.DB_REPEAT_SPENDING_LIMITS_COLLECTION as string,
  passwordSecret: process.env.PASSWORD_SECRET as string,
  JWTSecretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  JWTSecretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  JWTSecretEmailVerifyToken: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
  JWTSecretForgotPasswordToken: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  emailVerifyTokenExpiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as string,
  forgotPasswordTokenExpiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,
  AWSAccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  AWSSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWSRegion: process.env.AWS_REGION as string,
  SESFromAddress: process.env.SES_FROM_ADDRESS as string,
  S3Bucketname: process.env.S3_BUCKET_NAME as string
}
