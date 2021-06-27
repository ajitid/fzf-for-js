package main

import (
	"fmt"
	"bytes"
	"strings"
	"sort"
	"unicode"
	"unicode/utf8"
	"unsafe"
	"math"
)


func AsUint16(val int) uint16 {
	if val > math.MaxUint16 {
		return math.MaxUint16
	} else if val < 0 {
		return 0
	}
	return uint16(val)
}


// Max returns the largest integer
func Max(first int, second int) int {
	if first >= second {
		return first
	}
	return second
}

// Max16 returns the largest integer
func Max16(first int16, second int16) int16 {
	if first >= second {
		return first
	}
	return second
}

// Max32 returns the largest 32-bit integer
func Max32(first int32, second int32) int32 {
	if first > second {
		return first
	}
	return second
}

// Min returns the smallest integer
func Min(first int, second int) int {
	if first <= second {
		return first
	}
	return second
}

// Min32 returns the smallest 32-bit integer
func Min32(first int32, second int32) int32 {
	if first <= second {
		return first
	}
	return second
}



var normalized map[rune]rune = map[rune]rune{
	0x00E1: 'a', //  WITH ACUTE, LATIN SMALL LETTER
	0x0103: 'a', //  WITH BREVE, LATIN SMALL LETTER
	0x01CE: 'a', //  WITH CARON, LATIN SMALL LETTER
	0x00E2: 'a', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x00E4: 'a', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x0227: 'a', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1EA1: 'a', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0201: 'a', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x00E0: 'a', //  WITH GRAVE, LATIN SMALL LETTER
	0x1EA3: 'a', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x0203: 'a', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x0101: 'a', //  WITH MACRON, LATIN SMALL LETTER
	0x0105: 'a', //  WITH OGONEK, LATIN SMALL LETTER
	0x1E9A: 'a', //  WITH RIGHT HALF RING, LATIN SMALL LETTER
	0x00E5: 'a', //  WITH RING ABOVE, LATIN SMALL LETTER
	0x1E01: 'a', //  WITH RING BELOW, LATIN SMALL LETTER
	0x00E3: 'a', //  WITH TILDE, LATIN SMALL LETTER
	0x0363: 'a', // , COMBINING LATIN SMALL LETTER
	0x0250: 'a', // , LATIN SMALL LETTER TURNED
	0x1E03: 'b', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E05: 'b', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0253: 'b', //  WITH HOOK, LATIN SMALL LETTER
	0x1E07: 'b', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x0180: 'b', //  WITH STROKE, LATIN SMALL LETTER
	0x0183: 'b', //  WITH TOPBAR, LATIN SMALL LETTER
	0x0107: 'c', //  WITH ACUTE, LATIN SMALL LETTER
	0x010D: 'c', //  WITH CARON, LATIN SMALL LETTER
	0x00E7: 'c', //  WITH CEDILLA, LATIN SMALL LETTER
	0x0109: 'c', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x0255: 'c', //  WITH CURL, LATIN SMALL LETTER
	0x010B: 'c', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x0188: 'c', //  WITH HOOK, LATIN SMALL LETTER
	0x023C: 'c', //  WITH STROKE, LATIN SMALL LETTER
	0x0368: 'c', // , COMBINING LATIN SMALL LETTER
	0x0297: 'c', // , LATIN LETTER STRETCHED
	0x2184: 'c', // , LATIN SMALL LETTER REVERSED
	0x010F: 'd', //  WITH CARON, LATIN SMALL LETTER
	0x1E11: 'd', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E13: 'd', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x0221: 'd', //  WITH CURL, LATIN SMALL LETTER
	0x1E0B: 'd', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E0D: 'd', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0257: 'd', //  WITH HOOK, LATIN SMALL LETTER
	0x1E0F: 'd', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x0111: 'd', //  WITH STROKE, LATIN SMALL LETTER
	0x0256: 'd', //  WITH TAIL, LATIN SMALL LETTER
	0x018C: 'd', //  WITH TOPBAR, LATIN SMALL LETTER
	0x0369: 'd', // , COMBINING LATIN SMALL LETTER
	0x00E9: 'e', //  WITH ACUTE, LATIN SMALL LETTER
	0x0115: 'e', //  WITH BREVE, LATIN SMALL LETTER
	0x011B: 'e', //  WITH CARON, LATIN SMALL LETTER
	0x0229: 'e', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E19: 'e', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x00EA: 'e', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x00EB: 'e', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x0117: 'e', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1EB9: 'e', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0205: 'e', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x00E8: 'e', //  WITH GRAVE, LATIN SMALL LETTER
	0x1EBB: 'e', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x025D: 'e', //  WITH HOOK, LATIN SMALL LETTER REVERSED OPEN
	0x0207: 'e', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x0113: 'e', //  WITH MACRON, LATIN SMALL LETTER
	0x0119: 'e', //  WITH OGONEK, LATIN SMALL LETTER
	0x0247: 'e', //  WITH STROKE, LATIN SMALL LETTER
	0x1E1B: 'e', //  WITH TILDE BELOW, LATIN SMALL LETTER
	0x1EBD: 'e', //  WITH TILDE, LATIN SMALL LETTER
	0x0364: 'e', // , COMBINING LATIN SMALL LETTER
	0x029A: 'e', // , LATIN SMALL LETTER CLOSED OPEN
	0x025E: 'e', // , LATIN SMALL LETTER CLOSED REVERSED OPEN
	0x025B: 'e', // , LATIN SMALL LETTER OPEN
	0x0258: 'e', // , LATIN SMALL LETTER REVERSED
	0x025C: 'e', // , LATIN SMALL LETTER REVERSED OPEN
	0x01DD: 'e', // , LATIN SMALL LETTER TURNED
	0x1D08: 'e', // , LATIN SMALL LETTER TURNED OPEN
	0x1E1F: 'f', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x0192: 'f', //  WITH HOOK, LATIN SMALL LETTER
	0x01F5: 'g', //  WITH ACUTE, LATIN SMALL LETTER
	0x011F: 'g', //  WITH BREVE, LATIN SMALL LETTER
	0x01E7: 'g', //  WITH CARON, LATIN SMALL LETTER
	0x0123: 'g', //  WITH CEDILLA, LATIN SMALL LETTER
	0x011D: 'g', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x0121: 'g', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x0260: 'g', //  WITH HOOK, LATIN SMALL LETTER
	0x1E21: 'g', //  WITH MACRON, LATIN SMALL LETTER
	0x01E5: 'g', //  WITH STROKE, LATIN SMALL LETTER
	0x0261: 'g', // , LATIN SMALL LETTER SCRIPT
	0x1E2B: 'h', //  WITH BREVE BELOW, LATIN SMALL LETTER
	0x021F: 'h', //  WITH CARON, LATIN SMALL LETTER
	0x1E29: 'h', //  WITH CEDILLA, LATIN SMALL LETTER
	0x0125: 'h', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x1E27: 'h', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1E23: 'h', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E25: 'h', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x02AE: 'h', //  WITH FISHHOOK, LATIN SMALL LETTER TURNED
	0x0266: 'h', //  WITH HOOK, LATIN SMALL LETTER
	0x1E96: 'h', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x0127: 'h', //  WITH STROKE, LATIN SMALL LETTER
	0x036A: 'h', // , COMBINING LATIN SMALL LETTER
	0x0265: 'h', // , LATIN SMALL LETTER TURNED
	0x2095: 'h', // , LATIN SUBSCRIPT SMALL LETTER
	0x00ED: 'i', //  WITH ACUTE, LATIN SMALL LETTER
	0x012D: 'i', //  WITH BREVE, LATIN SMALL LETTER
	0x01D0: 'i', //  WITH CARON, LATIN SMALL LETTER
	0x00EE: 'i', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x00EF: 'i', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1ECB: 'i', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0209: 'i', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x00EC: 'i', //  WITH GRAVE, LATIN SMALL LETTER
	0x1EC9: 'i', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x020B: 'i', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x012B: 'i', //  WITH MACRON, LATIN SMALL LETTER
	0x012F: 'i', //  WITH OGONEK, LATIN SMALL LETTER
	0x0268: 'i', //  WITH STROKE, LATIN SMALL LETTER
	0x1E2D: 'i', //  WITH TILDE BELOW, LATIN SMALL LETTER
	0x0129: 'i', //  WITH TILDE, LATIN SMALL LETTER
	0x0365: 'i', // , COMBINING LATIN SMALL LETTER
	0x0131: 'i', // , LATIN SMALL LETTER DOTLESS
	0x1D09: 'i', // , LATIN SMALL LETTER TURNED
	0x1D62: 'i', // , LATIN SUBSCRIPT SMALL LETTER
	0x2071: 'i', // , SUPERSCRIPT LATIN SMALL LETTER
	0x01F0: 'j', //  WITH CARON, LATIN SMALL LETTER
	0x0135: 'j', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x029D: 'j', //  WITH CROSSED-TAIL, LATIN SMALL LETTER
	0x0249: 'j', //  WITH STROKE, LATIN SMALL LETTER
	0x025F: 'j', //  WITH STROKE, LATIN SMALL LETTER DOTLESS
	0x0237: 'j', // , LATIN SMALL LETTER DOTLESS
	0x1E31: 'k', //  WITH ACUTE, LATIN SMALL LETTER
	0x01E9: 'k', //  WITH CARON, LATIN SMALL LETTER
	0x0137: 'k', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E33: 'k', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0199: 'k', //  WITH HOOK, LATIN SMALL LETTER
	0x1E35: 'k', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x029E: 'k', // , LATIN SMALL LETTER TURNED
	0x2096: 'k', // , LATIN SUBSCRIPT SMALL LETTER
	0x013A: 'l', //  WITH ACUTE, LATIN SMALL LETTER
	0x019A: 'l', //  WITH BAR, LATIN SMALL LETTER
	0x026C: 'l', //  WITH BELT, LATIN SMALL LETTER
	0x013E: 'l', //  WITH CARON, LATIN SMALL LETTER
	0x013C: 'l', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E3D: 'l', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x0234: 'l', //  WITH CURL, LATIN SMALL LETTER
	0x1E37: 'l', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x1E3B: 'l', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x0140: 'l', //  WITH MIDDLE DOT, LATIN SMALL LETTER
	0x026B: 'l', //  WITH MIDDLE TILDE, LATIN SMALL LETTER
	0x026D: 'l', //  WITH RETROFLEX HOOK, LATIN SMALL LETTER
	0x0142: 'l', //  WITH STROKE, LATIN SMALL LETTER
	0x2097: 'l', // , LATIN SUBSCRIPT SMALL LETTER
	0x1E3F: 'm', //  WITH ACUTE, LATIN SMALL LETTER
	0x1E41: 'm', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E43: 'm', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0271: 'm', //  WITH HOOK, LATIN SMALL LETTER
	0x0270: 'm', //  WITH LONG LEG, LATIN SMALL LETTER TURNED
	0x036B: 'm', // , COMBINING LATIN SMALL LETTER
	0x1D1F: 'm', // , LATIN SMALL LETTER SIDEWAYS TURNED
	0x026F: 'm', // , LATIN SMALL LETTER TURNED
	0x2098: 'm', // , LATIN SUBSCRIPT SMALL LETTER
	0x0144: 'n', //  WITH ACUTE, LATIN SMALL LETTER
	0x0148: 'n', //  WITH CARON, LATIN SMALL LETTER
	0x0146: 'n', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E4B: 'n', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x0235: 'n', //  WITH CURL, LATIN SMALL LETTER
	0x1E45: 'n', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E47: 'n', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x01F9: 'n', //  WITH GRAVE, LATIN SMALL LETTER
	0x0272: 'n', //  WITH LEFT HOOK, LATIN SMALL LETTER
	0x1E49: 'n', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x019E: 'n', //  WITH LONG RIGHT LEG, LATIN SMALL LETTER
	0x0273: 'n', //  WITH RETROFLEX HOOK, LATIN SMALL LETTER
	0x00F1: 'n', //  WITH TILDE, LATIN SMALL LETTER
	0x2099: 'n', // , LATIN SUBSCRIPT SMALL LETTER
	0x00F3: 'o', //  WITH ACUTE, LATIN SMALL LETTER
	0x014F: 'o', //  WITH BREVE, LATIN SMALL LETTER
	0x01D2: 'o', //  WITH CARON, LATIN SMALL LETTER
	0x00F4: 'o', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x00F6: 'o', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x022F: 'o', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1ECD: 'o', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0151: 'o', //  WITH DOUBLE ACUTE, LATIN SMALL LETTER
	0x020D: 'o', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x00F2: 'o', //  WITH GRAVE, LATIN SMALL LETTER
	0x1ECF: 'o', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x01A1: 'o', //  WITH HORN, LATIN SMALL LETTER
	0x020F: 'o', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x014D: 'o', //  WITH MACRON, LATIN SMALL LETTER
	0x01EB: 'o', //  WITH OGONEK, LATIN SMALL LETTER
	0x00F8: 'o', //  WITH STROKE, LATIN SMALL LETTER
	0x1D13: 'o', //  WITH STROKE, LATIN SMALL LETTER SIDEWAYS
	0x00F5: 'o', //  WITH TILDE, LATIN SMALL LETTER
	0x0366: 'o', // , COMBINING LATIN SMALL LETTER
	0x0275: 'o', // , LATIN SMALL LETTER BARRED
	0x1D17: 'o', // , LATIN SMALL LETTER BOTTOM HALF
	0x0254: 'o', // , LATIN SMALL LETTER OPEN
	0x1D11: 'o', // , LATIN SMALL LETTER SIDEWAYS
	0x1D12: 'o', // , LATIN SMALL LETTER SIDEWAYS OPEN
	0x1D16: 'o', // , LATIN SMALL LETTER TOP HALF
	0x1E55: 'p', //  WITH ACUTE, LATIN SMALL LETTER
	0x1E57: 'p', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x01A5: 'p', //  WITH HOOK, LATIN SMALL LETTER
	0x209A: 'p', // , LATIN SUBSCRIPT SMALL LETTER
	0x024B: 'q', //  WITH HOOK TAIL, LATIN SMALL LETTER
	0x02A0: 'q', //  WITH HOOK, LATIN SMALL LETTER
	0x0155: 'r', //  WITH ACUTE, LATIN SMALL LETTER
	0x0159: 'r', //  WITH CARON, LATIN SMALL LETTER
	0x0157: 'r', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E59: 'r', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E5B: 'r', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0211: 'r', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x027E: 'r', //  WITH FISHHOOK, LATIN SMALL LETTER
	0x027F: 'r', //  WITH FISHHOOK, LATIN SMALL LETTER REVERSED
	0x027B: 'r', //  WITH HOOK, LATIN SMALL LETTER TURNED
	0x0213: 'r', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x1E5F: 'r', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x027C: 'r', //  WITH LONG LEG, LATIN SMALL LETTER
	0x027A: 'r', //  WITH LONG LEG, LATIN SMALL LETTER TURNED
	0x024D: 'r', //  WITH STROKE, LATIN SMALL LETTER
	0x027D: 'r', //  WITH TAIL, LATIN SMALL LETTER
	0x036C: 'r', // , COMBINING LATIN SMALL LETTER
	0x0279: 'r', // , LATIN SMALL LETTER TURNED
	0x1D63: 'r', // , LATIN SUBSCRIPT SMALL LETTER
	0x015B: 's', //  WITH ACUTE, LATIN SMALL LETTER
	0x0161: 's', //  WITH CARON, LATIN SMALL LETTER
	0x015F: 's', //  WITH CEDILLA, LATIN SMALL LETTER
	0x015D: 's', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x0219: 's', //  WITH COMMA BELOW, LATIN SMALL LETTER
	0x1E61: 's', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E9B: 's', //  WITH DOT ABOVE, LATIN SMALL LETTER LONG
	0x1E63: 's', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0282: 's', //  WITH HOOK, LATIN SMALL LETTER
	0x023F: 's', //  WITH SWASH TAIL, LATIN SMALL LETTER
	0x017F: 's', // , LATIN SMALL LETTER LONG
	0x00DF: 's', // , LATIN SMALL LETTER SHARP
	0x209B: 's', // , LATIN SUBSCRIPT SMALL LETTER
	0x0165: 't', //  WITH CARON, LATIN SMALL LETTER
	0x0163: 't', //  WITH CEDILLA, LATIN SMALL LETTER
	0x1E71: 't', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x021B: 't', //  WITH COMMA BELOW, LATIN SMALL LETTER
	0x0236: 't', //  WITH CURL, LATIN SMALL LETTER
	0x1E97: 't', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1E6B: 't', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E6D: 't', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x01AD: 't', //  WITH HOOK, LATIN SMALL LETTER
	0x1E6F: 't', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x01AB: 't', //  WITH PALATAL HOOK, LATIN SMALL LETTER
	0x0288: 't', //  WITH RETROFLEX HOOK, LATIN SMALL LETTER
	0x0167: 't', //  WITH STROKE, LATIN SMALL LETTER
	0x036D: 't', // , COMBINING LATIN SMALL LETTER
	0x0287: 't', // , LATIN SMALL LETTER TURNED
	0x209C: 't', // , LATIN SUBSCRIPT SMALL LETTER
	0x0289: 'u', //  BAR, LATIN SMALL LETTER
	0x00FA: 'u', //  WITH ACUTE, LATIN SMALL LETTER
	0x016D: 'u', //  WITH BREVE, LATIN SMALL LETTER
	0x01D4: 'u', //  WITH CARON, LATIN SMALL LETTER
	0x1E77: 'u', //  WITH CIRCUMFLEX BELOW, LATIN SMALL LETTER
	0x00FB: 'u', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x1E73: 'u', //  WITH DIAERESIS BELOW, LATIN SMALL LETTER
	0x00FC: 'u', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1EE5: 'u', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0171: 'u', //  WITH DOUBLE ACUTE, LATIN SMALL LETTER
	0x0215: 'u', //  WITH DOUBLE GRAVE, LATIN SMALL LETTER
	0x00F9: 'u', //  WITH GRAVE, LATIN SMALL LETTER
	0x1EE7: 'u', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x01B0: 'u', //  WITH HORN, LATIN SMALL LETTER
	0x0217: 'u', //  WITH INVERTED BREVE, LATIN SMALL LETTER
	0x016B: 'u', //  WITH MACRON, LATIN SMALL LETTER
	0x0173: 'u', //  WITH OGONEK, LATIN SMALL LETTER
	0x016F: 'u', //  WITH RING ABOVE, LATIN SMALL LETTER
	0x1E75: 'u', //  WITH TILDE BELOW, LATIN SMALL LETTER
	0x0169: 'u', //  WITH TILDE, LATIN SMALL LETTER
	0x0367: 'u', // , COMBINING LATIN SMALL LETTER
	0x1D1D: 'u', // , LATIN SMALL LETTER SIDEWAYS
	0x1D1E: 'u', // , LATIN SMALL LETTER SIDEWAYS DIAERESIZED
	0x1D64: 'u', // , LATIN SUBSCRIPT SMALL LETTER
	0x1E7F: 'v', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x028B: 'v', //  WITH HOOK, LATIN SMALL LETTER
	0x1E7D: 'v', //  WITH TILDE, LATIN SMALL LETTER
	0x036E: 'v', // , COMBINING LATIN SMALL LETTER
	0x028C: 'v', // , LATIN SMALL LETTER TURNED
	0x1D65: 'v', // , LATIN SUBSCRIPT SMALL LETTER
	0x1E83: 'w', //  WITH ACUTE, LATIN SMALL LETTER
	0x0175: 'w', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x1E85: 'w', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1E87: 'w', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E89: 'w', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x1E81: 'w', //  WITH GRAVE, LATIN SMALL LETTER
	0x1E98: 'w', //  WITH RING ABOVE, LATIN SMALL LETTER
	0x028D: 'w', // , LATIN SMALL LETTER TURNED
	0x1E8D: 'x', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1E8B: 'x', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x036F: 'x', // , COMBINING LATIN SMALL LETTER
	0x00FD: 'y', //  WITH ACUTE, LATIN SMALL LETTER
	0x0177: 'y', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x00FF: 'y', //  WITH DIAERESIS, LATIN SMALL LETTER
	0x1E8F: 'y', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1EF5: 'y', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x1EF3: 'y', //  WITH GRAVE, LATIN SMALL LETTER
	0x1EF7: 'y', //  WITH HOOK ABOVE, LATIN SMALL LETTER
	0x01B4: 'y', //  WITH HOOK, LATIN SMALL LETTER
	0x0233: 'y', //  WITH MACRON, LATIN SMALL LETTER
	0x1E99: 'y', //  WITH RING ABOVE, LATIN SMALL LETTER
	0x024F: 'y', //  WITH STROKE, LATIN SMALL LETTER
	0x1EF9: 'y', //  WITH TILDE, LATIN SMALL LETTER
	0x028E: 'y', // , LATIN SMALL LETTER TURNED
	0x017A: 'z', //  WITH ACUTE, LATIN SMALL LETTER
	0x017E: 'z', //  WITH CARON, LATIN SMALL LETTER
	0x1E91: 'z', //  WITH CIRCUMFLEX, LATIN SMALL LETTER
	0x0291: 'z', //  WITH CURL, LATIN SMALL LETTER
	0x017C: 'z', //  WITH DOT ABOVE, LATIN SMALL LETTER
	0x1E93: 'z', //  WITH DOT BELOW, LATIN SMALL LETTER
	0x0225: 'z', //  WITH HOOK, LATIN SMALL LETTER
	0x1E95: 'z', //  WITH LINE BELOW, LATIN SMALL LETTER
	0x0290: 'z', //  WITH RETROFLEX HOOK, LATIN SMALL LETTER
	0x01B6: 'z', //  WITH STROKE, LATIN SMALL LETTER
	0x0240: 'z', //  WITH SWASH TAIL, LATIN SMALL LETTER
	0x0251: 'a', // , latin small letter script
	0x00C1: 'A', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x00C2: 'A', //  WITH CIRCUMFLEX, LATIN CAPITAL LETTER
	0x00C4: 'A', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x00C0: 'A', //  WITH GRAVE, LATIN CAPITAL LETTER
	0x00C5: 'A', //  WITH RING ABOVE, LATIN CAPITAL LETTER
	0x023A: 'A', //  WITH STROKE, LATIN CAPITAL LETTER
	0x00C3: 'A', //  WITH TILDE, LATIN CAPITAL LETTER
	0x1D00: 'A', // , LATIN LETTER SMALL CAPITAL
	0x0181: 'B', //  WITH HOOK, LATIN CAPITAL LETTER
	0x0243: 'B', //  WITH STROKE, LATIN CAPITAL LETTER
	0x0299: 'B', // , LATIN LETTER SMALL CAPITAL
	0x1D03: 'B', // , LATIN LETTER SMALL CAPITAL BARRED
	0x00C7: 'C', //  WITH CEDILLA, LATIN CAPITAL LETTER
	0x023B: 'C', //  WITH STROKE, LATIN CAPITAL LETTER
	0x1D04: 'C', // , LATIN LETTER SMALL CAPITAL
	0x018A: 'D', //  WITH HOOK, LATIN CAPITAL LETTER
	0x0189: 'D', // , LATIN CAPITAL LETTER AFRICAN
	0x1D05: 'D', // , LATIN LETTER SMALL CAPITAL
	0x00C9: 'E', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x00CA: 'E', //  WITH CIRCUMFLEX, LATIN CAPITAL LETTER
	0x00CB: 'E', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x00C8: 'E', //  WITH GRAVE, LATIN CAPITAL LETTER
	0x0246: 'E', //  WITH STROKE, LATIN CAPITAL LETTER
	0x0190: 'E', // , LATIN CAPITAL LETTER OPEN
	0x018E: 'E', // , LATIN CAPITAL LETTER REVERSED
	0x1D07: 'E', // , LATIN LETTER SMALL CAPITAL
	0x0193: 'G', //  WITH HOOK, LATIN CAPITAL LETTER
	0x029B: 'G', //  WITH HOOK, LATIN LETTER SMALL CAPITAL
	0x0262: 'G', // , LATIN LETTER SMALL CAPITAL
	0x029C: 'H', // , LATIN LETTER SMALL CAPITAL
	0x00CD: 'I', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x00CE: 'I', //  WITH CIRCUMFLEX, LATIN CAPITAL LETTER
	0x00CF: 'I', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x0130: 'I', //  WITH DOT ABOVE, LATIN CAPITAL LETTER
	0x00CC: 'I', //  WITH GRAVE, LATIN CAPITAL LETTER
	0x0197: 'I', //  WITH STROKE, LATIN CAPITAL LETTER
	0x026A: 'I', // , LATIN LETTER SMALL CAPITAL
	0x0248: 'J', //  WITH STROKE, LATIN CAPITAL LETTER
	0x1D0A: 'J', // , LATIN LETTER SMALL CAPITAL
	0x1D0B: 'K', // , LATIN LETTER SMALL CAPITAL
	0x023D: 'L', //  WITH BAR, LATIN CAPITAL LETTER
	0x1D0C: 'L', //  WITH STROKE, LATIN LETTER SMALL CAPITAL
	0x029F: 'L', // , LATIN LETTER SMALL CAPITAL
	0x019C: 'M', // , LATIN CAPITAL LETTER TURNED
	0x1D0D: 'M', // , LATIN LETTER SMALL CAPITAL
	0x019D: 'N', //  WITH LEFT HOOK, LATIN CAPITAL LETTER
	0x0220: 'N', //  WITH LONG RIGHT LEG, LATIN CAPITAL LETTER
	0x00D1: 'N', //  WITH TILDE, LATIN CAPITAL LETTER
	0x0274: 'N', // , LATIN LETTER SMALL CAPITAL
	0x1D0E: 'N', // , LATIN LETTER SMALL CAPITAL REVERSED
	0x00D3: 'O', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x00D4: 'O', //  WITH CIRCUMFLEX, LATIN CAPITAL LETTER
	0x00D6: 'O', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x00D2: 'O', //  WITH GRAVE, LATIN CAPITAL LETTER
	0x019F: 'O', //  WITH MIDDLE TILDE, LATIN CAPITAL LETTER
	0x00D8: 'O', //  WITH STROKE, LATIN CAPITAL LETTER
	0x00D5: 'O', //  WITH TILDE, LATIN CAPITAL LETTER
	0x0186: 'O', // , LATIN CAPITAL LETTER OPEN
	0x1D0F: 'O', // , LATIN LETTER SMALL CAPITAL
	0x1D10: 'O', // , LATIN LETTER SMALL CAPITAL OPEN
	0x1D18: 'P', // , LATIN LETTER SMALL CAPITAL
	0x024A: 'Q', //  WITH HOOK TAIL, LATIN CAPITAL LETTER SMALL
	0x024C: 'R', //  WITH STROKE, LATIN CAPITAL LETTER
	0x0280: 'R', // , LATIN LETTER SMALL CAPITAL
	0x0281: 'R', // , LATIN LETTER SMALL CAPITAL INVERTED
	0x1D19: 'R', // , LATIN LETTER SMALL CAPITAL REVERSED
	0x1D1A: 'R', // , LATIN LETTER SMALL CAPITAL TURNED
	0x023E: 'T', //  WITH DIAGONAL STROKE, LATIN CAPITAL LETTER
	0x01AE: 'T', //  WITH RETROFLEX HOOK, LATIN CAPITAL LETTER
	0x1D1B: 'T', // , LATIN LETTER SMALL CAPITAL
	0x0244: 'U', //  BAR, LATIN CAPITAL LETTER
	0x00DA: 'U', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x00DB: 'U', //  WITH CIRCUMFLEX, LATIN CAPITAL LETTER
	0x00DC: 'U', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x00D9: 'U', //  WITH GRAVE, LATIN CAPITAL LETTER
	0x1D1C: 'U', // , LATIN LETTER SMALL CAPITAL
	0x01B2: 'V', //  WITH HOOK, LATIN CAPITAL LETTER
	0x0245: 'V', // , LATIN CAPITAL LETTER TURNED
	0x1D20: 'V', // , LATIN LETTER SMALL CAPITAL
	0x1D21: 'W', // , LATIN LETTER SMALL CAPITAL
	0x00DD: 'Y', //  WITH ACUTE, LATIN CAPITAL LETTER
	0x0178: 'Y', //  WITH DIAERESIS, LATIN CAPITAL LETTER
	0x024E: 'Y', //  WITH STROKE, LATIN CAPITAL LETTER
	0x028F: 'Y', // , LATIN LETTER SMALL CAPITAL
	0x1D22: 'Z', // , LATIN LETTER SMALL CAPITAL

	'Ắ': 'A',
	'Ấ': 'A',
	'Ằ': 'A',
	'Ầ': 'A',
	'Ẳ': 'A',
	'Ẩ': 'A',
	'Ẵ': 'A',
	'Ẫ': 'A',
	'Ặ': 'A',
	'Ậ': 'A',

	'ắ': 'a',
	'ấ': 'a',
	'ằ': 'a',
	'ầ': 'a',
	'ẳ': 'a',
	'ẩ': 'a',
	'ẵ': 'a',
	'ẫ': 'a',
	'ặ': 'a',
	'ậ': 'a',

	'Ế': 'E',
	'Ề': 'E',
	'Ể': 'E',
	'Ễ': 'E',
	'Ệ': 'E',

	'ế': 'e',
	'ề': 'e',
	'ể': 'e',
	'ễ': 'e',
	'ệ': 'e',

	'Ố': 'O',
	'Ớ': 'O',
	'Ồ': 'O',
	'Ờ': 'O',
	'Ổ': 'O',
	'Ở': 'O',
	'Ỗ': 'O',
	'Ỡ': 'O',
	'Ộ': 'O',
	'Ợ': 'O',

	'ố': 'o',
	'ớ': 'o',
	'ồ': 'o',
	'ờ': 'o',
	'ổ': 'o',
	'ở': 'o',
	'ỗ': 'o',
	'ỡ': 'o',
	'ộ': 'o',
	'ợ': 'o',

	'Ứ': 'U',
	'Ừ': 'U',
	'Ử': 'U',
	'Ữ': 'U',
	'Ự': 'U',

	'ứ': 'u',
	'ừ': 'u',
	'ử': 'u',
	'ữ': 'u',
	'ự': 'u',
}

