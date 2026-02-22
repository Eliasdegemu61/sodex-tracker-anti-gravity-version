// Favicon - DEX Trading Tracker - Pure black circle with minimal orange crosshair - Embedded SVG Data URI
export const FAVICON_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyNTYiIGZpbGw9IiMwMDAwMDAiLz48cGF0aCBkPSJNIDI1NiAxMDAgTCAyNTYgNDEyIiBzdHJva2U9IiNlYTYwMWEiIHN0cm9rZS13aWR0aD0iMjAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0gMTAwIDI1NiBMIDQxMiAyNTYiIHN0cm9rZT0iI2VhNjAxYSIgc3Ryb2tlLXdpZHRoPSIyMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTSAxODAgMTgwIEwgMzMyIDMzMiIgc3Ryb2tlPSIjZWE2MDFhIiBzdHJva2Utd2lkdGg9IjE4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNyIvPjxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTgiIGZpbGw9IiNlYTYwMWEiLz48L3N2Zz4=';

// Grenade image for footer (simplified 3D grenade representation)
export const GRENADE_IMAGE_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iMTAwIiB5PSIxMjAiIGZvbnQtc2l6ZT0iODAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZWE1ODBjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OAPC90ZXh0Pjwvc3ZnPg==';

// Helper function to create inline image data
export const createImageDataURI = (base64String: string, format: 'png' | 'jpg' | 'svg' = 'png'): string => {
  if (format === 'svg') {
    return `data:image/svg+xml;base64,${base64String}`;
  }
  return `data:image/${format};base64,${base64String}`;
};
