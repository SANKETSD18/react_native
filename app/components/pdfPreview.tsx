import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState, useRef, useEffect } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";

type Props = {
  pdfUrl: string;
  goBack: () => void;
};

export default function PdfPreview({ pdfUrl, goBack }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pdfRef = useRef<Pdf>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getFileName = () => {
    try {
      const parts = pdfUrl.split("/");
      const fileName = parts[parts.length - 1];
      return decodeURIComponent(fileName);
    } catch {
      return "E-Paper";
    }
  };

  const goToNextPage = () => {
    if (isNavigating || currentPage >= totalPages) return;

    setIsNavigating(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    setTimeout(() => {
      if (pdfRef.current) {
        try {
          pdfRef.current.setPage(nextPage);
        } catch (e) {}
      }
      setTimeout(() => setIsNavigating(false), 400);
    }, 100);
  };

  const goToPreviousPage = () => {
    if (isNavigating || currentPage <= 1) return;

    setIsNavigating(true);
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);

    setTimeout(() => {
      if (pdfRef.current) {
        try {
          pdfRef.current.setPage(prevPage);
        } catch (e) {}
      }
      setTimeout(() => setIsNavigating(false), 400);
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar backgroundColor="#C62828" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getFileName()}
          </Text>
          {totalPages > 0 && (
            <Text style={styles.headerSubtitle}>
              Page {currentPage} of {totalPages}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert("E-Paper", `Page ${currentPage}/${totalPages}`);
          }}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.pdfContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#d32f2f" />
            <Text style={styles.errorTitle}>Failed to Load</Text>
            <TouchableOpacity style={styles.retryButton} onPress={goBack}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUrl }}
            trustAllCerts={false}
            page={currentPage}
            scrollEnabled={false}
            enablePaging={true}
            enableDoubleTapZoom={false}
            minScale={1.0}
            maxScale={2.0}
            horizontal={false}
            spacing={10}
            enableAntialiasing={true}
            onLoadComplete={(numberOfPages) => {
              // console.log("PDF loaded:", numberOfPages);
              setTotalPages(numberOfPages);
              setCurrentPage(1);
              setError(false);
            }}
            onPageChanged={(page, numberOfPages) => {
              // console.log("Page:", page);
              setCurrentPage(page);
              if (numberOfPages > totalPages) {
                setTotalPages(numberOfPages);
              }
            }}
            onError={(err) => {
              console.log("Error:", err);
              setError(true);
            }}
            style={styles.pdf}
          />
        )}
      </View>

      {!error && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={goToPreviousPage}
            style={[
              styles.navButton,
              (currentPage <= 1 || isNavigating) && styles.navButtonDisabled,
            ]}
            disabled={currentPage <= 1 || isNavigating}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentPage <= 1 || isNavigating ? "#ccc" : "#C62828"}
            />
            <Text
              style={[
                styles.navButtonText,
                (currentPage <= 1 || isNavigating) &&
                  styles.navButtonTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            {totalPages > 0 ? (
              <Text style={styles.pageText}>
                <Text style={styles.pageNumberBold}>{currentPage}</Text> /{" "}
                {totalPages}
              </Text>
            ) : (
              <Text style={styles.pageText}>Loading...</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={goToNextPage}
            style={[
              styles.navButton,
              (currentPage >= totalPages || isNavigating) &&
                styles.navButtonDisabled,
            ]}
            disabled={currentPage >= totalPages || isNavigating}
          >
            <Text
              style={[
                styles.navButtonText,
                (currentPage >= totalPages || isNavigating) &&
                  styles.navButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                currentPage >= totalPages || isNavigating ? "#ccc" : "#C62828"
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  backButton: { padding: 8, marginRight: 8 },
  headerCenter: { flex: 1, marginHorizontal: 8 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  infoButton: { padding: 8, marginLeft: 8 },
  pdfContainer: { flex: 1, backgroundColor: "#e0e0e0" },
  pdf: { flex: 1, backgroundColor: "#e0e0e0" },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footerContainer: {
    marginBottom: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    minWidth: 80,
    justifyContent: "center",
  },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { fontSize: 14, fontWeight: "600", color: "#C62828" },
  navButtonTextDisabled: { color: "#ccc" },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  pageText: { fontSize: 14, color: "#666", fontWeight: "500" },
  pageNumberBold: { fontSize: 16, fontWeight: "bold", color: "#C62828" },
});