// NormalizeRunes normalizes latin script letters
func NormalizeRunes(runes []rune) []rune {
	ret := make([]rune, len(runes))
	copy(ret, runes)
	for idx, r := range runes {
		if r < 0x00C0 || r > 0x2184 {
			continue
		}
		n := normalized[r]
		if n > 0 {
			ret[idx] = normalized[r]
		}
	}
	return ret
}

type Slab struct {
	I16 []int16
	I32 []int32
}

func MakeSlab(size16 int, size32 int) *Slab {
	return &Slab{
		I16: make([]int16, size16),
		I32: make([]int32, size32)}
}



const (
	overflow64 uint64 = 0x8080808080808080
	overflow32 uint32 = 0x80808080
)

type Chars struct {
	slice           []byte // or []rune
	inBytes         bool
	trimLengthKnown bool
	trimLength      uint16

	// XXX Piggybacking item index here is a horrible idea. But I'm trying to
	// minimize the memory footprint by not wasting padded spaces.
	Index int32
}

func checkAscii(bytes []byte) (bool, int) {
	i := 0
	for ; i <= len(bytes)-8; i += 8 {
		if (overflow64 & *(*uint64)(unsafe.Pointer(&bytes[i]))) > 0 {
			return false, i
		}
	}
	for ; i <= len(bytes)-4; i += 4 {
		if (overflow32 & *(*uint32)(unsafe.Pointer(&bytes[i]))) > 0 {
			return false, i
		}
	}
	for ; i < len(bytes); i++ {
		if bytes[i] >= utf8.RuneSelf {
			return false, i
		}
	}
	return true, 0
}

