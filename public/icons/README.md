# AR 一首 (AR-issyu) アプリ改善アップデート

このリポジトリでは、アプリの機能自体は変更せず、コードの近代化、安定性の向上、およびメンテナンス性の改善を行いました。

## 主な変更点

### 1. コードの近代化 (Java から Kotlin への移行)
- `SplashActivity.java` および `PdfAdapter.java` を Kotlin (`.kt`) に書き換えました。
- Kotlin の機能を活用することで、より安全で簡潔なコードベースになりました。

### 2. スプラッシュ画面の改善
- 待ち時間を 5秒から 2秒に短縮し、アプリ起動時のユーザー体験を向上させました。
- `Timer` と `Handler` による実装を、Lifecycle-aware な `lifecycleScope` と `delay` に変更し、メモリリークのリスクを低減しました。
- レイアウトから未使用の `FrameLayout` を削除しました。

### 3. プライバシーポリシー画面の刷新
- 非推奨となった `ProgressDialog` を廃止し、モダンな `ProgressBar` を採用しました。
- `androidx.preference` ライブラリを導入し、設定値の読み込みを最新の標準に合わせました。

### 4. アプリの安定性と信頼性の向上 (`OneActivity`)
- **コルーチン管理の修正**: `GlobalScope` を `lifecycleScope` に置き換えました。これにより、Activity が破棄された際に実行中の処理が適切にキャンセルされ、バックグラウンドでの不要な動作やクラッシュを防ぎます。
- **リソース管理の徹底**: `onDestroy` ライフサイクルメソッドにて、`MediaPlayer` および `SoundPool` のリソースを明示的に解放 (`release`) する処理を追加しました。
- **コードの整理**: 大規模なコメントアウトブロックを削除し、可読性とメンテナンス性を大幅に向上させました。

### 5. その他の技術的改善
- **FirebaseManager のリファクタリング**: `FirebaseApp` の初期化チェックを強化し、データベース参照の取得をより安全な方法に変更しました。
- **RecyclerView アダプターの修正**: 非推奨の `adapterPosition` を `bindingAdapterPosition` に変更し、リスト操作時の安定性を高めました。
- **ビルド構成の更新**: 必要な依存関係 (`androidx.preference:preference-ktx`) を追加しました。

## 開発者向け情報

### ビルドとテスト
- ビルド: `./gradlew assembleDebug`
- テスト: `./gradlew test`

※ `gradlew` に実行権限がない場合は、`chmod +x gradlew` を実行してください。
