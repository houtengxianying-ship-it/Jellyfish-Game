# クラゲゲームをGitHub Pagesで公開する計画

## 目的
スマホしか持っていない友達とクラゲゲームを遊べるようにするため、GitHub Pagesで公開する。

## 現状
- Gitリポジトリ: あり
- リモート: `https://github.com/houtengxianying-ship-it/--------.git`
- モバイル対応: 完了済み

## 手順

### 1. 現在の変更をコミット・プッシュ
```bash
git add .
git commit -m "モバイル対応の改善"
git push origin main
```

### 2. GitHub Pagesを有効化
GitHubのウェブサイトで操作：
1. https://github.com/houtengxianying-ship-it/-------- にアクセス
2. **Settings** → **Pages** を開く
3. **Source** を `Deploy from a branch` に設定
4. **Branch** を `main`、フォルダを `/ (root)` に設定
5. **Save** をクリック

### 3. 公開URLを確認・共有
- 数分後に `https://houtengxianying-ship-it.github.io/--------/` でアクセス可能
- URLを友達に共有

## 検証方法
1. スマホのブラウザで公開URLにアクセス
2. タップ操作でクラゲが落ちることを確認
3. 友達にURLを送って遊んでもらう