// ToChars converts byte array into rune array
func ToChars(bytes []byte) Chars {
	inBytes, bytesUntil := checkAscii(bytes)
	if inBytes {
		return Chars{slice: bytes, inBytes: inBytes}
	}

	runes := make([]rune, bytesUntil, len(bytes))
	for i := 0; i < bytesUntil; i++ {
		runes[i] = rune(bytes[i])
	}
	for i := bytesUntil; i < len(bytes); {
		r, sz := utf8.DecodeRune(bytes[i:])
		i += sz
		runes = append(runes, r)
	}
	return RunesToChars(runes)
}

func RunesToChars(runes []rune) Chars {
	return Chars{slice: *(*[]byte)(unsafe.Pointer(&runes)), inBytes: false}
}

func (chars *Chars) IsBytes() bool {
	return chars.inBytes
}

func (chars *Chars) Bytes() []byte {
	return chars.slice
}

func (chars *Chars) optionalRunes() []rune {
	if chars.inBytes {
		return nil
	}
	return *(*[]rune)(unsafe.Pointer(&chars.slice))
}

func (chars *Chars) Get(i int) rune {
	if runes := chars.optionalRunes(); runes != nil {
		return runes[i]
	}
	return rune(chars.slice[i])
}

func (chars *Chars) Length() int {
	if runes := chars.optionalRunes(); runes != nil {
		return len(runes)
	}
	return len(chars.slice)
}

