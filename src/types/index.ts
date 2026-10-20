export interface UserSession {
  userId: string;
  token: string;
  name: string;
  phone: string;
  email?: string;
  username?: string;
  photo?: string;
  isPaidUser?: string | boolean;
  state?: string;
  serverId?: string;
}

export interface BatchItem {
  id: string;
  batch_id: string;
  batch_name: string;
  course_name?: string;
  title?: string;
  thumbnail: string;
  previewImage?: string;
  price?: string | number;
  mrp?: string | number;
  start_date?: string;
  end_date?: string;
  expiry_date?: string;
  folder_wise_course?: number;
  videos_count?: number;
  files_count?: number;
  tests_count?: number;
  is_enrolled?: boolean;
  accountPhone?: string;
  accountOwner?: string;
}

export interface FolderContentItem {
  id: string;
  parent_id?: string | number;
  Title: string;
  description?: string;
  material_type: 'FOLDER' | 'VIDEO' | 'PDF' | 'IMAGE' | 'LINK' | 'TEST' | string;
  thumbnail?: string;
  date_and_time?: string;
  event_date?: string;
  files_count?: string | number;
  video_id?: string;
  file_link?: string;
  download_link?: string;
  pdf_link?: string;
  pdf_link2?: string;
  is_pdf_encrypted?: string | number;
  pdf_encryption_key?: string;
  video_player_token?: string;
  video_player_url?: string;
  ytFlag?: number;
  ytFlagWeb?: number;
  course_id?: string;
  duration?: string;
  live_status?: number;
  live_type?: number | string;
  livestream_links?: string[];
}

export interface StreamQuality {
  quality: string;
  url: string;
}

export interface DecryptedVideo {
  id: string;
  title: string;
  youtubeId?: string;
  videoUrls: string[];
  streamQualities?: StreamQuality[];
  activeStreamUrl?: string;
  playerUrl?: string;
  pdfUrl?: string;
  pdfKey?: string;
  duration?: string;
  isLive?: boolean;
  liveStatus?: number;
  raw?: FolderContentItem;
}

export interface DecryptedPdf {
  url: string;
  key?: string;
  title: string;
  rawUrl?: string;
}

export interface BreadcrumbStep {
  id: string;
  title: string;
}
