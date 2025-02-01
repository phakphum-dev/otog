export function searchId(search: string | undefined) {
  const searchAsNumber = parseInt(search ?? '')
  if (Number.isNaN(searchAsNumber)) {
    return {} as {}
  }
  return { id: { equals: searchAsNumber } }
}