// String returns the string representation of a Chars object.
func (chars *Chars) String() string {
	return fmt.Sprintf("Chars{slice: []byte(%q), inBytes: %v, trimLengthKnown: %v, trimLength: %d, Index: %d}", chars.slice, chars.inBytes, chars.trimLengthKnown, chars.trimLength, chars.Index)
}

// TrimLength returns the length after trimming leading and trailing whitespaces
func (chars *Chars) TrimLength() uint16 {
	if chars.trimLengthKnown {
		return chars.trimLength
	}
	chars.trimLengthKnown = true
	var i int
	len := chars.Length()
	for i = len - 1; i >= 0; i-- {
		char := chars.Get(i)
		if !unicode.IsSpace(char) {
			break
		}
	}
	// Completely empty
	if i < 0 {
		return 0
	}

	var j int
	for j = 0; j < len; j++ {
		char := chars.Get(j)
		if !unicode.IsSpace(char) {
			break
		}
	}
	chars.trimLength = AsUint16(i - j + 1)
	return chars.trimLength
}

func (chars *Chars) LeadingWhitespaces() int {
	whitespaces := 0
	for i := 0; i < chars.Length(); i++ {
		char := chars.Get(i)
		if !unicode.IsSpace(char) {
			break
		}
		whitespaces++
	}
	return whitespaces
}

