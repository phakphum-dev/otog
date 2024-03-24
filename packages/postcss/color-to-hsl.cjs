const { tokenize, TokenType, NumberType } = require('@csstools/css-tokenizer')
const {
  isFunctionNode,
  parseComponentValue,
  TokenNode,
} = require('@csstools/css-parser-algorithms')
const { color, serializeHSL } = require('@csstools/css-color-parser')

const EXTRACT_COLOR_REGEX = /^colorToHsl\(/i

/**
 * @type {import('postcss').PluginCreator}
 */
const colorToHsl = () => {
  return {
    postcssPlugin: 'postcss-color-to-hsl',
    Declaration: (decl) => {
      const originalValue = decl.value
      if (!EXTRACT_COLOR_REGEX.test(originalValue)) return

      const tokens = tokenize({ css: originalValue })

      const componentValue = parseComponentValue(tokens)
      if (!isFunctionNode(componentValue)) return

      const colorData = color(componentValue.value[0])
      if (!colorData) return

      const hslColor = color(serializeHSL(colorData))
      if (!hslColor || hslColor.colorNotation !== 'hsl') return
      const hsl = hslColor.channels
      const [h, s, l] = hsl
      const channels = [
        new TokenNode([
          TokenType.Number,
          h.toString(),
          -1,
          -1,
          { value: hsl[0], type: NumberType.Integer },
        ]),
        new TokenNode([
          TokenType.Percentage,
          s.toString() + '%',
          -1,
          -1,
          { value: hsl[1] },
        ]),
        new TokenNode([
          TokenType.Percentage,
          l.toString() + '%',
          -1,
          -1,
          { value: hsl[2] },
        ]),
      ]
      decl.cloneBefore({ value: channels.map((it) => it.toString()).join(' ') })
      decl.remove()
    },
  }
}
colorToHsl.postcss = true
module.exports = colorToHsl
