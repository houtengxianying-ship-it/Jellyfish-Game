# モバイル版のバッテリー消費を抑える最適化

## Context
ユーザーがスマホで10分間プレイしたところ充電が5%減少した。バッテリー消費を抑える仕組みを実装したい。

## 現状の問題点

### 1. バックグラウンド時の処理継続（最大の問題）
- タブ切り替えや他のアプリに切り替えても、ゲームが裏で動き続ける
- Page Visibility API が実装されていない

### 2. 常時60fpsレンダリング
- `requestAnimationFrame` で常に最大フレームレートで描画
- タイトル画面やゲームオーバー画面でも同じ頻度で描画

### 3. 物理エンジンの常時更新
- Matter.js が毎フレーム更新されている

### 4. 毎フレーム全体再描画
- Canvas全体をクリアして再描画している

## Implementation Plan

### Step 1: Page Visibility API でバックグラウンド時の処理を停止

これが最も効果的。タブが非表示の時は物理更新と描画を完全に停止する。

**game.js - 新しいイベントリスナーを追加**
```javascript
// state オブジェクトに追加
isBackground: false,

// init() 関数内に追加
document.addEventListener('visibilitychange', function() {
    state.isBackground = document.hidden;
});

// gameLoop() の先頭で早期リターン
function gameLoop() {
    if (state.isBackground) {
        requestAnimationFrame(gameLoop);
        return;
    }
    // ... 既存の処理
}
```

### Step 2: タイトル/ゲームオーバー画面では物理更新をスキップ

プレイ中以外は物理エンジンの更新を不要にする。

**game.js - gameLoop() 内の条件分岐**
```javascript
if (state.phase === 'playing' && !state.gameOver && !state.isBackground) {
    Physics.update();
    checkGameOver();
}
```
※ 現在のコードでは既に `state.phase === 'playing' && !state.gameOver` で条件付けされているので、Step 1 の `isBackground` チェックを追加するだけで良い

### Step 3: フレームレート制限（オプション）

必要に応じて30fpsに制限することも可能だが、ゲーム体験への影響を考慮。

**今回は実装しない** - Step 1 & 2 で十分な効果が期待できるため

## 期待される効果

- **バックグラウンド時**: CPU使用率をほぼ0%に削減
- **タイトル/ゲームオーバー画面**: 物理計算を停止して軽量化
- **推定効果**: バッテリー消費を30-50%削減可能

## Critical Files
- `/Users/5vhgoh/クラゲゲーム/js/game.js` - state, init(), gameLoop()

## Verification
1. ゲームを開始し、別のタブに切り替える
2. デベロッパーツールのPerformanceタブでCPU使用率が下がることを確認
3. タブに戻ると正常にゲームが再開することを確認
4. タイトル画面で待機中のCPU使用率が低いことを確認
5. 実際にモバイルで10分プレイしてバッテリー消費が改善されたか確認
