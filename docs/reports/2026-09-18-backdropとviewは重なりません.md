# ★backdrop 10点 は、★view と 重なりません（★別の 役 です）

全101行 / 末尾は「★★6 は、★**いま 箱の 仕組みが 無い** ので、★作る ところから に なります。」

## 一 ★答え

```
view      … ★**窓の 中**の 景色。★384×384。★窓枠（window）の 後ろに 1枚
backdrop  … ★**部屋の いちばん 後ろ**。★壁の 幅いっぱい。★窓とは 関わりません
```

★★★重なって いません。★**結び直せません。**★描き足しが 要ります。

## 二 ★根拠（★コード）

`components/CharacterHome.jsx:2905`

```
SPECIAL_BACKDROP_KEYS = ["backdrop_western_castle", "backdrop_japanese_castle",
  "backdrop_bamboo_grove", "backdrop_forest", "backdrop_sheep_pasture",
  "backdrop_big_man"]
```

`SpecialBackdropScene`（2907行）── ★`<svg viewBox="0 0 400 130">` を
★**壁の 幅いっぱい**に 敷きます（`left:0 / right:0 / height: WALL_HEIGHT_PCT`）。

★★`view` は `InteriorLayer` の 中で、★**窓枠の 内側**にだけ 描かれます。
　★★大きさも 384×384。★窓の 中に 収まる もの です。

## 三 ★★ただし、★backdrop 10点は **1色では ありません**

★★数えると、★役が **3つに 分かれて います**。

| 鍵 | 何を する か | 絵が 要るか |
|---|---|---|
| `backdrop_western_castle` | 部屋の 後ろに 城（洋）| ★**要る** |
| `backdrop_japanese_castle` | 部屋の 後ろに 城（和）| ★**要る** |
| `backdrop_bamboo_grove` | 竹やぶ | ★**要る** |
| `backdrop_forest` | 森 | ★**要る** |
| `backdrop_sheep_pasture` | 牧場 | ★**要る** |
| `backdrop_big_man` | 大きな 人 | ★**要る** |
| `backdrop_mountains_near` | ★遠くの 山を **近く** する | ★★要りません |
| `backdrop_mountains_huge` | ★遠くの 山を **大きく** する | ★★要りません |
| `backdrop_room_expand` | ★部屋の 比を 7:5 に **広げる** | ★★要りません |
| `backdrop_garden_expand` | ★庭を **広げる** | ★★要りません |

★★★下の 4点は **絵では ありません**。★部屋の **作りを 変える 合図** です。
　★`CharacterHome.jsx:2203` … `isRoomExpanded = equipped.backdrop === "backdrop_room_expand"`
　★`CharacterHome.jsx:3064-3065` … `isGardenExpanded` ／ `mountainTier`

★★★だから、★Opus に 描いて いただくのは ★**6点**です。★10点では ありません。

★★あわせて 1つ ── ★`backdrop_room_expand` と `backdrop_garden_expand` は、
　★9月8日の 裁定で「★箱2の いちばん 奥」と 決まって います
　（★1,800pt・★12か月 続けた 方だけ）。★売りません。

## 四 ★★Q ── ★138点の タイルは、★いま 箱の どこに ありますか

★★**どこにも ありません。**

```
箱1 / 箱2 / 箱3 に 当たる ものは、★コードに 1つも ありません
  lib/character.js を「箱」「BOX」「UNLOCK_BOX」で 見ました … ★0件
```

★★いま ある 仕組みは 2つ だけ です ──

```
① computeUnlocked … ★できごとで 開く（★本番1回・本番10回・弱音・
　　　　　　　　　　　★項目10種類・目標と 振り返り）── ★5つ
② SHOP_ITEMS の cost … ★点で 買う（★101点 ぜんぶに 値が 付いて います）
```

★★★138点の タイルは、★`SHOP_ITEMS` に **入って いません**。
　★★`docs/assets/sheep-interior-index.json` の 側 に あります。
　★★**買う 道も、開く 道も、いまは ありません。**★描かれる だけ です。

★★つまり ──

```
★244点（★箱3・12,800円の 根拠）に、★138点は 入って いません
★★138点を 箱3 に 入れると、★244 が 動きます（★Opus の ご懸念の とおり）
★★けれど、★入れない 道も あります ── ★箱2（★30日ごとに 増える）
```

★★★**いま 何も 決まって いない** ので、★どちらにも できます。
　★★9月8日の 裁定の 79点の 箱わけ（1／22／56）も、★コードに ありません。
　★★**紙の うえ だけ の 決め** です。

## 五 ★作業の 順（★Opus の お指図の とおり）

```
1 backdrop が 本当に 新規か …… ★★この 紙。★6点が 新規。★4点は 合図
2 79行の 対応表を 作る ……… ★次に やります
3 Opus が 見る
4 src の 差し替え（鍵は 触らない）
5 backdrop 6点を 描く
6 138点の 箱の 振り分け（★244 が 動かない こと）
```

★★6 は、★**いま 箱の 仕組みが 無い** ので、★作る ところから に なります。
