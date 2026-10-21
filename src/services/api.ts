import { BatchItem, DecryptedPdf, DecryptedVideo, FolderContentItem, StreamQuality, UserSession } from '../types';

const API_BASE = 'https://dishaonlineclassesapi.classx.co.in';

const DEFAULT_HEADERS = {
  'Auth-Key': 'appxapi',
  'Client-Service': 'Appx',
  source: 'website',
};

// In-memory cache for fast, rate-limit resilient responses
const FOLDER_CACHE = new Map<string, { items: FolderContentItem[]; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Protected credentials for GB STUDY verified servers
export const PRESET_ACCOUNTS = [
  {
    phone: '9153679070',
    password: '@gaurav',
    label: 'GB Pro Server 1 (12th Science)',
    studentName: 'GB Pro Verified Student',
    courseName: '12th Science (2,638+ Lectures)',
  },
  {
    phone: '7631501165',
    password: 'babugaurav',
    label: 'GB Pro Server 2 (11th Science)',
    studentName: 'GB Pro Verified Student',
    courseName: '11th Science Batch',
  },
];

export function normalizePhone(input: string): string {
  const trimmed = String(input || '').trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function maskPhone(_phone: string): string {
  return '••••••••••';
}

export async function decryptData(data: string): Promise<string> {
  if (!data || data.startsWith('http://') || data.startsWith('https://')) return data;
  const parts = data.split(':');
  if (parts.length < 2) return '';
  try {
    const cipherText = parts[0];
    const ivBase64 = parts[1];
    const base64ToUint8 = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
    const rawKey = new TextEncoder().encode('638udh3829162018');
    const cryptoKey = await crypto.subtle.importKey('raw', rawKey, 'AES-CBC', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: base64ToUint8(ivBase64) },
      cryptoKey,
      base64ToUint8(cipherText)
    );
    return new TextDecoder().decode(decrypted).trim();
  } catch {
    return '';
  }
}

export async function loginUser(phone: string, pass: string): Promise<UserSession> {
  const cleanPhone = normalizePhone(phone);
  const params = new URLSearchParams({ email: cleanPhone, password: pass });
  
  const res = await fetch(`${API_BASE}/post/userLogin?extra_details=0`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const json = await res.json().catch(() => ({}));
  if (json.status !== 200 || !json.data) {
    throw new Error(json.message || 'Login failed. Please verify phone and password.');
  }

  const d = json.data;

  // Always use completely anonymous branded student identifier for privacy
  const maskedName = 'GB Pro Verified Student';

  const serverId = cleanPhone.includes('9153679070')
    ? 'server-1'
    : cleanPhone.includes('7631501165')
    ? 'server-2'
    : `student-${d.userid || d.user_id || d.id}`;

  return {
    userId: String(d.userid || d.user_id || d.id),
    token: String(d.token),
    name: maskedName,
    phone: '••••••••••',
    email: '',
    username: '',
    photo: '',
    isPaidUser: d.is_paid_user || '1',
    state: d.state || '',
    serverId,
  };
}

const EXCLUDED_CATEGORY_IDS = new Set(['78', '77', '76', '81', '82', '83', '84']);

export async function getCatalogBatches(): Promise<BatchItem[]> {
  try {
    const params = new URLSearchParams({ exam_name: '', start: '-1', userid: '0' });
    const res = await fetch(`${API_BASE}/get/courselistnewv2?${params}`, {
      headers: DEFAULT_HEADERS,
    });
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    
    return list
      .filter((item: any) => {
        const id = String(item?.id ?? '');
        if (EXCLUDED_CATEGORY_IDS.has(id)) return false;
        return String(item?.type || 'COURSE').toUpperCase() === 'COURSE' && id;
      })
      .map((item: any) => ({
        id: String(item.id),
        batch_id: String(item.id),
        batch_name: String(item.course_name || 'Batch').trim(),
        course_name: String(item.course_name || 'Batch').trim(),
        thumbnail: extractThumbnail(item),
        price: item.price ?? '',
        mrp: item.mrp ?? '',
        start_date: item.start_date || '',
        end_date: item.end_date || item.expiryDate || '',
        expiry_date: item.end_date || item.expiryDate || '',
        folder_wise_course: Number(item.folder_wise_course ?? 1) || 0,
        videos_count: Number(item.videos_count || 0),
        files_count: Number(item.files_count || 0),
        tests_count: Number(item.tests_count || 0),
        is_enrolled: true,
        accountOwner: 'GB Pro Verified',
      }));
  } catch (err) {
    console.error('Failed to fetch catalog batches:', err);
    return [];
  }
}

export async function getUserPurchasedBatches(
  userId: string,
  token: string,
  _ownerName?: string,
  _ownerPhone?: string
): Promise<BatchItem[]> {
  try {
    const authHeaders = {
      ...DEFAULT_HEADERS,
      Authorization: token,
      'User-ID': userId,
    };

    const s = new URLSearchParams({ userid: userId, start: '0', folder_wise_course: '1' });
    const c = new URLSearchParams({ userid: userId, item_type: '10', paid_status: 'paid' });

    const [resCourses, resPurchases] = await Promise.all([
      fetch(`${API_BASE}/get/mycourse?${s}`, { headers: authHeaders }).catch(() => null),
      fetch(`${API_BASE}/get/get_all_purchases?${c}`, { headers: authHeaders }).catch(() => null),
    ]);

    const dataCourses = resCourses ? await resCourses.json().catch(() => ({})) : {};
    const dataPurchases = resPurchases ? await resPurchases.json().catch(() => ({})) : {};

    const myCourses = Array.isArray(dataCourses?.data) ? dataCourses.data : [];
    const purchases = Array.isArray(dataPurchases?.data)
      ? dataPurchases.data.flatMap((p: any) => (Array.isArray(p?.coursedt) ? p.coursedt : []))
      : [];

    const mergedMap = new Map<string, BatchItem>();

    for (const item of [...purchases, ...myCourses]) {
      const bid = String(item?.id ?? item?.course_id ?? '').trim();
      if (!bid || EXCLUDED_CATEGORY_IDS.has(bid)) continue;
      mergedMap.set(bid, {
        id: bid,
        batch_id: bid,
        batch_name: String(item?.course_name ?? item?.title ?? item?.name ?? 'Enrolled Batch').trim(),
        course_name: String(item?.course_name ?? item?.title ?? item?.name ?? 'Enrolled Batch').trim(),
        thumbnail: extractThumbnail(item),
        price: item?.price ?? '',
        mrp: item?.mrp ?? '',
        start_date: item?.start_date || '',
        end_date: item?.end_date || item?.expiryDate || '',
        expiry_date: item?.end_date || item?.expiryDate || '',
        folder_wise_course: Number(item?.folder_wise_course ?? 1) || 0,
        videos_count: Number(item?.videos_count || 0),
        files_count: Number(item?.files_count || 0),
        tests_count: Number(item?.tests_count || 0),
        is_enrolled: true,
        accountOwner: 'GB Pro Verified',
        accountPhone: undefined,
      });
    }

    return Array.from(mergedMap.values());
  } catch (err) {
    console.error('Failed to fetch user batches:', err);
    return [];
  }
}

export async function fetchCombinedEnrolledBatches(sessions: UserSession[]): Promise<BatchItem[]> {
  const allBatchesMap = new Map<string, BatchItem>();

  for (const session of sessions) {
    if (!session?.userId || !session?.token) continue;
    const batches = await getUserPurchasedBatches(session.userId, session.token, 'GB Verified Access', session.phone);
    for (const b of batches) {
      if (!allBatchesMap.has(b.id)) {
        allBatchesMap.set(b.id, b);
      }
    }
  }

  return Array.from(allBatchesMap.values());
}

async function fetchRawFolderContents(
  courseId: string,
  parentId: string,
  sessions: UserSession[]
): Promise<any[]> {
  const pid = parentId && parentId !== courseId ? parentId : '-1';
  const params = new URLSearchParams({ course_id: courseId, parent_id: pid });

  for (const session of (sessions.length ? sessions : [{ userId: '', token: '' }])) {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (session.token && session.userId) {
      headers.Authorization = session.token;
      headers['User-ID'] = session.userId;
    }

    try {
      const res = await fetch(`${API_BASE}/get/folder_contentsv2?${params}`, { headers });
      if (res.status === 429) {
        // Rate limited: short pause and retry once
        await new Promise((r) => setTimeout(r, 600));
        const retryRes = await fetch(`${API_BASE}/get/folder_contentsv2?${params}`, { headers });
        const json = await retryRes.json().catch(() => ({}));
        if (Array.isArray(json?.data) && json.data.length > 0) return json.data;
      }
      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return json.data;
      }
      if (Array.isArray(json?.data)) {
        return json.data;
      }
    } catch {}
  }

  return [];
}

export async function getFolderContents(
  courseId: string,
  parentId: string = '-1',
  userSession?: UserSession | UserSession[] | null
): Promise<FolderContentItem[]> {
  const cacheKey = `${courseId}:${parentId}`;
  const cached = FOLDER_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.items.length > 0) {
    return cached.items;
  }

  try {
    const sessions = Array.isArray(userSession)
      ? userSession
      : userSession ? [userSession] : [];

    let rawList = await fetchRawFolderContents(courseId, parentId, sessions);

    // Auto-unwrap root: When parentId is -1 and returns a single "Home" folder,
    // automatically unwrap its subfolders so the student directly sees subjects & crash courses!
    if (parentId === '-1' && rawList.length === 1) {
      const first = rawList[0];
      const title = String(first.Title || first.title || '').trim().toLowerCase();
      if (title === 'home' || String(first.material_type || '').toUpperCase() === 'FOLDER') {
        const unwrapped = await fetchRawFolderContents(courseId, String(first.id), sessions);
        if (unwrapped.length > 0) {
          rawList = unwrapped;
        }
      }
    }

    const items: FolderContentItem[] = rawList
      .map((item: any) => ({
        id: String(item?.id ?? ''),
        parent_id: item?.parent_id,
        Title: String(item?.Title || item?.title || 'Untitled').trim(),
        description: item?.description || '',
        material_type: String(item?.material_type || '').toUpperCase(),
        thumbnail: String(item?.thumbnail || '').trim(),
        date_and_time: item?.date_and_time || item?.event_date || '',
        event_date: item?.event_date || item?.date_and_time || '',
        files_count: item?.files_count ?? 0,
        video_id: item?.video_id || '',
        file_link: item?.file_link || '',
        download_link: item?.download_link || '',
        pdf_link: item?.pdf_link || '',
        pdf_link2: item?.pdf_link2 || '',
        is_pdf_encrypted: item?.is_pdf_encrypted ?? '0',
        pdf_encryption_key: item?.pdf_encryption_key || '',
        video_player_token: item?.video_player_token || '',
        video_player_url: item?.video_player_url || '',
        ytFlag: Number(item?.ytFlag ?? 0),
        ytFlagWeb: Number(item?.ytFlagWeb ?? 0),
        course_id: courseId,
        duration: item?.duration || '',
        live_status: Number(item?.live_status ?? 3),
        live_type: item?.live_type,
        livestream_links: Array.isArray(item?.livestream_links) ? item.livestream_links : [],
      }))
      .filter((item: FolderContentItem) => Boolean(item.id));

    if (items.length > 0) {
      FOLDER_CACHE.set(cacheKey, { items, timestamp: Date.now() });
    }

    return items;
  } catch (err) {
    console.error('Failed to load folder contents:', err);
    return cached?.items || [];
  }
}

