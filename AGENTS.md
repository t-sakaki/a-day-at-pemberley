# A Day at Pemberley — AGENTS.md

Jane Austen 風の邸宅（Pemberley）を舞台にした、水彩ビジュアルのインタラクティブ体験アプリ。Canvas 2D で描画し、音声ガイド・スタッフ操作・日中の時間変化を含む。

## ブランチ戦略（厳守）
- 作業は必ず `feat/<topic>` ブランチで行う。main への直接 commit/push は禁止。
- 完了したら `feat/<topic>` から `main` へ PR を作る。マージは人間（オーナー）が承認する。
- 並行開発: 別エージェント（Hermes）も同じリポジトリで feat/* を使っている。main を勝手に触らない。競合しそうなファイル（src/App.tsx, src/visuals/*）を触る前に PR の diff を確認すること。

## コミットメッセージ規約（Conventional Commits）
- feat: 新機能 / fix: バグ修正 / chore: 設定・雑務 / build: ビルド・依存関係 / refactor: 内部構造改善
- 例: `fix: 水彩エッジの点滅を決定的疑似乱数で解消`
- 日本語可。1コミット = 1関心事。

## スタック・制約
- pnpm workspaces, Node.js 24, TypeScript 5.9
- 描画: Canvas 2D のみ。**Three.js / WebGL / ShaderMaterial は使用禁止**（README.md 参照）。水彩表現は src/visuals/ の Canvas 2D 実装を使う。
- ローカル実行: `PORT=5173 BASE_PATH=/ npx vite`（vite.config はこの env を必須とする）

## 検証ゲート（PR 作成前に必須）
- `npx tsc --noEmit` で型エラー0
- ブラウザで実際に描画を確認（点滅・崩れがないか）
- 検証用の一時スクリプトは残さず削除すること

## Where things live
- src/App.tsx — メイン描画ループ（EstateCanvas）。WatercolorPass.apply を描画後段に接続済み。
- src/visuals/WatercolorPass.ts — ウォッシュ・階調量子化・紙ざわり・霞み・ヴィネットの合成
- src/visuals/WatercolorMaterial.ts — エッジにじみ・bleed（描画ループ内で Math.random() を使わないこと）
- src/visuals/ColorPalette.ts, EdgeSoftener.ts, AtmosphericFog.ts, PaperTextureGenerator.ts

## Gotchas
- WatercolorMaterial のエッジ描画は「頂点インデックス依存の決定的疑似乱数 pseudoRandom()」を使う。新しくエッジ/bleed を書く際、Math.random() を使うと毎フレーム点滅する。
- 紙テクスチャは1回だけ生成して再利用（per-frame 生成禁止）。
- 環境変数 PORT/BASE_PATH なしでは vite が起動しない。

## User preferences
- オーナーは Conventional Commits と feat/* ブランチ規約を重視。
- 本番反映は PR 承認後にのみ行う。