func (chars *Chars) TrailingWhitespaces() int {
	whitespaces := 0
	for i := chars.Length() - 1; i >= 0; i-- {
		char := chars.Get(i)
		if !unicode.IsSpace(char) {
			break
		}
		whitespaces++
	}
	return whitespaces
}

func (chars *Chars) TrimTrailingWhitespaces() {
	whitespaces := chars.TrailingWhitespaces()
	chars.slice = chars.slice[0 : len(chars.slice)-whitespaces]
}

func (chars *Chars) ToString() string {
	if runes := chars.optionalRunes(); runes != nil {
		return string(runes)
	}
	return string(chars.slice)
}

func (chars *Chars) ToRunes() []rune {
	if runes := chars.optionalRunes(); runes != nil {
		return runes
	}
	bytes := chars.slice
	runes := make([]rune, len(bytes))
	for idx, b := range bytes {
		runes[idx] = rune(b)
	}
	return runes
}

func (chars *Chars) CopyRunes(dest []rune) {
	if runes := chars.optionalRunes(); runes != nil {
		copy(dest, runes)
		return
	}
	for idx, b := range chars.slice[:len(dest)] {
		dest[idx] = rune(b)
	}
}

func (chars *Chars) Prepend(prefix string) {
	if runes := chars.optionalRunes(); runes != nil {
		runes = append([]rune(prefix), runes...)
		chars.slice = *(*[]byte)(unsafe.Pointer(&runes))
	} else {
		chars.slice = append([]byte(prefix), chars.slice...)
	}
}


var DEBUG bool

func indexAt(index int, max int, forward bool) int {
	if forward {
		return index
	}
	return max - index - 1
}

// Result contains the results of running a match function.
type Result struct {
	// TODO int32 should suffice
	Start int
	End   int
	Score int
}

const (
	scoreMatch        = 16
	scoreGapStart     = -3
	scoreGapExtention = -1

	// We prefer matches at the beginning of a word, but the bonus should not be
	// too great to prevent the longer acronym matches from always winning over
	// shorter fuzzy matches. The bonus point here was specifically chosen that
	// the bonus is cancelled when the gap between the acronyms grows over
	// 8 characters, which is approximately the average length of the words found
	// in web2 dictionary and my file system.
	bonusBoundary = scoreMatch / 2

	// Although bonus point for non-word characters is non-contextual, we need it
	// for computing bonus points for consecutive chunks starting with a non-word
	// character.
	bonusNonWord = scoreMatch / 2

	// Edge-triggered bonus for matches in camelCase words.
	// Compared to word-boundary case, they don't accompany single-character gaps
	// (e.g. FooBar vs. foo-bar), so we deduct bonus point accordingly.
	bonusCamel123 = bonusBoundary + scoreGapExtention

	// Minimum bonus point given to characters in consecutive chunks.
	// Note that bonus points for consecutive matches shouldn't have needed if we
	// used fixed match score as in the original algorithm.
	bonusConsecutive = -(scoreGapStart + scoreGapExtention)

	// The first character in the typed pattern usually has more significance
	// than the rest so it's important that it appears at special positions where
	// bonus points are given. e.g. "to-go" vs. "ongoing" on "og" or on "ogo".
	// The amount of the extra bonus should be limited so that the gap penalty is
	// still respected.
	bonusFirstCharMultiplier = 2
)

type charClass int

const (
	charNonWord charClass = iota
	charLower
	charUpper
	charLetter
	charNumber
)

func posArray(withPos bool, len int) *[]int {
	if withPos {
		pos := make([]int, 0, len)
		return &pos
	}
	return nil
}

func alloc16(offset int, slab *Slab, size int) (int, []int16) {
	if slab != nil && cap(slab.I16) > offset+size {
		slice := slab.I16[offset : offset+size]
		return offset + size, slice
	}
	return offset, make([]int16, size)
}

func alloc32(offset int, slab *Slab, size int) (int, []int32) {
	if slab != nil && cap(slab.I32) > offset+size {
		slice := slab.I32[offset : offset+size]
		return offset + size, slice
	}
	return offset, make([]int32, size)
}

