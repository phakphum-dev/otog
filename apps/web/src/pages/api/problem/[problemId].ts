import type { NextApiRequest, NextApiResponse } from 'next'

import { environment } from '../../../env'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const problemId = req.query.problemId
  if (req.method === 'GET' && problemId && !Array.isArray(problemId)) {
    return res
      .status(307)
      .redirect(`${environment.API_HOST}/problem/doc/${problemId}`)
  }
  return res.status(404).end()
}
