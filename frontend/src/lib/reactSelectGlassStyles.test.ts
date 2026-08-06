/**
 * Unit tests: react-select glass styles ตาม theme
 * ครอบคลุมเคส Dialog มอบหมายงาน — menu ต้องไม่ hardcode dark ใน light mode
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getReactSelectGlassStyles,
  reactSelectGlassStyles,
} from "./reactSelectGlassStyles";

type StyleFn = (
  base: Record<string, unknown>,
  state?: Record<string, unknown>,
) => Record<string, unknown>;

function callStyle(
  styles: ReturnType<typeof getReactSelectGlassStyles>,
  key: "menu" | "option" | "control" | "singleValue",
  state: Record<string, unknown> = {},
) {
  const fn = styles[key] as StyleFn | undefined;
  assert.ok(fn, `styles.${key} must be defined`);
  return fn({}, state);
}

describe("getReactSelectGlassStyles", () => {
  it("light: menu เป็นพื้นขาว (ไม่ใช่ navy มืด)", () => {
    const styles = getReactSelectGlassStyles("light");
    const menu = callStyle(styles, "menu");
    assert.equal(menu.backgroundColor, "#ffffff");
    assert.equal(menu.border, "1px solid #e2e8f0");
  });

  it("light: option ตัวอักษมืด และ hover โทนฟ้าอ่อน", () => {
    const styles = getReactSelectGlassStyles("light");
    const idle = callStyle(styles, "option", {
      isSelected: false,
      isFocused: false,
      isDisabled: false,
    });
    const focused = callStyle(styles, "option", {
      isSelected: false,
      isFocused: true,
      isDisabled: false,
    });
    assert.equal(idle.color, "#1e293b");
    assert.equal(idle.backgroundColor, "#ffffff");
    assert.equal(focused.backgroundColor, "#eff6ff");
  });

  it("light: control พื้นขาว ขอบ slate", () => {
    const styles = getReactSelectGlassStyles("light");
    const control = callStyle(styles, "control", {
      isFocused: false,
      isDisabled: false,
    });
    assert.equal(control.backgroundColor, "#ffffff");
    assert.equal(control.borderColor, "#cbd5e1");
  });

  it("dark: menu ยังเป็นโทนมืด (regression)", () => {
    const styles = getReactSelectGlassStyles("dark");
    const menu = callStyle(styles, "menu");
    assert.equal(menu.backgroundColor, "rgba(15, 23, 42, 0.94)");
  });

  it("reactSelectGlassStyles shorthand ยังเป็น dark (legacy export)", () => {
    const menu = callStyle(reactSelectGlassStyles, "menu");
    assert.equal(menu.backgroundColor, "rgba(15, 23, 42, 0.94)");
  });

  it("default parameter เป็น dark", () => {
    const styles = getReactSelectGlassStyles();
    const menu = callStyle(styles, "menu");
    assert.equal(menu.backgroundColor, "rgba(15, 23, 42, 0.94)");
  });
});