func charClassOfAscii(char rune) charClass {
	if char >= 'a' && char <= 'z' {
		return charLower
	} else if char >= 'A' && char <= 'Z' {
		return charUpper
	} else if char >= '0' && char <= '9' {
		return charNumber
	}
	return charNonWord
}

func charClassOfNonAscii(char rune) charClass {
	if unicode.IsLower(char) {
		return charLower
	} else if unicode.IsUpper(char) {
		return charUpper
	} else if unicode.IsNumber(char) {
		return charNumber
	} else if unicode.IsLetter(char) {
		return charLetter
	}
	return charNonWord
}

func charClassOf(char rune) charClass {
	if char <= unicode.MaxASCII {
		return charClassOfAscii(char)
	}
	return charClassOfNonAscii(char)
}

func bonusFor(prevClass charClass, class charClass) int16 {
	if prevClass == charNonWord && class != charNonWord {
		// Word boundary
		return bonusBoundary
	} else if prevClass == charLower && class == charUpper ||
		prevClass != charNumber && class == charNumber {
		// camelCase letter123
		return bonusCamel123
	} else if class == charNonWord {
		return bonusNonWord
	}
	return 0
}

func bonusAt(input *Chars, idx int) int16 {
	if idx == 0 {
		return bonusBoundary
	}
	return bonusFor(charClassOf(input.Get(idx-1)), charClassOf(input.Get(idx)))
}

func normalizeRune(r rune) rune {
	if r < 0x00C0 || r > 0x2184 {
		return r
	}

	n := normalized[r]
	if n > 0 {
		return n
	}
	return r
}

// Algo functions make two assumptions
// 1. "pattern" is given in lowercase if "caseSensitive" is false
// 2. "pattern" is already normalized if "normalize" is true
type Algo func(caseSensitive bool, normalize bool, forward bool, input *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int)

func trySkip(input *Chars, caseSensitive bool, b byte, from int) int {
	byteArray := input.Bytes()[from:]
	idx := bytes.IndexByte(byteArray, b)
	if idx == 0 {
		// Can't skip any further
		return from
	}
	// We may need to search for the uppercase letter again. We don't have to
	// consider normalization as we can be sure that this is an ASCII string.
	if !caseSensitive && b >= 'a' && b <= 'z' {
		if idx > 0 {
			byteArray = byteArray[:idx]
		}
		uidx := bytes.IndexByte(byteArray, b-32)
		if uidx >= 0 {
			idx = uidx
		}
	}
	if idx < 0 {
		return -1
	}
	return from + idx
}

func isAscii(runes []rune) bool {
	for _, r := range runes {
		if r >= utf8.RuneSelf {
			return false
		}
	}
	return true
}

func asciiFuzzyIndex(input *Chars, pattern []rune, caseSensitive bool) int {
	// Can't determine
	if !input.IsBytes() {
		return 0
	}

	// Not possible
	if !isAscii(pattern) {
		return -1
	}

	firstIdx, idx := 0, 0
	for pidx := 0; pidx < len(pattern); pidx++ {
		idx = trySkip(input, caseSensitive, byte(pattern[pidx]), idx)
		if idx < 0 {
			return -1
		}
		if pidx == 0 && idx > 0 {
			// Step back to find the right bonus point
			firstIdx = idx - 1
		}
		idx++
	}
	return firstIdx
}

func debugV2(T []rune, pattern []rune, F []int32, lastIdx int, H []int16, C []int16) {
	width := lastIdx - int(F[0]) + 1

	for i, f := range F {
		I := i * width
		if i == 0 {
			fmt.Print("  ")
			for j := int(f); j <= lastIdx; j++ {
				fmt.Printf(" " + string(T[j]) + " ")
			}
			fmt.Println()
		}
		fmt.Print(string(pattern[i]) + " ")
		for idx := int(F[0]); idx < int(f); idx++ {
			fmt.Print(" 0 ")
		}
		for idx := int(f); idx <= lastIdx; idx++ {
			fmt.Printf("%2d ", H[i*width+idx-int(F[0])])
		}
		fmt.Println()

		fmt.Print("  ")
		for idx, p := range C[I : I+width] {
			if idx+int(F[0]) < int(F[i]) {
				p = 0
			}
			if p > 0 {
				fmt.Printf("%2d ", p)
			} else {
				fmt.Print("   ")
			}
		}
		fmt.Println()
	}
}

func FuzzyMatchV2(caseSensitive bool, normalize bool, forward bool, input *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	// Assume that pattern is given in lowercase if case-insensitive.
	// First check if there's a match and calculate bonus for each position.
	// If the input string is too long, consider finding the matching chars in
	// this phase as well (non-optimal alignment).
	M := len(pattern)
	if M == 0 {
		return Result{0, 0, 0}, posArray(withPos, M)
	}
	N := input.Length()

	// Since O(nm) algorithm can be prohibitively expensive for large input,
	// we fall back to the greedy algorithm.
	if slab != nil && N*M > cap(slab.I16) {
		return FuzzyMatchV1(caseSensitive, normalize, forward, input, pattern, withPos, slab)
	}

	// Phase 1. Optimized search for ASCII string
	idx := asciiFuzzyIndex(input, pattern, caseSensitive)
	if idx < 0 {
		return Result{-1, -1, 0}, nil
	}

	// Reuse pre-allocated integer slice to avoid unnecessary sweeping of garbages
	offset16 := 0
	offset32 := 0
	offset16, H0 := alloc16(offset16, slab, N)
	offset16, C0 := alloc16(offset16, slab, N)
	// Bonus point for each position
	offset16, B := alloc16(offset16, slab, N)
	// The first occurrence of each character in the pattern
	offset32, F := alloc32(offset32, slab, M)
	// Rune array
	_, T := alloc32(offset32, slab, N)
	input.CopyRunes(T)

	// Phase 2. Calculate bonus for each point
	maxScore, maxScorePos := int16(0), 0
	pidx, lastIdx := 0, 0
	pchar0, pchar, prevH0, prevClass, inGap := pattern[0], pattern[0], int16(0), charNonWord, false
	Tsub := T[idx:]
	H0sub, C0sub, Bsub := H0[idx:][:len(Tsub)], C0[idx:][:len(Tsub)], B[idx:][:len(Tsub)]
	for off, char := range Tsub {
		var class charClass
		if char <= unicode.MaxASCII {
			class = charClassOfAscii(char)
			if !caseSensitive && class == charUpper {
				char += 32
			}
		} else {
			class = charClassOfNonAscii(char)
			if !caseSensitive && class == charUpper {
				char = unicode.To(unicode.LowerCase, char)
			}
			if normalize {
				char = normalizeRune(char)
			}
		}

		Tsub[off] = char
		bonus := bonusFor(prevClass, class)
		Bsub[off] = bonus
		prevClass = class

		if char == pchar {
			if pidx < M {
				F[pidx] = int32(idx + off)
				pidx++
				pchar = pattern[Min(pidx, M-1)]
			}
			lastIdx = idx + off
		}

		if char == pchar0 {
			score := scoreMatch + bonus*bonusFirstCharMultiplier
			H0sub[off] = score
			C0sub[off] = 1
			if M == 1 && (forward && score > maxScore || !forward && score >= maxScore) {
				maxScore, maxScorePos = score, idx+off
				if forward && bonus == bonusBoundary {
					break
				}
			}
			inGap = false
		} else {
			if inGap {
				H0sub[off] = Max16(prevH0+scoreGapExtention, 0)
			} else {
				H0sub[off] = Max16(prevH0+scoreGapStart, 0)
			}
			C0sub[off] = 0
			inGap = true
		}
		prevH0 = H0sub[off]
	}
	if pidx != M {
		return Result{-1, -1, 0}, nil
	}
	if M == 1 {
		result := Result{maxScorePos, maxScorePos + 1, int(maxScore)}
		if !withPos {
			return result, nil
		}
		pos := []int{maxScorePos}
		return result, &pos
	}

	// Phase 3. Fill in score matrix (H)
	// Unlike the original algorithm, we do not allow omission.
	f0 := int(F[0])
	width := lastIdx - f0 + 1
	offset16, H := alloc16(offset16, slab, width*M)
	copy(H, H0[f0:lastIdx+1])

	// Possible length of consecutive chunk at each position.
	_, C := alloc16(offset16, slab, width*M)
	copy(C, C0[f0:lastIdx+1])

	Fsub := F[1:]
	Psub := pattern[1:][:len(Fsub)]
	for off, f := range Fsub {
		f := int(f)
		pchar := Psub[off]
		pidx := off + 1
		row := pidx * width
		inGap := false
		Tsub := T[f : lastIdx+1]
		Bsub := B[f:][:len(Tsub)]
		Csub := C[row+f-f0:][:len(Tsub)]
		Cdiag := C[row+f-f0-1-width:][:len(Tsub)]
		Hsub := H[row+f-f0:][:len(Tsub)]
		Hdiag := H[row+f-f0-1-width:][:len(Tsub)]
		Hleft := H[row+f-f0-1:][:len(Tsub)]
		Hleft[0] = 0
		for off, char := range Tsub {
			col := off + f
			var s1, s2, consecutive int16

			if inGap {
				s2 = Hleft[off] + scoreGapExtention
			} else {
				s2 = Hleft[off] + scoreGapStart
			}

			if pchar == char {
				s1 = Hdiag[off] + scoreMatch
				b := Bsub[off]
				consecutive = Cdiag[off] + 1
				// Break consecutive chunk
				if b == bonusBoundary {
					consecutive = 1
				} else if consecutive > 1 {
					b = Max16(b, Max16(bonusConsecutive, B[col-int(consecutive)+1]))
				}
				if s1+b < s2 {
					s1 += Bsub[off]
					consecutive = 0
				} else {
					s1 += b
				}
			}
			Csub[off] = consecutive

			inGap = s1 < s2
			score := Max16(Max16(s1, s2), 0)
			if pidx == M-1 && (forward && score > maxScore || !forward && score >= maxScore) {
				maxScore, maxScorePos = score, col
			}
			Hsub[off] = score
		}
	}

	if DEBUG {
		debugV2(T, pattern, F, lastIdx, H, C)
	}

	// Phase 4. (Optional) Backtrace to find character positions
	pos := posArray(withPos, M)
	j := f0
	if withPos {
		i := M - 1
		j = maxScorePos
		preferMatch := true
		for {
			I := i * width
			j0 := j - f0
			s := H[I+j0]

			var s1, s2 int16
			if i > 0 && j >= int(F[i]) {
				s1 = H[I-width+j0-1]
			}
			if j > int(F[i]) {
				s2 = H[I+j0-1]
			}

			if s > s1 && (s > s2 || s == s2 && preferMatch) {
				*pos = append(*pos, j)
				if i == 0 {
					break
				}
				i--
			}
			preferMatch = C[I+j0] > 1 || I+width+j0+1 < len(C) && C[I+width+j0+1] > 0
			j--
		}
	}
	// Start offset we return here is only relevant when begin tiebreak is used.
	// However finding the accurate offset requires backtracking, and we don't
	// want to pay extra cost for the option that has lost its importance.
	return Result{j, maxScorePos + 1, int(maxScore)}, pos
}

