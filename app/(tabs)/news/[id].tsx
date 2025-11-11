// app/(tabs)/news/[id].tsx
import { Redirect } from "expo-router";

export default function NewsRedirect() {
  // जब भी कोई dynamic news link खुलेगा जैसे pradesh-times://news/abc123
  // Expo Router अब unmatched error नहीं दिखाएगा
  // और सीधे /news पर redirect करेगा
  return <Redirect href="/(tabs)/news" />;
}
