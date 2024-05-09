export const Language = {
  cpp: 'cpp',
  c: 'c',
  py: 'py',
}
export type Language = keyof typeof Language

export const LanguageName: Record<Language, string> = {
  cpp: 'C++',
  c: 'C',
  py: 'Python',
}
