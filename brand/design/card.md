# Card

Cards are used to help families compare destinations and make decisions.

## Standard Card

| Property | Value |
| --- | ---: |
| Radius | 16px |
| Image Ratio | 4:3 |
| Shadow | Soft |
| Card Gap | 24px |

## Image

- Ratio: 4:3
- Fit: `object-fit: cover`
- Image should fill the container completely.
- Avoid image distortion.
- Avoid visible gaps around rounded corners.

## Hover

Desktop hover:

```css
transform: translateY(-4px);
```

Use a slightly stronger Soft shadow on hover.

## Content Hierarchy

Destination cards should prioritize:

1. Image
2. Name
3. One decision-oriented reason
4. Location or distance
5. Most useful tags
6. Action

## Do Not

- Do not use heavy shadows.
- Do not use exaggerated animation.
- Do not overload cards with database fields.
- Do not show weak statistics such as 0 views or 1 favorite.
- Do not show fake or inferred data as if it were confirmed.

## Tone

Cards should feel like curated recommendations, not admin records.
