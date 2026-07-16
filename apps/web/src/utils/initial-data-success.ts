export function initialDataSuccess<T>(data: T) {
  return {
    headers: {} as Headers,
    body: data,
    status: 200 as const,
  }
}
