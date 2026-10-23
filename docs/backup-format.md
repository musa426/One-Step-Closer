# 备份格式 / Backup format

备份是一个 UTF-8 JSON 文件，最大 **2 MiB（2,097,152 字节）**，包括空白字符。导出使用紧凑 JSON；下面为便于阅读使用缩进。文件未加密，导入过程不上传内容。保存与恢复步骤见 [README](../README.md#备份与恢复) / [English README](../README.en.md#backup-and-restore)。

This is a UTF-8 JSON file, limited to **2 MiB (2,097,152 bytes)** including whitespace. Exports use compact JSON; the example is indented for readability. Files are unencrypted and imports are processed locally without uploading their contents.

## Version 1

顶层必须且只能包含 `app`、`formatVersion`、`exportedAt` 和 `data`。`app` 固定为 `one-step-closer`，`formatVersion` 是数字 `1`。`exportedAt` 为带时区的 ISO 日期时间；应用导出使用 UTC。`data` 必须包含 `entries`、`places`、`partner`、`settings` 四类数据，不能省略空列表或空对象。

The top-level fields are exactly `app`, `formatVersion`, `exportedAt`, and `data`. `app` is `one-step-closer`; `formatVersion` is the number `1`. `exportedAt` is an ISO timestamp with a timezone; the app exports UTC. All four data categories are required, including empty lists or objects.

以下全部是虚构演示数据 / All data below is fictional:

```json
{
  "app": "one-step-closer",
  "formatVersion": 1,
  "exportedAt": "2026-10-22T12:00:00.000Z",
  "data": {
    "entries": {
      "2026-10-21": {
        "date": "2026-10-21",
        "foodStatus": "vegetarian_seafood",
        "salah": {
          "fajr": false,
          "dhuhr": true,
          "asr": false,
          "maghrib": false,
          "isha": false
        },
        "quran": "translation",
        "reflection": "A fictional example."
      }
    },
    "places": [
      {
        "id": "fictional-place-1",
        "name": "Example Cafe",
        "type": "vegetarian_option",
        "location": "Fictional street",
        "notes": "Demonstration only.",
        "favorite": false,
        "createdAt": "2026-10-21T12:00:00.000Z"
      }
    ],
    "partner": {
      "personOne": "Example A",
      "personTwo": "Example B",
      "weeklyGoal": null,
      "completedThisWeek": false,
      "note": "",
      "updatedAt": null
    },
    "settings": {
      "appName": "One Step Closer",
      "mainFocus": "balanced",
      "reminderText": "今天只需要靠近一点点。",
      "theme": "warm"
    }
  }
}
```

## 校验规则 / Validation

所有对象均拒绝缺失或额外字段。`entries` 的键是有效日历日期 `YYYY-MM-DD`，必须与记录的 `date` 一致；记录按设备本地日期理解，不按导出时区转换。五个礼拜字段及完成、收藏字段必须为布尔值。地点 `id` 必须非空且文件内唯一，`createdAt` 必须是带时区的有效 ISO 日期时间；伙伴 `updatedAt` 使用同样的时间格式或 `null`。

Objects reject missing and extra fields. Entry keys are valid `YYYY-MM-DD` calendar dates matching each entry's `date`. These are local calendar dates, not dates converted from the export timezone. Prayer, completion, and favorite values are booleans. Place IDs must be nonblank and unique within the file. `createdAt` is an ISO timestamp with a timezone; partner `updatedAt` is such a timestamp or `null`.

| 字段 / Field | 允许值 / Allowed values |
| --- | --- |
| `foodStatus` | `null`, `halal`, `vegetarian_seafood`, `unsure`, `not_halal` |
| `quran` | `null`, `none`, `translation`, `tafsir`, `listened`, `five_minutes` |
| Place `type` | `restaurant`, `grocery`, `vegetarian_option`, `other` |
| `weeklyGoal` | `null`, `eat_halal_together`, `try_new_halal_place`, `cook_halal_meal`, `avoid_active_non_halal` |
| `mainFocus` | `food`, `salah`, `quran`, `balanced` |
| `theme` | `warm`, `green`, `minimal` |

其余示例中的文字字段必须为字符串，可为空；文字不会作为 HTML 或命令执行。格式检查不判断文字是否真实或来源是否可信。校验实现位于 [`src/lib/backup.ts`](../src/lib/backup.ts)，格式用例位于 [`tests/backup-format.spec.ts`](../tests/backup-format.spec.ts)。

Other text fields shown in the example are strings and may be empty. Text is not executed as HTML or commands. Structural validation does not determine whether text is true or its source is trusted. See [`src/lib/backup.ts`](../src/lib/backup.ts) and [`tests/backup-format.spec.ts`](../tests/backup-format.spec.ts).

## 版本与恢复边界 / Versions and restore boundaries

只接受版本 1，不猜测或忽略新版本的字段。当前记录必须能正常读取，才能生成当前状态预览并进行恢复。选择文件、预览、取消均不写入数据；确认后完整替换四类数据，不合并，也不提供恢复撤销。请先导出需要保留的当前内容。

Only version 1 is accepted; newer fields or versions are not guessed or silently discarded. Current storage must be readable to preview and restore. File selection, preview, and cancellation do not write records. Confirmation replaces all four categories without merging or an undo operation. Export current content first if it needs to be retained.

旧版四个 `osc:*` 存储键是迁移来源，**不是历史备份文件格式**。新版 `osc:state` 的 `schemaVersion`、`revision`、`epoch` 和 `legacyFingerprint` 属于内部存储元数据，不接受从备份导入。文件格式版本与内部存储版本分开维护。

The four legacy `osc:*` storage keys are migration input, **not an earlier backup-file format**. Internal `osc:state` metadata (`schemaVersion`, `revision`, `epoch`, and `legacyFingerprint`) is not imported from backup files. File format versions and internal storage versions are maintained separately.
