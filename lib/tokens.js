export const C = {
  ink: "#241914",
  inkSoft: "#6b5d52",
  paper: "#F6F1E7",
  card: "#FFFDF8",
  curtain: "#7A1F2B",
  gold: "#B8863B",
  sage: "#4F7562",
  rust: "#A8583F",
  sageSoft: "#7C9A6B",
  line: "#E4DCC9"
};

// 周期の帯（周期記録の設計.md §5-1）。
// ★濃い赤・ピンクを使わないこと（§4-2 と同じ理由。人に見られて困る）。
// 声の調子の点（LEVEL_COLORS）と衝突しない中間色。5色のどれにも近くない
// 無彩色寄りの灰茶を選んでいる。明るいカードの上でも、濃い色の上でも見える。
export const CYCLE_BAND = "#9A8F84";

export const LEVEL_COLORS = [C.curtain, C.rust, C.gold, C.sageSoft, C.sage];
export const LEVEL_DYNAMICS = ["pp", "p", "mf", "f", "ff"];
export const LEVEL_DYNAMIC_DESC = ["かすれ・不調", "やや不調", "普通", "好調", "絶好調"];