// Implement the same sorting criteria as V2
func calculateScore(caseSensitive bool, normalize bool, text *Chars, pattern []rune, sidx int, eidx int, withPos bool) (int, *[]int) {
	pidx, score, inGap, consecutive, firstBonus := 0, 0, false, 0, int16(0)
	pos := posArray(withPos, len(pattern))
	prevClass := charNonWord
	if sidx > 0 {
		prevClass = charClassOf(text.Get(sidx - 1))
	}
	for idx := sidx; idx < eidx; idx++ {
		char := text.Get(idx)
		class := charClassOf(char)
		if !caseSensitive {
			if char >= 'A' && char <= 'Z' {
				char += 32
			} else if char > unicode.MaxASCII {
				char = unicode.To(unicode.LowerCase, char)
			}
		}
		// pattern is already normalized
		if normalize {
			char = normalizeRune(char)
		}
		if char == pattern[pidx] {
			if withPos {
				*pos = append(*pos, idx)
			}
			score += scoreMatch
			bonus := bonusFor(prevClass, class)
			if consecutive == 0 {
				firstBonus = bonus
			} else {
				// Break consecutive chunk
				if bonus == bonusBoundary {
					firstBonus = bonus
				}
				bonus = Max16(Max16(bonus, firstBonus), bonusConsecutive)
			}
			if pidx == 0 {
				score += int(bonus * bonusFirstCharMultiplier)
			} else {
				score += int(bonus)
			}
			inGap = false
			consecutive++
			pidx++
		} else {
			if inGap {
				score += scoreGapExtention
			} else {
				score += scoreGapStart
			}
			inGap = true
			consecutive = 0
			firstBonus = 0
		}
		prevClass = class
	}
	return score, pos
}

// FuzzyMatchV1 performs fuzzy-match
func FuzzyMatchV1(caseSensitive bool, normalize bool, forward bool, text *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	if len(pattern) == 0 {
		return Result{0, 0, 0}, nil
	}
	if asciiFuzzyIndex(text, pattern, caseSensitive) < 0 {
		return Result{-1, -1, 0}, nil
	}

	pidx := 0
	sidx := -1
	eidx := -1

	lenRunes := text.Length()
	lenPattern := len(pattern)

	for index := 0; index < lenRunes; index++ {
		char := text.Get(indexAt(index, lenRunes, forward))
		// This is considerably faster than blindly applying strings.ToLower to the
		// whole string
		if !caseSensitive {
			// Partially inlining `unicode.ToLower`. Ugly, but makes a noticeable
			// difference in CPU cost. (Measured on Go 1.4.1. Also note that the Go
			// compiler as of now does not inline non-leaf functions.)
			if char >= 'A' && char <= 'Z' {
				char += 32
			} else if char > unicode.MaxASCII {
				char = unicode.To(unicode.LowerCase, char)
			}
		}
		if normalize {
			char = normalizeRune(char)
		}
		pchar := pattern[indexAt(pidx, lenPattern, forward)]
		if char == pchar {
			if sidx < 0 {
				sidx = index
			}
			if pidx++; pidx == lenPattern {
				eidx = index + 1
				break
			}
		}
	}

	if sidx >= 0 && eidx >= 0 {
		pidx--
		for index := eidx - 1; index >= sidx; index-- {
			tidx := indexAt(index, lenRunes, forward)
			char := text.Get(tidx)
			if !caseSensitive {
				if char >= 'A' && char <= 'Z' {
					char += 32
				} else if char > unicode.MaxASCII {
					char = unicode.To(unicode.LowerCase, char)
				}
			}

			pidx_ := indexAt(pidx, lenPattern, forward)
			pchar := pattern[pidx_]
			if char == pchar {
				if pidx--; pidx < 0 {
					sidx = index
					break
				}
			}
		}

		if !forward {
			sidx, eidx = lenRunes-eidx, lenRunes-sidx
		}

		score, pos := calculateScore(caseSensitive, normalize, text, pattern, sidx, eidx, withPos)
		return Result{sidx, eidx, score}, pos
	}
	return Result{-1, -1, 0}, nil
}