export function formatMediaProxyUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/api/media-proxy?url=')) return url;
  return `https://bat.doc1.workers.dev/api/media-proxy?url=${encodeURIComponent(url)}`;
}

export function formatPlayerUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/api/disha-player?url=')) return url;
  return `https://bat.doc1.workers.dev/api/disha-player?url=${encodeURIComponent(url)}`;
}

export async function getVideoDetails(
  courseId: string,
  videoId: string,
  sessionsInput?: UserSession | UserSession[] | null,
  folderItem?: FolderContentItem
): Promise<DecryptedVideo> {
  const sessions = Array.isArray(sessionsInput)
    ? sessionsInput
    : sessionsInput ? [sessionsInput] : [];

  let data: any = {};
  const streamQualities: StreamQuality[] = [];
  const rawStreamUrls: string[] = [];
  let youtubeId = '';
  let activeTitle = folderItem?.Title || 'Video Lecture';
  let activeDuration = folderItem?.duration || '';
  let isLive = folderItem?.live_status === 1 || Boolean(folderItem?.livestream_links?.length);
  let liveStatus = Number(folderItem?.live_status ?? 3);
  let pdfUrl = '';
  let pdfKey = '';

  // 1. First priority: Check provided folderItem directly (Instant, Zero Network Latency!)
  if (folderItem) {
    // Decrypt video_id
    if (folderItem.video_id) {
      const decV = await decryptData(folderItem.video_id);
      if (/^[A-Za-z0-9_-]{11}$/.test(decV)) {
        youtubeId = decV;
      } else if (/^https?:\/\//i.test(decV)) {
        if (decV.includes('.m3u8') || decV.includes('/hls-drm-')) {
          const proxied = formatMediaProxyUrl(decV);
          streamQualities.push({ quality: 'Auto', url: proxied });
          rawStreamUrls.push(proxied);
        } else {
          rawStreamUrls.push(decV);
        }
      }
    }

    // Decrypt file_link
    if (folderItem.file_link && !youtubeId) {
      const decF = await decryptData(folderItem.file_link);
      if (/^[A-Za-z0-9_-]{11}$/.test(decF)) {
        youtubeId = decF;
      } else if (/^https?:\/\//i.test(decF)) {
        if (decF.includes('.m3u8') || decF.includes('/hls-drm-')) {
          const proxied = formatMediaProxyUrl(decF);
          streamQualities.push({ quality: 'Auto', url: proxied });
          rawStreamUrls.push(proxied);
        } else {
          rawStreamUrls.push(decF);
        }
      }
    }

    // Decrypt attached notes PDF
    const rawPdf = folderItem.pdf_link || folderItem.pdf_link2 || folderItem.download_link;
    if (rawPdf) {
      const decPdf = await decryptData(rawPdf);
      if (/^https?:\/\//i.test(decPdf) && !/pdflink\.com/i.test(decPdf)) {
        pdfUrl = decPdf;
        if (String(folderItem.is_pdf_encrypted ?? '0') !== '0' && folderItem.pdf_encryption_key) {
          const decK = await decryptData(folderItem.pdf_encryption_key);
          pdfKey = decK || folderItem.pdf_encryption_key;
        }
      }
    }

    // Decrypt livestream links
    if (Array.isArray(folderItem.livestream_links) && folderItem.livestream_links.length > 0) {
      for (const link of folderItem.livestream_links) {
        const decLive = await decryptData(String(link));
        if (/^https?:\/\//i.test(decLive)) {
          const proxied = formatMediaProxyUrl(decLive);
          streamQualities.unshift({ quality: 'LIVE HD', url: proxied });
          rawStreamUrls.unshift(proxied);
          isLive = true;
          liveStatus = 1;
        }
      }
    }
  }

  // 2. Query fetchVideoDetailsById from Disha API for additional HLS resolutions or token
  // Important: Disha API requires ytflag='1' for YouTube lectures, so try '1' then '0'!
  const ytFlagsToTry = folderItem?.ytFlag ? [String(folderItem.ytFlag), '1', '0'] : ['1', '0'];

  for (const session of (sessions.length ? sessions : [{ userId: '', token: '' }])) {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (session.token && session.userId) {
      headers.Authorization = session.token;
      headers['User-ID'] = session.userId;
    }

    for (const flag of ytFlagsToTry) {
      const params = new URLSearchParams({
        course_id: courseId,
        video_id: videoId,
        ytflag: flag,
        folder_wise_course: '1',
      });

      try {
        const res = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${params}`, { headers });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.encrypted_links?.length || json?.data?.video_id || json?.data?.file_link || json?.data?.livestream_links?.length) {
          data = json.data;
          break;
        }
        if (json?.data) {
          data = json.data;
        }
      } catch {}
    }
    if (data?.encrypted_links?.length || data?.video_id || data?.file_link || data?.livestream_links?.length) {
      break;
    }
  }

  // Cross-course fallback if still empty
  if (!data?.encrypted_links?.length && !data?.file_link && !data?.video_id && !data?.livestream_links?.length && !youtubeId && !rawStreamUrls.length) {
    const fallbackCourseIds = ['57', '67', '87', '86', '62', '58'].filter((id) => id !== courseId);
    for (const fCourseId of fallbackCourseIds) {
      for (const session of sessions) {
        const fbHeaders: Record<string, string> = {
          ...DEFAULT_HEADERS,
          Authorization: session.token,
          'User-ID': session.userId,
        };
        for (const flag of ['1', '0']) {
          try {
            const fbParams = new URLSearchParams({
              course_id: fCourseId,
              video_id: videoId,
              ytflag: flag,
              folder_wise_course: '1',
            });
            const fbRes = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${fbParams}`, { headers: fbHeaders });
            const fbJson = await fbRes.json().catch(() => ({}));
            if (fbJson?.data?.encrypted_links?.length || fbJson?.data?.video_id || fbJson?.data?.file_link || fbJson?.data?.livestream_links?.length) {
              data = fbJson.data;
              break;
            }
          } catch {}
        }
        if (data?.encrypted_links?.length || data?.video_id || data?.file_link) break;
      }
      if (data?.encrypted_links?.length || data?.video_id || data?.file_link) break;
    }
  }

  if (data?.Title || data?.title) {
    activeTitle = String(data.Title || data.title).trim();
  }
  if (data?.duration) {
    activeDuration = data.duration;
  }
  if (Number(data?.live_status) === 1 || Boolean(data?.livestream_links?.length)) {
    isLive = true;
    liveStatus = 1;
  }

  // Decrypt livestream links from API
  if (Array.isArray(data.livestream_links)) {
    for (const link of data.livestream_links) {
      const decLive = await decryptData(String(link?.path || link || ''));
      if (/^https?:\/\//i.test(decLive)) {
        if (decLive.includes('.m3u8') || decLive.includes('/hls-drm-')) {
          const proxied = formatMediaProxyUrl(decLive);
          streamQualities.unshift({ quality: 'LIVE HD', url: proxied });
          rawStreamUrls.unshift(proxied);
        } else {
          rawStreamUrls.unshift(decLive);
        }
      }
    }
  }

  // Decrypt data.video_id from API
  const rawVideoId = String(data.video_id || '');
  if (rawVideoId && !youtubeId) {
    const decVideoId = await decryptData(rawVideoId);
    if (/^[A-Za-z0-9_-]{11}$/.test(decVideoId)) {
      youtubeId = decVideoId;
    } else if (/^https?:\/\//i.test(decVideoId)) {
      if (decVideoId.includes('.m3u8') || decVideoId.includes('/hls-drm-')) {
        const proxied = formatMediaProxyUrl(decVideoId);
        streamQualities.push({ quality: 'Auto', url: proxied });
        rawStreamUrls.push(proxied);
      } else {
        rawStreamUrls.push(decVideoId);
      }
    }
  }

  // Decrypt data.file_link from API
  const rawFileLink = String(data.file_link || '');
  if (rawFileLink && !youtubeId) {
    const decFileLink = await decryptData(rawFileLink);
    if (/^[A-Za-z0-9_-]{11}$/.test(decFileLink)) {
      youtubeId = decFileLink;
    } else if (/^https?:\/\//i.test(decFileLink)) {
      if (decFileLink.includes('.m3u8') || decFileLink.includes('/hls-drm-')) {
        const proxied = formatMediaProxyUrl(decFileLink);
        streamQualities.push({ quality: 'Auto', url: proxied });
        rawStreamUrls.push(proxied);
      } else {
        rawStreamUrls.push(decFileLink);
      }
    }
  }

  // Decrypt encrypted_links (720p, 480p, 360p, 240p HLS)
  if (Array.isArray(data.encrypted_links)) {
    for (const el of data.encrypted_links) {
      const decPath = await decryptData(String(el?.path || ''));
      if (/^https?:\/\//i.test(decPath)) {
        if (decPath.includes('.m3u8') || decPath.includes('/hls-drm-')) {
          const proxied = formatMediaProxyUrl(decPath);
          const qLabel = el.quality || 'Auto';
          streamQualities.push({ quality: qLabel, url: proxied });
          rawStreamUrls.push(proxied);
        } else {
          streamQualities.push({ quality: el.quality || 'Direct', url: decPath });
          rawStreamUrls.push(decPath);
        }
      }
    }
  }

  // Decrypt download_link
  const rawDownloadLink = String(data.download_link || '');
  if (rawDownloadLink) {
    const decDownloadLink = await decryptData(rawDownloadLink);
    if (/^https?:\/\//i.test(decDownloadLink)) {
      if (decDownloadLink.includes('.m3u8') || decDownloadLink.includes('/hls-drm-')) {
        const proxied = formatMediaProxyUrl(decDownloadLink);
        rawStreamUrls.push(proxied);
      } else {
        rawStreamUrls.push(decDownloadLink);
      }
    }
  }

  // Video player token URL
  const pToken = String(data.video_player_token || '');
  let playerUrl = '';
  if (pToken && pToken !== '1234') {
    const classxUrl = `https://appx-play.classx.co.in/combined-img-player?isMobile=true&token=${encodeURIComponent(pToken)}`;
    playerUrl = formatPlayerUrl(classxUrl);
  }

  // Attached PDF notes from API if not already resolved
  if (!pdfUrl) {
    const rawPdfLink = data.pdf_link || data.pdf_link2 || (data.file_link && !data.file_link.includes('mp4') ? data.file_link : '');
    if (rawPdfLink) {
      const decPdf = await decryptData(rawPdfLink);
      if (/^https?:\/\//i.test(decPdf) && !/pdflink\.com/i.test(decPdf)) {
        pdfUrl = decPdf;
        if (String(data.is_pdf_encrypted || '0') !== '0' && data.pdf_encryption_key) {
          const decKey = await decryptData(String(data.pdf_encryption_key));
          pdfKey = decKey || data.pdf_encryption_key;
        }
      }
    }
  }

  const preferredQuality =
    streamQualities.find((s) => s.quality === '480p') ||
    streamQualities.find((s) => s.quality === '360p') ||
    streamQualities[0];

  const activeStreamUrl = preferredQuality ? preferredQuality.url : rawStreamUrls[0];

  return {
    id: videoId,
    title: activeTitle,
    youtubeId,
    videoUrls: Array.from(new Set(rawStreamUrls)),
    streamQualities,
    activeStreamUrl,
    playerUrl,
    pdfUrl,
    pdfKey,
    duration: activeDuration,
    isLive,
    liveStatus,
    raw: folderItem || data,
  };
}

