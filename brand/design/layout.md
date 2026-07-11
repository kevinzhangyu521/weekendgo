# Layout

栖美地的布局系统要稳定、清爽、容易扩展。

## Container

统一最大宽度：

```css
max-width: 1280px;
```

Responsive padding:

| Device | Padding |
| --- | ---: |
| Desktop | 32px |
| Tablet | 24px |
| Mobile | 16px |

## Spacing

| Element | Value |
| --- | ---: |
| Section Gap | 64px |
| Card Gap | 24px |
| Title to Content | 24px |
| Dense Card Inner Gap | 12px - 16px |

## Layout Principles

- All major sections should align to the same container.
- Do not let one module stretch wider than another.
- Do not create a new page width for each feature.
- Keep vertical rhythm consistent.
- Use whitespace to create trust, not emptiness.

## Responsive Rules

Desktop:

- Use balanced grids and clear section rhythm.
- Avoid full-width blocks unless they serve a clear editorial purpose.

Tablet:

- Preserve the same information order.
- Reduce columns before reducing readability.

Mobile:

- Prioritize scanning.
- Avoid horizontal overflow.
- Keep primary actions reachable.

## Do Not

- Do not mix many layout widths on the same page.
- Do not use cramped multi-column layouts on mobile.
- Do not make every module visually equal if the content hierarchy differs.
