/**
 * Download campaign video to a local file and share it (e.g. to WhatsApp as file, or save to device).
 * Uses expo-file-system/legacy and expo-sharing.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const VIDEO_MIME = "video/mp4";

/**
 * Downloads a video from `videoUrl` to the app cache and returns the local file URI.
 * Use the returned URI with shareVideoFile() to share the actual file.
 */
export async function downloadVideoToFile(videoUrl: string): Promise<string> {
  const filename = `campaign_video_${Date.now()}.mp4`;
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new Error("No cache directory available");
  const fileUri = `${dir}${filename}`;
  const { uri } = await FileSystem.downloadAsync(videoUrl, fileUri);
  return uri;
}

/**
 * Opens the system share sheet with the video file at `localFileUri`.
 * User can pick WhatsApp (or any app) to share the actual video file, or "Save to Files".
 */
export async function shareVideoFile(
  localFileUri: string,
  options?: { dialogTitle?: string }
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error("Sharing is not available on this device");
  await Sharing.shareAsync(localFileUri, {
    mimeType: VIDEO_MIME,
    dialogTitle: options?.dialogTitle ?? "Share video",
  });
}

/**
 * Downloads the video from `videoUrl` and opens the share sheet so the user can
 * share the video file (e.g. to WhatsApp) or save it.
 */
export async function downloadAndShareVideo(
  videoUrl: string,
  options?: { dialogTitle?: string }
): Promise<void> {
  const localUri = await downloadVideoToFile(videoUrl);
  await shareVideoFile(localUri, options);
}
