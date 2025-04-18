import { checkSchema } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError } from 'jsonwebtoken'
import { validate } from '~/utils/validation'
import { ADMINS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { capitalize } from 'lodash'
import { ParamSchema } from 'express-validator'
import usersService from '~/services/users.services'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { verifyToken } from '~/utils/jwt'
import { ObjectId, WithId } from 'mongodb'
import { TokenPayload } from '~/models/requests/User.requests'
import { Role, UserVerifyStatus } from '~/constants/enums'
import User from '~/models/schemas/User.schemas'
import { wrapRequestHandler } from '~/utils/handlers'
import { envConfig } from '~/constants/configs'
import { env } from 'process'

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: envConfig.JWTSecretForgotPasswordToken as string
        })
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (req) {
          ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token

          return true
        }

        return decoded_forgot_password_token
      } catch (error) {
        throw new ErrorWithStatus({
          message: capitalize((error as JsonWebTokenError).message),
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
    }
  }
}

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: envConfig.JWTSecretAccessToken as string
              })

              if (req) {
                /* 
                  req.decoded_authorization -> decoded_authorization: biến tự định nghĩa
                  Gán giá trị cho biến tự định nghĩa này bằng decoded_authorization (từ header)
                  Gán để sử dụng ở các middleware, controller khác
                */
                ;(req as Request).decoded_authorization = decoded_authorization
                return true
              }

              return decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: envConfig.JWTSecretRefreshToken }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user

            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: envConfig.JWTSecretEmailVerifyToken as string
              })

              if (req) {
                ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
                return true
              }

              return decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (user === null) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }
            req.user = user

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_VERIFIED, status: HTTP_STATUS.FORBIDDEN }))
  }
  next()
}

export const userRoleValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const userRole = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, { projection: { role: 1 } })
  if ((userRole as WithId<User>).role === Role.User) {
    return next(new ErrorWithStatus({ message: ADMINS_MESSAGES.USER_IS_NOT_ADMIN, status: HTTP_STATUS.FORBIDDEN }))
  }
  next()
})

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true
      },
      dob: {
        optional: true,
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      },
      phone: {
        optional: true,
        trim: true,
        isMobilePhone: {
          options: ['vi-VN'],
          errorMessage: USERS_MESSAGES.PHONE_IS_INVALID
        }
      },
      address: {
        optional: true,
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH
        }
      },
      job: {
        optional: true,
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGES.JOB_LENGTH
        }
      },
      gender: {
        optional: true,
        isNumeric: {
          errorMessage: USERS_MESSAGES.GENDER_MUST_BE_NUMBER
        },
        custom: {
          options: (value) => {
            if (value !== '0' && value !== '1') {
              throw new Error(USERS_MESSAGES.GENDER_MUST_BE_0_OR_1)
            }
            return true
          }
        }
      },
      agree_policy: {
        optional: true,
        isNumeric: {
          errorMessage: USERS_MESSAGES.AGREE_TO_THE_POLICY_MUST_BE_NUMBER
        },
        custom: {
          options: (value) => {
            if (value !== '0' && value !== '1') {
              throw new Error(USERS_MESSAGES.AGREE_TO_THE_POLICY_MUST_BE_0_OR_1)
            }
            return true
          }
        }
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 500
          },
          errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH
        }
      }
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          const { user_id } = (req as Request).decoded_authorization as TokenPayload
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          const { password } = user
          const isMatch = hashPassword(value) === password
          if (!isMatch) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  })
)
