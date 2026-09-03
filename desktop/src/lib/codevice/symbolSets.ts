/**
 * All 13 character sets from ActArtech/codeviceanim.
 */

export type SymbolSetId =
  | "techMap"
  | "greekRunic"
  | "mathSymbols"
  | "katakanaGlitch"
  | "arrowsVectors"
  | "emojiGlyphs"
  | "boxDrawing"
  | "hexCode"
  | "classicAscii"
  | "matrixBinary"
  | "blocksShades"
  | "brailleDots"
  | "dotsOnly";

export interface SymbolSet {
  id: SymbolSetId;
  name: string;
  description: string;
  /** i18n key for the File menu. */
  labelKey: string;
  chars: string[];
}

export const SYMBOL_SETS: readonly SymbolSet[] = [
  {
    id: "techMap",
    name: "Tech Map (Enhanced Hummingbird)",
    description:
      "Ultra-crisp solid dots, halftone rings, directional slashes, and architectural crosshairs.",
    labelKey: "menu.file.symbolTechMap",
    chars: ["●", "◯", "/", "\\", "┼", "┬", "┴", "├", "┤", "─", "│", "+", "x", "·", " "],
  },
  {
    id: "greekRunic",
    name: "Greek & Runic Symbols",
    description: "Scientific and classical Greek alphabet glyph matrix.",
    labelKey: "menu.file.symbolGreekRunic",
    chars: ["Ω", "Ψ", "Σ", "Δ", "Θ", "λ", "π", "μ", "α", "·", " "],
  },
  {
    id: "mathSymbols",
    name: "Mathematical Operators",
    description: "Calculus, algebra, and physics operators density set.",
    labelKey: "menu.file.symbolMath",
    chars: ["∫", "∑", "√", "∞", "≈", "≠", "±", "×", "÷", "·", " "],
  },
  {
    id: "katakanaGlitch",
    name: "Cyber Katakana Glitch",
    description: "Futuristic sci-fi Japanese Katakana character stream.",
    labelKey: "menu.file.symbolKatakana",
    chars: ["ア", "カ", "サ", "タ", "ナ", "ハ", "マ", "ヤ", "ラ", "ワ", "·", " "],
  },
  {
    id: "arrowsVectors",
    name: "Directional Vector Arrows",
    description: "Flowchart and vector directional arrows.",
    labelKey: "menu.file.symbolArrows",
    chars: ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖", "↔", "↕", " "],
  },
  {
    id: "emojiGlyphs",
    name: "Aesthetic Geometry & Stars",
    description: "Modern minimalist geometric stars, diamonds, and nodes.",
    labelKey: "menu.file.symbolGeometry",
    chars: ["✦", "★", "❖", "◈", "◆", "◇", "●", "o", "·", " "],
  },
  {
    id: "boxDrawing",
    name: "Box Drawing Tech Grid",
    description: "Architectural blueprint line art and crosshairs.",
    labelKey: "menu.file.symbolBox",
    chars: ["█", "┼", "┴", "┬", "┤", "├", "│", "─", "·", " "],
  },
  {
    id: "hexCode",
    name: "Hexadecimal Byte Stream",
    description: "Base-16 raw memory hex codes.",
    labelKey: "menu.file.symbolHex",
    chars: ["F", "E", "D", "C", "B", "A", "9", "5", "0", " "],
  },
  {
    id: "classicAscii",
    name: "Classic ASCII Density",
    description: "Standard density-based ASCII character map from dark to light.",
    labelKey: "menu.file.symbolClassicAscii",
    chars: ["@", "#", "$", "%", "*", "!", ";", ":", ",", ".", " "],
  },
  {
    id: "matrixBinary",
    name: "Matrix Binary Stream",
    description: "Digital 0s and 1s with directional matrix code strokes.",
    labelKey: "menu.file.symbolMatrix",
    chars: ["1", "0", "1", "0", "/", "\\", "|", "-", " "],
  },
  {
    id: "blocksShades",
    name: "Shaded Block Matrix",
    description: "Geometric block glyphs for solid halftone art feel.",
    labelKey: "menu.file.symbolBlocks",
    chars: ["█", "▓", "▒", "░", "◼", "◻", "▪", "▫", " "],
  },
  {
    id: "brailleDots",
    name: "Braille Dot Matrix",
    description: "Tactile dot pattern effect with varied dot count.",
    labelKey: "menu.file.symbolBraille",
    chars: ["⣿", "⣶", "⣤", "⠶", "⠤", "⠒", "⠄", " "],
  },
  {
    id: "dotsOnly",
    name: "Pure Halftone Dots",
    description: "Clean halftone dot arrays of varying radii.",
    labelKey: "menu.file.symbolDots",
    chars: ["●", "◯", "⚬", "•", "·", " "],
  },
];

export function symbolSetById(id: SymbolSetId): SymbolSet {
  return SYMBOL_SETS.find((set) => set.id === id) ?? SYMBOL_SETS[0];
}

export const DEFAULT_ASCII_PALETTE = {
  background: "#0b0f14",
  foreground: "#5ac8fa",
};
