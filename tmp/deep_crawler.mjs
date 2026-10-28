import fs from 'fs';

const T1 = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjE3NzQzODEiLCJ0aW1lc3RhbXAiOjE3OTI1ODQ2MzYsIml2X3ZlciI6MjI3LCJzZXNzaW9uIjoiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LmV5SnBaQ0k2SWpFM056UXpPREVpTENKbGJXRnBiQ0k2SW5OaGNuWnZkSFJoYlhsaFpHRjJOemc1UUdGcGJDNWpiMjBpTENKdVlXMWxJam9pVUhKcGVXRnVhMkVnZVdGa1lYWWdJaXdpZEdWdVlXNTBWSGx3WlNJNkluVnpaWElpTENKMFpXNWhiblJPWVcxbElqb2laR2x6YUdGdmJteHBibVZqYkdGemMyVnpYMlJpSWl3aWRHVnVZVzUwU1dRaU9pSWlMQ0prYVhOd2IzTmhZbXhsSWpwbVlXeHpaWDAueU11Yloxc0N0a1lmWVVDc2Jrd2h2bENtV0lhT2FZY3dnVV8xQlBUaWYtcyJ9.C1levpidXkpqRswAWU1TQp9I_7Fug63b8R9ZQYS9u3c";
const U1 = "1774381";

const T2 = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjExMTQwOTUiLCJ0aW1lc3RhbXAiOjE3OTI1ODQ2MzYsIml2X3ZlciI6Mjg0LCJzZXNzaW9uIjoiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6STFOaUo5LmV5SnBaQ0k2SWpFeE1UUXdPVFVpTENKbGJXRnBiQ0k2SW10MWJXRnljMkZ5ZG05MGRHRnRNakV3TXprNFFHZHRZV2xzTG1OdmJTSXNJbTVoYldVaU9pSnpZWEoyYjNSMFlXMGdlV0ZrWVhZaUxDSjBaVzVoYm5SVWVYQmxJam9pZFhObGNpSXNJblJsYm1GdWRFNWhiV1VpT2lKa2FYTm9ZVzl1YkdsdVpXTnNZWE56WlhOZlpHSWlMQ0owWlc1aGJuUkpaQ0k2SWlJc0ltUnBjM0J2YzJGaWJHVWlPbVpoYkhObGZRLlB6UjVHbWZ3Uk8wRkt2MEdPNjY1RXNza1VZYjZHeWpyZElzOFlRcDRNc2cifQ.BmJlAuRmyZ5ozzdmzrdCt5q0zeg1AG6OhoccR-8R9UM";
const U2 = "1114095";

const API_BASE = "https://dishaonlineclassesapi.classx.co.in";

const DEFAULT_HEADERS = {
  "Auth-Key": "appxapi",
  "Client-Service": "Appx",
  source: "website",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFolder(courseId, parentId) {
  const is11th = ["67", "68", "69", "70", "27"].includes(String(courseId));
  const token = is11th ? T2 : T1;
  const user = is11th ? U2 : U1;

  const url = `${API_BASE}/get/folder_contentsv2?course_id=${courseId}&parent_id=${parentId}`;
  try {
    const res = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: token,
        "User-ID": user,
      },
    });
    if (res.status === 429) {
      console.log(`429 on ${courseId}:${parentId}, waiting 3s...`);
      await sleep(3000);
      return fetchFolder(courseId, parentId);
    }
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.error(`Error fetching ${courseId}:${parentId}:`, err.message);
    return [];
  }
}

async function crawlCourse(courseId) {
  console.log(`\n=== Crawling Course ${courseId} ===`);
  const results = {};
  const queue = ["-1"];
  const visited = new Set();

  while (queue.length > 0) {
    const currentPid = queue.shift();
    if (visited.has(currentPid)) continue;
    visited.add(currentPid);

    const items = await fetchFolder(courseId, currentPid);
    results[`${courseId}:${currentPid}`] = items;
    console.log(`Course ${courseId} -> parent ${currentPid}: got ${items.length} items`);

    for (const item of items) {
      const type = String(item.material_type || "").toUpperCase();
      const id = String(item.id || "");
      if (type === "FOLDER" && id && !visited.has(id)) {
        queue.push(id);
      }
    }

    await sleep(60);
  }

  // Also if parent -1 returned a single Home folder, make sure courseId:-1 also maps to the unwrapped children!
  const rootItems = results[`${courseId}:-1`] || [];
  if (rootItems.length === 1 && String(rootItems[0].material_type || "").toUpperCase() === "FOLDER") {
    const homeId = String(rootItems[0].id);
    if (results[`${courseId}:${homeId}`]) {
      console.log(`Linking root ${courseId}:-1 to ${homeId} (${results[`${courseId}:${homeId}`].length} items)`);
      // We keep the home items directly as unwrapped root
      results[`${courseId}:root_unwrapped`] = results[`${courseId}:${homeId}`];
    }
  }

  console.log(`Finished Course ${courseId}: ${visited.size} folders crawled.`);
  return results;
}

async function main() {
  console.log("Starting deep crawl...");
  const allData = {};

  // Crawl Batch 57 (12th Science Hindi)
  const d57 = await crawlCourse("57");
  Object.assign(allData, d57);

  // Crawl Batch 67 (11th Science Hindi)
  const d67 = await crawlCourse("67");
  Object.assign(allData, d67);

  // Crawl Batch 87 (12th Science Crash Course)
  const d87 = await crawlCourse("87");
  Object.assign(allData, d87);

  // Crawl Batch 86 (Dream 450+ Crash Course)
  const d86 = await crawlCourse("86");
  Object.assign(allData, d86);

  console.log(`\nTotal folders crawled across all courses: ${Object.keys(allData).length}`);

  const outputJs = `import { FolderContentItem } from "../types";\n\nexport const PRELOADED_FOLDER_CONTENTS: Record<string, FolderContentItem[]> = ${JSON.stringify(
    allData,
    null,
    2
  )};\n`;

  fs.writeFileSync("src/data/preloadedFolderData.ts", outputJs, "utf8");
  console.log(`Saved to src/data/preloadedFolderData.ts (${(fs.statSync("src/data/preloadedFolderData.ts").size / (1024 * 1024)).toFixed(2)} MB)`);
}

main();
