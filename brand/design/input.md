# Input

Inputs should feel simple, stable, and trustworthy.

## Standard Input

| Property | Value |
| --- | ---: |
| Height | 48px |
| Radius | 12px |
| Border | `#E5E7EB` |
| Focus | Brand Green |
| Text | `#1F2937` |
| Placeholder | `#6B7280` |

## Focus State

Use brand green for focus:

```css
border-color: #2E7D32;
box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
```

## Error State

- Border: Danger `#EF4444`
- Background can be lightly tinted
- Error message should be short and specific

## Placeholder

Placeholder should guide action.

Prefer:

> 搜索露营、玩水、公园

Avoid:

> 请输入关键词

## Do Not

- Do not use tiny input height.
- Do not rely on placeholder as the only label for complex forms.
- Do not show technical error messages to users.
- Do not use high-saturation backgrounds inside inputs.
