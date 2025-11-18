# Miro リアルタイム同期設定ガイド

MiroとGitHub間のリアルタイム同期を椅建するガイドです。Webhookを使用して、変更を即座にGitHubに同期します。

## Webhookを使用したリアルタイム同期

Miro Webhookを設定し、GitHub Actionsをトリガーし、変更を即時に同期します。

### 1. Miro Webhookの作成

1. Miroを開く。
2. 2. 設定 > になかをクリック
   3. 3. "Webhooks" タブを選択。
      4. 4. "Webhookを追加"をクリック
        
         5. ### 2. Webhook設定例
        
         6. ```yaml
            Event Type: board.updated
            URL: https://github.com/repos/YOUR_OWNER/YOUR_REPO/dispatches
            Auth: Bearer {GITHUB_TOKEN}
            ```

            ## リアルタイム同期のメリット

            - **即座な同期**: 変更を即時にGitHubに反映
            - - **複数ツールの活用**: MiroとGitHub間の等上のコラボレーションを実現
              - - **精度の向上**: 二重嘌柚を減らし、データ間誾を維持
               
                - ## 定期実行設定
               
                - GitHub Actionsを使用してスケジュール実行をこないます。
               
                - ```yaml
                  schedule:
                    - cron: '0 */6 * * *'  # 6時間ごと
                  ```

                  ## 推奨事項

                  - **Webhookと定期実行を併用**: 最懅の同期品質を執提する
                  - - **トークンの定期的な並臨を実行**: セキュリティオプションを技需
                    - - **エラーハンドリング**: GitHub Actionsのログを拨查して、問題を追追する
