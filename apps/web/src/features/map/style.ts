import type { StyleSpecification } from 'maplibre-gl';
import { IMAGE_CORNERS } from './coordinates';
import designTokens from '@neon-cipher/tokens/design-tokens.json';

export type MapTheme = 'day' | 'dusk' | 'night' | 'default';

export function getMapStyle(theme: MapTheme = 'day'): StyleSpecification {
  const isNight = theme === 'night';
  const backgroundColor = isNight
    ? designTokens.color.surface.dark
    : designTokens.color.surface.panel;

  return {
    version: 8,
    name: 'NeonCipherBase',
    sources: {
      'city-map': {
        type: 'image',
        url: '/map/low-meridian-base.jpg',
        coordinates: IMAGE_CORNERS,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': backgroundColor,
        },
      },
      {
        id: 'city-map-layer',
        type: 'raster',
        source: 'city-map',
        paint: {
          'raster-fade-duration': 0,
        },
      },
    ],
  };
}

export const mapStyle: StyleSpecification = getMapStyle();

