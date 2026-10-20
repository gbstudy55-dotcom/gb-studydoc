import { BatchItem, DecryptedPdf, DecryptedVideo, FolderContentItem, StreamQuality, UserSession } from '../types';

const API_BASE = 'https://dishaonlineclassesapi.classx.co.in';

const DEFAULT_HEADERS = {
  'Auth-Key': 'appxapi',
  'Client-Service': 'Appx',
  source: 'website',
};

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
  if (json?.status !== 200 && !json?.data?.token) {
    throw new Error(String(json?.message || json?.msg || 'Login failed! Please enter valid credentials.'));
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

export async function getCatalogBatches(): Promise<BatchItem[]> {
  try {
    const params = new URLSearchParams({ exam_name: '', start: '-1', userid: '0' });
    const res = await fetch(`${API_BASE}/get/courselistnewv2?${params}`, {
      headers: DEFAULT_HEADERS,
    });
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    
    return list
      .filter((item: any) => String(item?.type || 'COURSE').toUpperCase() === 'COURSE' && item?.id)
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
        is_enrolled: false,
      }));
  } catch (err) {
    console.error('Failed to fetch catalog batches:', err);
    return [];
  }
}

export async function getUserPurchasedBatches(
  userId: string,
  token: string,
  ownerName?: string,
  ownerPhone?: string
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
      if (!bid) continue;
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

export async function getFolderContents(
  courseId: string,
  parentId: string = '-1',
  userSession?: UserSession | UserSession[] | null
): Promise<FolderContentItem[]> {
  try {
    const sessions = Array.isArray(userSession)
      ? userSession
      : userSession ? [userSession] : [];

    const primarySession = sessions[0];
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (primarySession?.token && primarySession?.userId) {
      headers.Authorization = primarySession.token;
      headers['User-ID'] = primarySession.userId;
    }

    const pid = parentId && parentId !== courseId ? parentId : '-1';
    const params = new URLSearchParams({ course_id: courseId, parent_id: pid });

    let res = await fetch(`${API_BASE}/get/folder_contentsv2?${params}`, { headers });
    let json = await res.json().catch(() => ({}));
    let items = Array.isArray(json?.data) ? json.data : [];

    // If empty and secondary session exists, try secondary session
    if (items.length === 0 && sessions.length > 1) {
      const secSession = sessions[1];
      const secHeaders: Record<string, string> = {
        ...DEFAULT_HEADERS,
        Authorization: secSession.token,
        'User-ID': secSession.userId,
      };
      const secRes = await fetch(`${API_BASE}/get/folder_contentsv2?${params}`, { headers: secHeaders });
      const secJson = await secRes.json().catch(() => ({}));
      if (Array.isArray(secJson?.data) && secJson.data.length > 0) {
        items = secJson.data;
      }
    }

    return items
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
  } catch (err) {
    console.error('Failed to load folder contents:', err);
    return [];
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
  sessionsInput?: UserSession | UserSession[] | null
): Promise<DecryptedVideo> {
  const sessions = Array.isArray(sessionsInput)
    ? sessionsInput
    : sessionsInput ? [sessionsInput] : [];

  let data: any = {};

  // Try each session to resolve video details
  for (const session of (sessions.length ? sessions : [{ userId: '', token: '' }])) {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (session.token && session.userId) {
      headers.Authorization = session.token;
      headers['User-ID'] = session.userId;
    }

    const params = new URLSearchParams({
      course_id: courseId,
      video_id: videoId,
      ytflag: '0',
      folder_wise_course: '1',
    });

    const res = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${params}`, { headers });
    const json = await res.json().catch(() => ({}));
    if (json?.data?.encrypted_links?.length || json?.data?.video_id || json?.data?.file_link || json?.data?.livestream_links?.length) {
      data = json.data;
      break;
    }
    if (json?.data) {
      data = json.data;
    }
  }

  // Cross-course fallback: try Course 57 (12th Science) and Course 67 (11th Science)
  if (!data?.encrypted_links?.length && !data?.file_link && !data?.video_id && !data?.livestream_links?.length) {
    const fallbackCourseIds = ['57', '67'].filter(id => id !== courseId);
    for (const fCourseId of fallbackCourseIds) {
      for (const session of sessions) {
        try {
          const fbHeaders: Record<string, string> = {
            ...DEFAULT_HEADERS,
            Authorization: session.token,
            'User-ID': session.userId,
          };
          const fbParams = new URLSearchParams({
            course_id: fCourseId,
            video_id: videoId,
            ytflag: '0',
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
      if (data?.encrypted_links?.length || data?.video_id || data?.file_link || data?.livestream_links?.length) break;
    }
  }

  const streamQualities: StreamQuality[] = [];
  const rawStreamUrls: string[] = [];
  let youtubeId = '';

  // 1. Livestream links (if live broadcast)
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

  // 2. Decrypt video_id
  const rawVideoId = String(data.video_id || '');
  if (rawVideoId) {
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

  // 3. Decrypt file_link
  const rawFileLink = String(data.file_link || '');
  if (rawFileLink) {
    const decFileLink = await decryptData(rawFileLink);
    if (/^[A-Za-z0-9_-]{11}$/.test(decFileLink)) {
      if (!youtubeId) youtubeId = decFileLink;
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

  // 4. Encrypted links (720p, 480p, 360p, 240p, 144p HLS Streams)
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

  // 5. Decrypt download_link
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

  // 6. Video player token URL
  const pToken = String(data.video_player_token || '');
  let playerUrl = '';
  if (pToken && pToken !== '1234') {
    const classxUrl = `https://appx-play.classx.co.in/combined-img-player?isMobile=true&token=${encodeURIComponent(pToken)}`;
    playerUrl = formatPlayerUrl(classxUrl);
  }

  // 7. Attached PDF notes in this video
  let pdfUrl = '';
  let pdfKey = '';
  const rawPdfLink = data.pdf_link || data.pdf_link2 || (data.file_link && !data.file_link.includes('mp4') ? data.file_link : '');
  if (rawPdfLink) {
    const decPdf = await decryptData(rawPdfLink);
    if (/^https?:\/\//i.test(decPdf) && !/pdflink\.com/i.test(decPdf)) {
      pdfUrl = decPdf;
      if (String(data.is_pdf_encrypted || '0') !== '0') {
        const decKey = await decryptData(String(data.pdf_encryption_key || ''));
        pdfKey = decKey || data.pdf_encryption_key;
      }
    }
  }

  const preferredQuality = streamQualities.find(s => s.quality === '480p') ||
    streamQualities.find(s => s.quality === '360p') ||
    streamQualities[0];

  const activeStreamUrl = preferredQuality ? preferredQuality.url : rawStreamUrls[0];
  const isLive = Number(data.live_status) === 1 || Boolean(data.livestream_links?.length);

  return {
    id: videoId,
    title: String(data.Title || data.title || 'Video Lecture'),
    youtubeId,
    videoUrls: Array.from(new Set(rawStreamUrls)),
    streamQualities,
    activeStreamUrl,
    playerUrl,
    pdfUrl,
    pdfKey,
    duration: data.duration || '',
    isLive,
    liveStatus: Number(data.live_status || 3),
    raw: data,
  };
}

export async function getPdfDetails(
  courseId: string,
  fileId: string,
  sessionsInput?: UserSession | UserSession[] | null
): Promise<DecryptedPdf | null> {
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

    const params = new URLSearchParams({
      course_id: courseId,
      video_id: fileId,
      ytflag: '0',
      folder_wise_course: '1',
    });

    const res = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${params}`, { headers });
    const json = await res.json().catch(() => ({}));
    if (json?.data?.file_link || json?.data?.pdf_link) {
      data = json.data;
      break;
    }
  }

  // Cross-course fallback: try 57 and 67
  if (!data?.file_link && !data?.pdf_link) {
    const fallbackCourseIds = ['57', '67'].filter(id => id !== courseId);
    for (const fCourseId of fallbackCourseIds) {
      for (const session of sessions) {
        try {
          const fbHeaders: Record<string, string> = {
            ...DEFAULT_HEADERS,
            Authorization: session.token,
            'User-ID': session.userId,
          };
          const fbParams = new URLSearchParams({
            course_id: fCourseId,
            video_id: fileId,
            ytflag: '0',
            folder_wise_course: '1',
          });
          const fbRes = await fetch(`${API_BASE}/get/fetchVideoDetailsById?${fbParams}`, { headers: fbHeaders });
          const fbJson = await fbRes.json().catch(() => ({}));
          if (fbJson?.data?.file_link || fbJson?.data?.pdf_link) {
            data = fbJson.data;
            break;
          }
        } catch {}
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
        title: String(data.Title || data.title || 'PDF Document'),
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
