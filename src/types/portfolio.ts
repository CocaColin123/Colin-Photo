export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  aspect: 'portrait' | 'landscape' | 'square';
  commentary?: string;
  overlay?: string;
  /** 信息卡：两行，地点（大一号）+ 时间，每行 ≤5 字，无标点 */
  infoStamp?: { place: string; time: string };
}

export interface AlbumStyle {
  accentColor: string;
  fontClass: string;
  bgChar: string;
  bgCharPos?: { top?: string; left?: string; right?: string; bottom?: string };
  /**
   * 首页封面裁切焦点（对应 CSS object-position）。
   * 例如：'center', '50% 35%', 'left center', 'right 40%'.
   */
  coverObjectPosition?: string;
}

export interface Album {
  id: string;
  location: string;
  title: string;
  description: string;
  coverImage: string;
  epigraph: string;
  style: AlbumStyle;
  media: Media[];
}
