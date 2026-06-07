import React from 'react';
import Svg, {Circle, Line, Path, Polyline, Rect} from 'react-native-svg';
import {colors} from '../../theme';

export type IconName =
  | 'chart'
  | 'send'
  | 'contacts'
  | 'device'
  | 'template'
  | 'reply'
  | 'inbox'
  | 'credit'
  | 'user'
  | 'grid'
  | 'shield'
  | 'phone'
  | 'logout'
  | 'menu';

/** Lightweight stroke icons (Feather-style) for the drawer + actions. */
export function Icon({
  name,
  size = 22,
  color = colors.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const p = {stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'chart' && (
        <>
          <Line x1="18" y1="20" x2="18" y2="10" {...p} />
          <Line x1="12" y1="20" x2="12" y2="4" {...p} />
          <Line x1="6" y1="20" x2="6" y2="14" {...p} />
        </>
      )}
      {name === 'send' && <Path d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" {...p} />}
      {name === 'contacts' && (
        <>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...p} />
          <Circle cx="9" cy="7" r="4" {...p} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" {...p} />
        </>
      )}
      {name === 'device' && (
        <>
          <Rect x="5" y="2" width="14" height="20" rx="2" {...p} />
          <Line x1="12" y1="18" x2="12" y2="18" {...p} />
        </>
      )}
      {name === 'template' && (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...p} />
          <Polyline points="14 2 14 8 20 8" {...p} />
          <Line x1="8" y1="13" x2="16" y2="13" {...p} />
          <Line x1="8" y1="17" x2="13" y2="17" {...p} />
        </>
      )}
      {name === 'reply' && <Polyline points="9 17 4 12 9 7" {...p} />}
      {name === 'inbox' && (
        <>
          <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" {...p} />
          <Path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...p} />
        </>
      )}
      {name === 'credit' && (
        <>
          <Rect x="1" y="4" width="22" height="16" rx="2" {...p} />
          <Line x1="1" y1="10" x2="23" y2="10" {...p} />
        </>
      )}
      {name === 'user' && (
        <>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...p} />
          <Circle cx="12" cy="7" r="4" {...p} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x="3" y="3" width="7" height="7" {...p} />
          <Rect x="14" y="3" width="7" height="7" {...p} />
          <Rect x="14" y="14" width="7" height="7" {...p} />
          <Rect x="3" y="14" width="7" height="7" {...p} />
        </>
      )}
      {name === 'shield' && <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />}
      {name === 'phone' && (
        <Path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
          {...p}
        />
      )}
      {name === 'logout' && (
        <>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...p} />
          <Polyline points="16 17 21 12 16 7" {...p} />
          <Line x1="21" y1="12" x2="9" y2="12" {...p} />
        </>
      )}
      {name === 'menu' && (
        <>
          <Line x1="3" y1="12" x2="21" y2="12" {...p} />
          <Line x1="3" y1="6" x2="21" y2="6" {...p} />
          <Line x1="3" y1="18" x2="21" y2="18" {...p} />
        </>
      )}
    </Svg>
  );
}
