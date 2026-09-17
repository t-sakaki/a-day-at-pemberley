# A Day at Pemberley — AGENTS.md

Jane Austen 風の邸宅（Pemberley）を舞台にした、水彩ビジュアルのインタラクティブ体験アプリ。音声ガイド・スタッフ操作・日中の時間変化を含む。

**2026-09-17: オーナーの意向で描画方式を転換中。** 見下ろし視点の平面的な2Dゲームから、主人公が館・庭園を実際に三人称視点で歩き回れる本物の3D空間へ作り替える（詳細は下の「3D化（進行中）」節）。それまでの「Canvas 2D のみ・Three.js/WebGL禁止」というルールはこの転換のために撤回された。並行開発中の別エージェント（Hermes）もこの方針転換を前提に作業すること。

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
- 描画: **Three.js / WebGL を使用する**（react-three-fiber + drei）。旧ルール「Canvas 2D のみ・Three.js禁止」は撤回済み。
- ローカル実行: `PORT=5173 BASE_PATH=/ npx vite`（vite.config はこの env を必須とする）

## 3D化（進行中）
- ゴール: 主人公キャラクターが館内・庭園を三人称視点（背後追従カメラ）でシームレスに歩き回れる、没入型の3D空間にする。見下ろし視点の平面的な表現には戻さない。
- 段階的に `feat/*` ブランチ＋PRで進める（下記フェーズは目安、1PR=1関心事の原則は維持）。
  1. 基盤: three / @react-three/fiber / @react-three/drei を依存に追加。blender/*.py に glTF/GLB 書き出しを追加（現状は Cycles で PNG/JPG を焼くだけで、リアルタイム描画可能な3Dアセットは一つも無い）。
  2. 縦切り: 庭園（pemberley.blend）を glTF化し、WASD/タッチジョイスティックで動く仮キャラクター（プレースホルダ）と三人称追従カメラで歩き回れる最小プレイアブルを作る。
  3. キャラクター: プレイヤー・NPC用にリグ付き（アーマチュア＋アイドル/歩行アニメ）の3Dキャラクターを作り、既存の「フレーム1/7/13の静止スプライト」方式を置き換える。
  4. 屋内外の統合: 現状は屋内外が別々の2D座標空間で「ドアで別画面へ瞬間切り替え」する作りなので、これを本物の3D空間内でドアを実際にくぐれる形に作り替える（ポータル/ストリーミングでも可）。
  5. 水彩表現の再現: `src/visuals/` の Canvas 2D 専用水彩後処理パイプライン（WatercolorPass 等）は意図的に Three.js 非依存で作られているため、WebGLのポストプロセス（EffectComposer等）として作り直す。
  6. UI/テスト移行: 執事の机・名簿などのDOMパネルはcanvas座標に疎結合なのでほぼそのまま流用可。ミニマップ・室内ドアラベルなど画面座標に投影しているものは新カメラの `project()` に繋ぎ直す。Playwrightテストのうち `data-x/y/elevation/asset` 等canvas依存の部分は新レンダラー用に作り直す。
- 既存の状態管理層（`src/systems/*.ts`: TourSystem/EventSystem/GuestManager/StaffWorkplaces、`src/data/*.ts`）はレンダラーに依存しないため、3D化でもほぼそのまま再利用する。
- Blenderの `.blend`/Pythonスクリプト資産（邸宅・室内・キャラクター・動物）はプリミティブ形状で書かれているため、glTFへの書き出しスクリプトを追加すれば作り直しせずに流用できる見込み。ただし現状のキャラクター用アニメーション（frame 1/7/13の静止ポーズ）はスプライト用であり、そのままではリアルタイム3Dアニメーションとして不十分。

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