export async function getPdfDetails(
  courseId: string,
  fileId: string,
  sessionsInput?: UserSession | UserSession[] | null,
  folderItem?: FolderContentItem
): Promise<DecryptedPdf | null> {
  const activeTitle = folderItem?.Title || 'PDF Document';

  // 1. Direct Resolution from folderItem (Instant!)
  if (folderItem) {
    const candidates = [
      [folderItem.pdf_link, folderItem.is_pdf_encrypted, folderItem.pdf_encryption_key],
      [folderItem.pdf_link2, folderItem.is_pdf_encrypted, folderItem.pdf_encryption_key],
      [folderItem.file_link, folderItem.is_pdf_encrypted, folderItem.pdf_encryption_key],
      [folderItem.download_link, folderItem.is_pdf_encrypted, folderItem.pdf_encryption_key],
    ];

    for (const [link, encFlag, encKey] of candidates) {
      if (!link) continue;
      const decryptedUrl = await decryptData(String(link));
      if (/^https?:\/\//i.test(decryptedUrl) && !/pdflink\.com/i.test(decryptedUrl)) {
        let key = '';
        if (String(encFlag || '0') !== '0' && encKey) {
          const decryptedKey = await decryptData(String(encKey));
          key = decryptedKey || String(encKey);
        }
        return {
          url: decryptedUrl,
          key,
          title: activeTitle,
          rawUrl: String(link),
        };
      }
    }
  }

  // 2. Query fetchVideoDetailsById
  const sessions = Array.isArray(sessionsInput)
    ? sessionsInput
    : sessionsInput ? [sessionsInput] : [];

  let data: any = {};

  for (const session of (sessions.length ? sessions : [{ userId: '', token: '' }])) {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (session.token && session.userId) {
      headers.Authorization = session.token;
      headers['User-ID'] = session.userId;
    }

    for (const flag of ['0', '1']) {
      const params = new URLSearchParams({
        course_id: courseId,
        video_id: fileId,
        ytflag: flag,
        folder_wise_course: '1',
      });

      try {
        const res = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${params}`, { headers });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.file_link || json?.data?.pdf_link || json?.data?.download_link) {
          data = json.data;
          break;
        }
      } catch {}
    }
    if (data?.file_link || data?.pdf_link || data?.download_link) break;
  }

  // Cross-course fallback: try 57 and 67
  if (!data?.file_link && !data?.pdf_link && !data?.download_link) {
    const fallbackCourseIds = ['57', '67', '87', '86'].filter((id) => id !== courseId);
    for (const fCourseId of fallbackCourseIds) {
      for (const session of sessions) {
        const fbHeaders: Record<string, string> = {
          ...DEFAULT_HEADERS,
          Authorization: session.token,
          'User-ID': session.userId,
        };
        for (const flag of ['0', '1']) {
          try {
            const fbParams = new URLSearchParams({
              course_id: fCourseId,
              video_id: fileId,
              ytflag: flag,
              folder_wise_course: '1',
            });
            const fbRes = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${fbParams}`, { headers: fbHeaders });
            const fbJson = await fbRes.json().catch(() => ({}));
            if (fbJson?.data?.file_link || fbJson?.data?.pdf_link || fbJson?.data?.download_link) {
              data = fbJson.data;
              break;
            }
          } catch {}
        }
        if (data?.file_link || data?.pdf_link) break;
      }
      if (data?.file_link || data?.pdf_link) break;
    }
  }

  const candidates = [
    [data.file_link, data.is_pdf_encrypted, data.pdf_encryption_key],
    [data.pdf_link, data.is_pdf_encrypted, data.pdf_encryption_key],
    [data.pdf_link2, data.is_pdf2_encrypted, data.pdf2_encryption_key],
    [data.download_link, data.is_pdf_encrypted, data.pdf_encryption_key],
  ];

  for (const [link, encFlag, encKey] of candidates) {
    if (!link) continue;
    const decryptedUrl = await decryptData(String(link));
    if (/^https?:\/\//i.test(decryptedUrl) && !/pdflink\.com/i.test(decryptedUrl)) {
      let key = '';
      if (String(encFlag || '0') !== '0' && encKey) {
        const decryptedKey = await decryptData(String(encKey));
        key = decryptedKey || String(encKey);
      }
      return {
        url: decryptedUrl,
        key,
        title: String(data.Title || data.title || activeTitle),
        rawUrl: link,
      };
    }
  }

  return null;
}

export function getDecryptedPdfViewerUrl(pdfUrl: string, key?: string): string {
  const params = new URLSearchParams({ u: pdfUrl });
  if (key) params.set('k', key);
  return `https://bat.doc1.workers.dev/api/disha/pdf-file?${params.toString()}`;
}

function extractThumbnail(obj: any): string {
  const fields = ['previewImage', 'thumbnail', 'course_thumbnail', 'image', 'poster', 'batch_image', 'course_image'];
  for (const f of fields) {
    const val = String(obj?.[f] ?? '').trim();
    if (/^https?:\/\//i.test(val)) return val;
    if (val.startsWith('//')) return `https:${val}`;
  }
  return '';
}
