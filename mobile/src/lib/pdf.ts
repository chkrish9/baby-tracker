import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { apiFetch } from "./apiClient";
import { getAccessToken } from "./storage";

// Converts an authenticated /files/* image into a data: URI so it can be
// embedded directly in the PDF's HTML — expo-print's renderer has no way to
// attach our Bearer header to an <img> subresource request otherwise.
export async function imageToDataUri(relativePath: string): Promise<string | null> {
  try {
    const token = await getAccessToken();
    const res = await apiFetch(`/files/${relativePath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateAndSharePdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  }
}
