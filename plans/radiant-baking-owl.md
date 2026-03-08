# モバイル版でゲーム開始直後にゲームオーバーになる問題の修正

## Context
モバイル版でゲームを開始直後に、勝手にゲームオーバーになってしまう問題が発生している。ユーザーは「ゲーム開始直後」に発生すると報告。

## Root Cause

### 1. タイミング問題（主要原因）
`Date.now()` を使用しているが、モバイルでは以下の状況でクロックドリフトやスロットリングが発生する：
- バックグラウンドから復帰時
- JavaScriptエンジンがスロットリングされていた時
- 省電力モード時

これにより、クラゲ生成時の `createdAt` と `checkGameOver()` での `now` の差分が不正確になり、1.5秒の保護期間が機能しない可能性がある。

### 2. 落下位置が危険ラインより上
- `DROP_Y = 80px`（クラゲの落下位置）
- `DANGER_Y = 120px`（危険ライン）

落下直後のクラゲは常に危険ラインより上にあるため、保護期間が機能しないと即座に危険判定される。

### 3. 半径計算の不一致
- 物理エンジン: `radius * 0.7` を使用
- 危険判定: 元の `radius` を使用

この不一致により、危険判定が実際の物理ボディより厳しくなっている。

## Implementation Plan

### Step 1: `Date.now()` を `performance.now()` に変更

`performance.now()` は単調増加するクロックを使用するため、システムクロックの影響を受けない。

**physics.js (54行)**
```javascript
// Before
body.createdAt = Date.now();

// After
body.createdAt = performance.now();
```

**game.js (193行)**
```javascript
// Before
var now = Date.now();

// After
var now = performance.now();
```

**game.js (265-267行) - getDangerLevel関数**
```javascript
// Before
return Math.min(1.0, (Date.now() - state.dangerTimer) / 5000);

// After
return Math.min(1.0, (performance.now() - state.dangerTimer) / 5000);
```

### Step 2: 半径計算を一貫性のあるものに変更

危険判定でも物理エンジンと同じ `radius * 0.7` を使用する。

**game.js (200行)**
```javascript
// Before
if (b.position.y - JELLYFISH_TYPES[b.jellyfishType].radius < GAME.DANGER_Y) {

// After
var physicsRadius = JELLYFISH_TYPES[b.jellyfishType].radius * 0.7;
if (b.position.y - physicsRadius < GAME.DANGER_Y) {
```

## Critical Files
- `/Users/5vhgoh/クラゲゲーム/js/game.js` - checkGameOver(), getDangerLevel()
- `/Users/5vhgoh/クラゲゲーム/js/physics.js` - createJellyfish()

## Verification
1. モバイルデバイスでゲームを開始
2. すぐにクラゲをドロップ
3. ゲームオーバーにならずにプレイできることを確認
4. 複数回リスタートして同様に動作することを確認
5. 通常通りクラゲが積み上がった状態で5秒以上危険ラインを超えた場合のみゲームオーバーになることを確認
