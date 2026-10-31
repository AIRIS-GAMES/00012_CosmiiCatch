# Cosmii Catch

## iOS開発

必要環境: Node.js 20以降、Xcode。実機署名とApp Store配信にはApple Developer Programへの登録が必要です。

キャラクターは001が初期主人公、002以降がCosmo Coinで購入するキャラクターです。
クリア・失敗画面のXボタンは、結果文を入れたX投稿画面を開きます。ランキングはiOS Game Centerを使います。
音声はタイトル画面のスピーカーボタンで切り替えられます。通知は起動時に案内し、許可後はD1/D7に予約します。iOSはローカル通知、デスクトップブラウザーはページが開いている間の通知です。ブラウザーを閉じた後も確実に届けるにはWeb Push用のサーバー基盤が別途必要です。
ステージ選択画面からBGMがループ再生され、日本語設定では「小さな星」、英語設定では「littlestar」が流れます。BGMはスピーカーボタンで効果音と一緒に切り替わります。

```sh
npm install
npm run build
npx cap add ios
npm run ios
```

`npm run build` はゲームとCapacitorプラグインを `www/` にまとめます。ゲーム、プラグイン依存関係、またはネイティブ設定を変更した後は `npm run cap:sync` を実行してください。`npm run ios` でXcodeプロジェクトを開けます。

Bundle IDは `com.airisgames.cosmiicatch` です。Apple Developerアカウントにこの識別子を登録し、XcodeのSigning & CapabilitiesでTeamを選択してください。

## App Store申請前の確認

- 正式なアプリアイコンとApp Store用スクリーンショットを用意し、`ios/App/App/Assets.xcassets` のアイコンを差し替える。
- アプリ公開後、[src/index.html](./src/index.html) 内のApp Store URL (`idXXXXXXXXXX`) を実際のURLへ変更する。
- プライバシーポリシーを公開し、App Store Connectのプライバシー申告を完了する。ゲームの進行状況は端末内に保存され、表示フォントの読み込みにはGoogle Fontsを使用する。
- 通知、傾き操作、シェア、オフライン時の表示、セーフエリアを、対応するiPhone/iPad実機で確認する。
- App Store Connectの「機能」>「Game Center」でリーダーボードを作成し、IDを `cosmii_endless_best` と `cosmii_total_stars` に設定する。エンドレス用は数値・スコア形式、全期間、最高スコアを採用する設定にする。
- Game CenterをApp IDで有効にし、実機でGame Centerにサインインした状態でスコア送信とグローバルランキング表示を試験する。Simulatorだけでは実際のユーザー間ランキングを確認できない場合がある。
