# voicevox-cli

[VoiceVox](https://voicevox.hiroshiba.jp/) の CLI ツールと MCP サーバー。

## 必要環境

- Node.js 22+
- [VoiceVox Engine](https://github.com/VOICEVOX/voicevox_engine) (デフォルト: `http://localhost:50021`)

## インストール

```bash
pnpm install
pnpm build
```

ビルド後、`dist/cli.js` を使うか、グローバルにリンクして使用します。

```bash
pnpm link --global
```

## CLI

### `voicevox speak <text>`

テキストを音声合成して WAV ファイルに保存します。

```bash
voicevox speak "こんにちは"
voicevox speak "こんにちは" --speaker 3 --output hello.wav
voicevox speak "こんにちは" --play   # 合成後に再生
```

| オプション  | 短縮形 | デフォルト               | 説明                                  |
| ----------- | ------ | ------------------------ | ------------------------------------- |
| `--speaker` | `-s`   | `1`                      | スピーカー ID                         |
| `--preset`  |        |                          | プリセット ID（`--speaker` より優先） |
| `--output`  | `-o`   | `output.wav`             | 出力ファイルパス                      |
| `--host`    |        | `http://localhost:50021` | VoiceVox Engine の URL                |
| `--play`    | `-p`   | `false`                  | 合成後に再生                          |

### `voicevox speakers`

利用可能なスピーカーの一覧を表示します。

```bash
voicevox speakers
voicevox speakers --json   # JSON で出力
```

| オプション | デフォルト               | 説明                   |
| ---------- | ------------------------ | ---------------------- |
| `--host`   | `http://localhost:50021` | VoiceVox Engine の URL |
| `--json`   | `false`                  | JSON で出力            |

### `voicevox query <text>`

テキストの AudioQuery JSON を表示します。

```bash
voicevox query "こんにちは"
voicevox query "こんにちは" --speaker 3
```

| オプション  | 短縮形 | デフォルト               | 説明                   |
| ----------- | ------ | ------------------------ | ---------------------- |
| `--speaker` | `-s`   | `1`                      | スピーカー ID          |
| `--host`    |        | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox accent-phrases <text>`

テキストのアクセント句 JSON を表示します。`audio_query` を直接編集せず、アクセント句単位で音声の抑揚や長さを調整したい場合に使用します。

```bash
voicevox accent-phrases "こんにちは"
voicevox accent-phrases "こんにちは" --speaker 3
voicevox accent-phrases "コンニチワ" --is-kana
```

| オプション  | 短縮形 | デフォルト               | 説明                   |
| ----------- | ------ | ------------------------ | ---------------------- |
| `--speaker` | `-s`   | `1`                      | スピーカー ID          |
| `--is-kana` |        | `false`                  | テキストがカナかどうか |
| `--host`    |        | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox dict`

ユーザー辞書を管理します。

```bash
voicevox dict                          # 辞書の一覧を表示
voicevox dict --json                   # JSON で出力
voicevox dict add <surface> <読み>     # 単語を追加
voicevox dict update <uuid> [options]  # 単語を更新
voicevox dict delete <uuid>            # 単語を削除
voicevox dict import <file.json>       # JSON ファイルからインポート
```

#### `voicevox dict add <surface> <pronunciation>`

| オプション      | 短縮形 | デフォルト               | 説明                                                                   |
| --------------- | ------ | ------------------------ | ---------------------------------------------------------------------- |
| `--accent-type` | `-a`   | `0`                      | アクセント型                                                           |
| `--word-type`   | `-t`   | `COMMON_NOUN`            | 品詞 (`PROPER_NOUN` / `COMMON_NOUN` / `VERB` / `ADJECTIVE` / `SUFFIX`) |
| `--priority`    | `-p`   | `5`                      | 優先度 (0–10)                                                          |
| `--host`        |        | `http://localhost:50021` | VoiceVox Engine の URL                                                 |

#### `voicevox dict update <uuid>`

| オプション        | 短縮形 | 説明                   |
| ----------------- | ------ | ---------------------- |
| `--surface`       | `-s`   | 表層形                 |
| `--pronunciation` | `-r`   | 読み (カタカナ)        |
| `--accent-type`   | `-a`   | アクセント型           |
| `--word-type`     | `-t`   | 品詞                   |
| `--priority`      | `-p`   | 優先度 (0–10)          |
| `--host`          |        | VoiceVox Engine の URL |

#### `voicevox dict import <file>`

| オプション   | 短縮形 | デフォルト               | 説明                   |
| ------------ | ------ | ------------------------ | ---------------------- |
| `--override` | `-f`   | `false`                  | 既存エントリを上書き   |
| `--host`     |        | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox presets`

プリセットを管理します。

```bash
voicevox presets                    # プリセット一覧を表示
voicevox presets --json             # JSON で出力
voicevox presets add --name <name> --speaker-uuid <uuid> [options]
voicevox presets update <id> [options]
voicevox presets delete <id>
```

#### `voicevox presets add`

| オプション              | 短縮形 | デフォルト               | 説明                    |
| ----------------------- | ------ | ------------------------ | ----------------------- |
| `--name`                | `-n`   |                          | プリセット名（必須）    |
| `--speaker-uuid`        | `-u`   |                          | スピーカー UUID（必須） |
| `--style-id`            | `-s`   | `0`                      | スタイル ID             |
| `--speed`               |        | `1.0`                    | 話速                    |
| `--pitch`               |        | `0.0`                    | 音高                    |
| `--intonation`          |        | `1.0`                    | 抑揚                    |
| `--volume`              |        | `1.0`                    | 音量                    |
| `--pre-phoneme-length`  |        | `0.1`                    | 開始無音時間            |
| `--post-phoneme-length` |        | `0.1`                    | 終了無音時間            |
| `--host`                |        | `http://localhost:50021` | VoiceVox Engine の URL  |

#### `voicevox presets update <id>`

| オプション              | 短縮形 | 説明                   |
| ----------------------- | ------ | ---------------------- |
| `--name`                | `-n`   | プリセット名           |
| `--speaker-uuid`        | `-u`   | スピーカー UUID        |
| `--style-id`            | `-s`   | スタイル ID            |
| `--speed`               |        | 話速                   |
| `--pitch`               |        | 音高                   |
| `--intonation`          |        | 抑揚                   |
| `--volume`              |        | 音量                   |
| `--pre-phoneme-length`  |        | 開始無音時間           |
| `--post-phoneme-length` |        | 終了無音時間           |
| `--host`                |        | VoiceVox Engine の URL |

### `voicevox validate-kana <text>`

テキストが AquesTalk 風記法に従っているか検証します。

```bash
voicevox validate-kana "コンニチワ"
```

| オプション | デフォルト               | 説明                   |
| ---------- | ------------------------ | ---------------------- |
| `--host`   | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox morphable-targets`

エンジンからスピーカー一覧を取得し、各スタイルのモーフィング可否を表示します。

```bash
voicevox morphable-targets
voicevox morphable-targets --json   # JSON で出力
```

| オプション | デフォルト               | 説明                   |
| ---------- | ------------------------ | ---------------------- |
| `--host`   | `http://localhost:50021` | VoiceVox Engine の URL |
| `--json`   | `false`                  | JSON で出力            |

### `voicevox version`

エンジンバージョンとコアバージョンを表示します。

```bash
voicevox version
voicevox version --host http://localhost:50021
```

| オプション | デフォルト               | 説明                   |
| ---------- | ------------------------ | ---------------------- |
| `--host`   | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox info`

エンジンマニフェストと対応デバイス情報を表示します。

```bash
voicevox info
voicevox info --json   # JSON で出力
```

| オプション | デフォルト               | 説明                   |
| ---------- | ------------------------ | ---------------------- |
| `--host`   | `http://localhost:50021` | VoiceVox Engine の URL |
| `--json`   | `false`                  | JSON で出力            |

### `voicevox mcp`

MCP サーバーを stdio モードで起動します。

```bash
voicevox mcp
voicevox mcp --host http://localhost:50021
```

## MCP サーバー

`voicevox mcp` で MCP サーバーを起動すると、以下のツールが利用できます。

| ツール名                         | 説明                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| `list_speakers`                  | 利用可能なスピーカーの一覧を返す                                     |
| `audio_query`                    | テキストの AudioQuery JSON を返す                                    |
| `synthesize`                     | テキストを音声合成して WAV ファイルを保存し、パスを返す              |
| `get_accent_phrases`             | テキストからアクセント句を取得する                                   |
| `get_mora_data`                  | アクセント句から音素の長さと音高を取得する                           |
| `get_mora_length`                | アクセント句から音素の長さを取得する                                 |
| `get_mora_pitch`                 | アクセント句から音高を取得する                                       |
| `get_user_dict`                  | ユーザー辞書の全単語を返す                                           |
| `add_user_dict_word`             | ユーザー辞書に単語を追加する                                         |
| `update_user_dict_word`          | ユーザー辞書の単語を更新する                                         |
| `delete_user_dict_word`          | ユーザー辞書の単語を削除する                                         |
| `list_presets`                   | プリセット一覧を返す                                                 |
| `create_audio_query_from_preset` | プリセットを使って AudioQuery を作成する                             |
| `validate_kana`                  | AquesTalk 風かな表記が正しいか検証する                               |
| `get_morphable_targets`          | 指定スタイルからモーフィング可能なスタイル一覧を取得する             |
| `get_engine_info`                | エンジン情報（バージョン・マニフェスト・対応デバイス）を一括取得する |

### Claude Desktop への設定例

`claude_desktop_config.json` に以下を追加します。

```json
{
  "mcpServers": {
    "voicevox": {
      "command": "voicevox",
      "args": ["mcp"]
    }
  }
}
```

## 開発

```bash
pnpm dev        # ウォッチモードでビルド
pnpm build      # ビルド
pnpm typecheck  # 型チェック
```
