# Austen Studio 由来のキャラクタービルボード

3D庭園・室内でNPCを表示する `NpcBillboard`（`src/three/NpcBillboard.tsx`）が
参照する、常にカメラを向く一枚絵。オーナー所有の別プロジェクト
「Austen Studio」（高慢と偏見の長編アニメーション制作ツール、
austen-studio.taira-sakakibara.workers.dev）のキャラクター設定画から
切り出したもので、このゲーム独自の描き起こしではない。

## 出典・加工手順（2026-09-18）

各キャラクターの設定画（8方向ターンアラウンド＋表情集＋メインポーズ等を
収めた1枚のシート、`/api/media/library-20260913-<id>/file`）から、左側の
「メインポーズ（斜め前・全身）」パネルを切り出し、`rembg`（u2netモデル）
で背景（庭園の書き割り）を透過処理し、アルファ境界でトリミングした。

元シートは8方向・表情差分も持つが、現時点ではメインポーズ1枚のみを使用。
方向切り替え式のビルボードは将来の拡張候補。

## id 一覧

| id | 人物 | Austen Studio上の名称 |
|----|------|------|
| `darcy` | フィッツウィリアム・ダーシー | Fitzwilliam Darcy |
| `elizabeth` | エリザベス・ベネット | Elizabeth Bennet |
| `jane` | ジェイン・ベネット | Jane Bennet |
| `bingley` | チャールズ・ビングリー | Charles Bingley |
| `catherine` | レディ・キャサリン | Lady Catherine de Bourgh |
| `georgiana` | ジョージアナ・ダーシー | Georgiana Darcy |

Austen Studio側には12/18人分の設定画が登録済み（2026-09-18時点）。未登録の
人物（Caroline, Louisa等）は今後追加され次第、同じ手順で取り込む想定。