// ExactMatchNaive is a basic string searching algorithm that handles case
// sensitivity. Although naive, it still performs better than the combination
// of strings.ToLower + strings.Index for typical fzf use cases where input
// strings and patterns are not very long.
//
// Since 0.15.0, this function searches for the match with the highest
// bonus point, instead of stopping immediately after finding the first match.
// The solution is much cheaper since there is only one possible alignment of
// the pattern.
func ExactMatchNaive(caseSensitive bool, normalize bool, forward bool, text *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	if len(pattern) == 0 {
		return Result{0, 0, 0}, nil
	}

	lenRunes := text.Length()
	lenPattern := len(pattern)

	if lenRunes < lenPattern {
		return Result{-1, -1, 0}, nil
	}

	if asciiFuzzyIndex(text, pattern, caseSensitive) < 0 {
		return Result{-1, -1, 0}, nil
	}

	// For simplicity, only look at the bonus at the first character position
	pidx := 0
	bestPos, bonus, bestBonus := -1, int16(0), int16(-1)
	for index := 0; index < lenRunes; index++ {
		index_ := indexAt(index, lenRunes, forward)
		char := text.Get(index_)
		if !caseSensitive {
			if char >= 'A' && char <= 'Z' {
				char += 32
			} else if char > unicode.MaxASCII {
				char = unicode.To(unicode.LowerCase, char)
			}
		}
		if normalize {
			char = normalizeRune(char)
		}
		pidx_ := indexAt(pidx, lenPattern, forward)
		pchar := pattern[pidx_]
		if pchar == char {
			if pidx_ == 0 {
				bonus = bonusAt(text, index_)
			}
			pidx++
			if pidx == lenPattern {
				if bonus > bestBonus {
					bestPos, bestBonus = index, bonus
				}
				if bonus == bonusBoundary {
					break
				}
				index -= pidx - 1
				pidx, bonus = 0, 0
			}
		} else {
			index -= pidx
			pidx, bonus = 0, 0
		}
	}
	if bestPos >= 0 {
		var sidx, eidx int
		if forward {
			sidx = bestPos - lenPattern + 1
			eidx = bestPos + 1
		} else {
			sidx = lenRunes - (bestPos + 1)
			eidx = lenRunes - (bestPos - lenPattern + 1)
		}
		score, _ := calculateScore(caseSensitive, normalize, text, pattern, sidx, eidx, false)
		return Result{sidx, eidx, score}, nil
	}
	return Result{-1, -1, 0}, nil
}

// PrefixMatch performs prefix-match
func PrefixMatch(caseSensitive bool, normalize bool, forward bool, text *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	if len(pattern) == 0 {
		return Result{0, 0, 0}, nil
	}

	trimmedLen := 0
	if !unicode.IsSpace(pattern[0]) {
		trimmedLen = text.LeadingWhitespaces()
	}

	if text.Length()-trimmedLen < len(pattern) {
		return Result{-1, -1, 0}, nil
	}

	for index, r := range pattern {
		char := text.Get(trimmedLen + index)
		if !caseSensitive {
			char = unicode.ToLower(char)
		}
		if normalize {
			char = normalizeRune(char)
		}
		if char != r {
			return Result{-1, -1, 0}, nil
		}
	}
	lenPattern := len(pattern)
	score, _ := calculateScore(caseSensitive, normalize, text, pattern, trimmedLen, trimmedLen+lenPattern, false)
	return Result{trimmedLen, trimmedLen + lenPattern, score}, nil
}

// SuffixMatch performs suffix-match
func SuffixMatch(caseSensitive bool, normalize bool, forward bool, text *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	lenRunes := text.Length()
	trimmedLen := lenRunes
	if len(pattern) == 0 || !unicode.IsSpace(pattern[len(pattern)-1]) {
		trimmedLen -= text.TrailingWhitespaces()
	}
	if len(pattern) == 0 {
		return Result{trimmedLen, trimmedLen, 0}, nil
	}
	diff := trimmedLen - len(pattern)
	if diff < 0 {
		return Result{-1, -1, 0}, nil
	}

	for index, r := range pattern {
		char := text.Get(index + diff)
		if !caseSensitive {
			char = unicode.ToLower(char)
		}
		if normalize {
			char = normalizeRune(char)
		}
		if char != r {
			return Result{-1, -1, 0}, nil
		}
	}
	lenPattern := len(pattern)
	sidx := trimmedLen - lenPattern
	eidx := trimmedLen
	score, _ := calculateScore(caseSensitive, normalize, text, pattern, sidx, eidx, false)
	return Result{sidx, eidx, score}, nil
}

// EqualMatch performs equal-match
func EqualMatch(caseSensitive bool, normalize bool, forward bool, text *Chars, pattern []rune, withPos bool, slab *Slab) (Result, *[]int) {
	lenPattern := len(pattern)
	if lenPattern == 0 {
		return Result{-1, -1, 0}, nil
	}

	// Strip leading whitespaces
	trimmedLen := 0
	if !unicode.IsSpace(pattern[0]) {
		trimmedLen = text.LeadingWhitespaces()
	}

	// Strip trailing whitespaces
	trimmedEndLen := 0
	if !unicode.IsSpace(pattern[lenPattern-1]) {
		trimmedEndLen = text.TrailingWhitespaces()
	}

	if text.Length()-trimmedLen-trimmedEndLen != lenPattern {
		return Result{-1, -1, 0}, nil
	}
	match := true
	if normalize {
		runes := text.ToRunes()
		for idx, pchar := range pattern {
			char := runes[trimmedLen+idx]
			if !caseSensitive {
				char = unicode.To(unicode.LowerCase, char)
			}
			if normalizeRune(pchar) != normalizeRune(char) {
				match = false
				break
			}
		}
	} else {
		runes := text.ToRunes()
		runesStr := string(runes[trimmedLen : len(runes)-trimmedEndLen])
		if !caseSensitive {
			runesStr = strings.ToLower(runesStr)
		}
		match = runesStr == string(pattern)
	}
	if match {
		return Result{trimmedLen, trimmedLen + lenPattern, (scoreMatch+bonusBoundary)*lenPattern +
			(bonusFirstCharMultiplier-1)*bonusBoundary}, nil
	}
	return Result{-1, -1, 0}, nil
}

func assertMatch(fun Algo, caseSensitive, forward bool, input, pattern string, sidx int, eidx int, score int) {
	assertMatch2(fun, caseSensitive, false, forward, input, pattern, sidx, eidx, score)
}

func assertMatch2(fun Algo, caseSensitive, normalize, forward bool, input, pattern string, sidx int, eidx int, score int) {
	if !caseSensitive {
		pattern = strings.ToLower(pattern)
	}
	chars := ToChars([]byte(input))
	res, pos := fun(caseSensitive, normalize, forward, &chars, []rune(pattern), true, nil)
	var start, end int
	if pos == nil || len(*pos) == 0 {
		start = res.Start
		end = res.End
	} else {
		sort.Ints(*pos)
		start = (*pos)[0]
		end = (*pos)[len(*pos)-1] + 1
	}
	if start != sidx {
		fmt.Println("Invalid start index: %d (expected: %d, %s / %s)", start, sidx, input, pattern)
	}
	if end != eidx {
		fmt.Println("Invalid end index: %d (expected: %d, %s / %s)", end, eidx, input, pattern)
	}
	if res.Score != score {
		fmt.Println("Invalid score: %d (expected: %d, %s / %s)", res.Score, score, input, pattern)
	}
}
func TestFuzzyMatch() {
	for _, fn := range []Algo{FuzzyMatchV1, FuzzyMatchV2} {
		for _, forward := range []bool{true, false} {
			assertMatch(fn, false, forward, "fooBarbaz1", "oBZ", 2, 9,
				scoreMatch*3+bonusCamel123+scoreGapStart+scoreGapExtention*3)
			assertMatch(fn, false, forward, "foo bar baz", "fbb", 0, 9,
				scoreMatch*3+bonusBoundary*bonusFirstCharMultiplier+
					bonusBoundary*2+2*scoreGapStart+4*scoreGapExtention)
		}
	}
}

func main() {
	TestFuzzyMatch()
	fmt.Println("Hello, playground")
	println("Hello, JS console")
}
