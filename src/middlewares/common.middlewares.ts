import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'

type FilterKeys<T> = Array<keyof T>

/*
  - filterMiddleware là một hàm higher-order, nghĩa là nó trả về một hàm khác
  -  Nó nhận một tham số kiểu tổng quát T và một tham số filterKeys thuộc kiểu FilterKeys<T>
  - Hàm trả về bởi filterMiddleware là hàm middleware thực sự cho ExpressJS
  - pick(req.body, filterKeys) được sử dụng để tạo ra một đối tượng mới chỉ 
  bao gồm các thuộc tính của req.body được liệt kê trong filterKeys
  -> Middleware này đảm bảo rằng chỉ những khóa cho phép mới được xử lý và lưu trữ,
  cung cấp một cách để kiểm soát và làm sạch dữ liệu đầu vào.
*/
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
