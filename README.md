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

| オプション | 短縮形 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--speaker` | `-s` | `1` | スピーカー ID |
| `--output` | `-o` | `output.wav` | 出力ファイルパス |
| `--host` | | `http://localhost:50021` | VoiceVox Engine の URL |
| `--play` | `-p` | `false` | 合成後に再生 |

### `voicevox speakers`

利用可能なスピーカーの一覧を表示します。

```bash
voicevox speakers
voicevox speakers --json   # JSON で出力
```

| オプション | デフォルト | 説明 |
| --- | --- | --- |
| `--host` | `http://localhost:50021` | VoiceVox Engine の URL |
| `--json` | `false` | JSON で出力 |

### `voicevox query <text>`

テキストの AudioQuery JSON を表示します。

```bash
voicevox query "こんにちは"
voicevox query "こんにちは" --speaker 3
```

| オプション | 短縮形 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `--speaker` | `-s` | `1` | スピーカー ID |
| `--host` | | `http://localhost:50021` | VoiceVox Engine の URL |

### `voicevox mcp`

MCP サーバーを stdio モードで起動します。

```bash
voicevox mcp
voicevox mcp --host http://localhost:50021
```

## MCP サーバー

`voicevox mcp` で MCP サーバーを起動すると、以下のツールが利用できます。

| ツール名 | 説明 |
| --- | --- |
| `list_speakers` | 利用可能なスピーカーの一覧を返す |
| `audio_query` | テキストの AudioQuery JSON を返す |
| `synthesize` | テキストを音声合成して WAV ファイルを保存し、パスを返す |

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
