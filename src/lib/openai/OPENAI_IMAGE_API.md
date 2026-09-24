# OpenAI Image API — verified for Phase 3A (2026)

Source: [OpenAI Image Generation guide](https://developers.openai.com/api/docs/guides/image-generation) (fetched at implementation).

## Endpoint

- **`client.images.edit`** — reference-image workflows (family photo → illustrated subject).
- Do **not** use deprecated DALL·E 2–only patterns for this product.

## Model (configurable)

- Default: **`gpt-image-2.5-sunburst`** — documented for edit/reference precision.
- Override via `OPENAI_IMAGE_MODEL` (e.g. `gpt-image-2.5-flare` for speed).

## Parameters used

| Parameter | Value | Notes |
|-----------|--------|--------|
| `image` | Single uploaded JPEG/PNG/WebP | Reference photo |
| `prompt` | Server-owned only | From `illustrationPrompts.ts` |
| `size` | Default `1024x1024` | Subject isolation; **not** sign 3:2 |
| `quality` | Default `high` | Configurable |
| `background` | `transparent` | Requires PNG/WebP output |
| `output_format` | `png` | Alpha channel |

## Not used

- **`input_fidelity`**: Documented for older GPT Image models; `gpt-image-2`+ processes inputs at high fidelity automatically — omit for 2.5 Sunburst unless docs change.

## Org verification

GPT Image models may require API organization verification before use.

## Transparency

Request `background: "transparent"` + PNG; validate alpha when practical. Imperfect transparency → future BG-removal phase.
