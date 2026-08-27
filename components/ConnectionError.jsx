// つながらないときに出す画面。
// ★ログインしていない人をここに出さないこと。ここは「あなたの記録は無事です」と
//   言い切る画面なので、別の理由で出すと嘘になる。
export default function ConnectionError({ detail }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#FFFDF8", color: "#3A3226" }}>
      <div style={{ maxWidth: "420px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>いま、つながりません</p>
        <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#7A6E5C" }}>
          サーバーからの返事が来ませんでした。<br />
          少し待ってから、もう一度お試しください。
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.8, color: "#7A6E5C", marginTop: "16px" }}>
          記録したものは、そのまま残っています。
        </p>
        <a
          href="/dashboard"
          style={{ display: "inline-block", marginTop: "24px", padding: "10px 24px", borderRadius: "999px", background: "#6B4E3D", color: "#FFFDF8", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}
        >
          もう一度読み込む
        </a>
        {detail ? (
          <p style={{ fontSize: "11px", color: "#B3A894", marginTop: "20px" }}>{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
