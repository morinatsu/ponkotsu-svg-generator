# Julesへの指示書 (v0.4 - 単体テスト導入)

## プロジェクト名:

ぽんkotsu-svg-generator (v0.4 - 単体テスト導入)

## プロジェクト概要:

アプリケーションの品質と保守性を向上させるため、テストフレームワーク Vitest を導入し、状態管理のコアロジックである Reducer 関数の単体テストを作成します。これにより、今後のリファクタリングや機能追加を安全に行うための基盤を築きます。

## 実装ステップの提案:

Jules、以下のステップでテスト環境の構築とテストコードの実装を進めてください。

### 1. テスト関連ライブラリのインストール

まず、開発用の依存ライブラリとしてVitestと、Reactコンポーネントのテストに必要なライブラリをインストールします。

```Bash

pnpm add -D vitest happy-dom @testing-library/react @testing-library/jest-dom
```

- vitest: 高速なテストランナーです。
- happy-dom: Node.js環境でDOM APIをシミュレートするためのライブラリです。JSDOMよりも高速です。
- @testing-library/react: Reactコンポーネントをテストするためのユーティリティです。
- @testing-library/jest-dom: expect に toBeInTheDocument のようなカスタムマッチャーを追加します。

### 2. 設定ファイルの更新

ViteとTypeScriptにVitestの設定を追記します。

`vite.config.ts` の *更新* :

VitestがブラウザのAPI（DOMなど）を正しく扱えるように、テスト環境の設定を追加します。

```コード スニペット

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
  },
})
```

`tsconfig.app.json` *の更新* :

`"include"` 配列にテストファイルが含まれるように設定を変更します。

```コード スニペット

{
  // ... (compilerOptionsはそのまま)
  "include": ["src", "src/test"]
}
```

*テストセットアップファイルの作成:*

`src/test/setup.ts` という名前で新しいファイルを作成し、以下の内容を記述してください。これにより、すべてのテストファイルで *jest-dom* のマッチャーが利用可能になります。

```コード スニペット

import '@testing-library/jest-dom';
```

### 3. Reducerのテスト作成

アプリケーションの心臓部である `reducer` と `historyReducer` のロジックが正しく動作することを保証するテストを作成します。

`src/state/reducer.test.ts` *の作成:*

まず、基本的な図形操作のReducerからテストします。以下のテストケースを含めてください。

- ADD_SHAPE: 新しい図形が `shapes` 配列に正しく追加されること。
- DELETE_SELECTED_SHAPE: 選択された図形が `shapes` 配列から正しく削除され、 `selectedShapeId` が `null` になること。
- CLEAR_CANVAS: `shapes` 配列が空になり、`selectedShapeId` が `null` になること。
- SELECT_SHAPE: 指定した図形のIDが `selectedShapeId` に正しく設定されること。

`src/state/historyReducer.test.ts` の作成:

次に、Undo/Redoを管理する高階Reducerをテストします。

- UNDO: 状態が一つ前に戻ること (present が past の最後の要素になる)。
- REDO: Undoした状態をやり直せること (present が future の最初の要素になる)。
- 履歴のクリア: UNDO した後に新しいアクションを実行すると、future (やり直し履歴) がクリアされること。
- 履歴の境界: past が空のときに UNDO しても状態が変わらないこと。future が空のときに REDO しても状態が変わらないこと。

### 4. テストの実行

`package.json` にテスト実行用のスクリプトを追加してください。

`package.json` *の更新:*

```コード スニペット

"scripts": {
  // ... (既存のスクリプト)
  "test": "vitest",
  "test:ui": "vitest --ui"
},
```

以下のコマンドでテストを実行できます。

```Bash

# CUIでテストを実行
pnpm run test

# ブラウザUIでテストを実行
pnpm run test:ui
```
