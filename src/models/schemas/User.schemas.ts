import { ObjectId } from 'mongodb'
import { GenderType, UserVerifyStatus, Role } from '~/constants/enums'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  password: string
  agree_policy?: number
  gender?: GenderType
  verify?: UserVerifyStatus
  dob?: Date
  role?: Role
  created_at?: Date
  updated_at?: Date // Optional
  avatar?: string // Optional
  phone?: string // Optional
  address?: string // Optional
  job?: string // Optional
  email_verify_token?: string // Optional
  forgot_password_token?: string // Optional
}

export default class User {
  _id?: ObjectId
  name: string
  avatar: string
  email: string
  password: string
  gender: GenderType
  verify: UserVerifyStatus
  dob: Date
  role: Role
  created_at: Date
  updated_at: Date // Optional
  phone: string // Optional
  address: string // Optional
  job: string // Optional
  email_verify_token: string // Optional
  forgot_password_token: string // Optional
  agree_policy: number

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id || new ObjectId()
    this.name = user.name
    this.email = user.email
    this.password = user.password
    this.avatar = user.avatar || ''
    this.gender = user.gender || GenderType.Male
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.dob = user.dob || date
    this.role = user.role || Role.User
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.phone = user.phone || ''
    this.address = user.address || ''
    this.job = user.job || ''
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.agree_policy = user.agree_policy || 0
  }
}
