import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Share,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Pdf from "react-native-pdf";
import { supabase } from "../../../lib/supabaseClient";

export default function PdfViewerScreen() {
  const { file } = useLocalSearchParams<{ file: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfRef = useRef<Pdf>(null);

  // ✅ Fetch PDF from Supabase
  useEffect(() => {
    const fetchPdfUrl = async () => {
      try {
        const decodedFile = decodeURIComponent(file || "");
        const { data, error: listError } = await supabase.storage
          .from("epaper-pdf")
          .list("", { limit: 100 });

        if (listError) throw listError;

        const match = data.find((f) => f.name === decodedFile);
        if (!match) throw new Error("File not found");

        const { data: urlData } = supabase.storage
          .from("epaper-pdf")
          .getPublicUrl(decodedFile);

        if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

        setPdfUrl(urlData.publicUrl);
      } catch (err: any) {
        setError(err.message || "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    fetchPdfUrl();
  }, [file]);

  // ✅ Share PDF file link

  const handleShare = async () => {
    const fileName = decodeURIComponent(file);

    const deepLink = `pradesh-times://upload/${encodeURIComponent(fileName)}`;

    await Share.share({
      message: `📰 आज का E-Paper: ${fileName}

पूरी E-Paper यहाँ पढ़ें:
${deepLink}`,
    });
  };

  // ✅ Loading view
  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C62828" />
        <Text style={styles.loadingText}>Loading E-Paper...</Text>
      </SafeAreaView>
    );
  }

  // ❌ Error view
  if (error || !pdfUrl) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#d32f2f" />
        <Text style={styles.errorText}>{error || "Failed to load PDF"}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ✅ PDF Viewer
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C62828" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { flex: 1 }]} numberOfLines={1}>
          {decodeURIComponent(file)}
        </Text>

        {/* ✅ Share Button */}
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PDF */}
      <View style={styles.pdfContainer}>
        <Pdf
          ref={pdfRef}
          source={{ uri: pdfUrl }}
          trustAllCerts={false}
          enablePaging={true}
          horizontal={true}
          scrollEnabled={true}
          minScale={1.0}
          maxScale={3.0}
          onError={(err) => console.log("❌ PDF Error:", err)}
          style={styles.pdf}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8, marginRight: 8 },
  shareButton: { padding: 8, marginLeft: 8 },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  pdfContainer: { flex: 1, backgroundColor: "#e0e0e0" },
  pdf: { flex: 1, width: "100%" },

//   pdfContainer: { flex: 1 },
// pdf: { flex: 1, width: Dimensions.get("window").width },

  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d32f2f",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
