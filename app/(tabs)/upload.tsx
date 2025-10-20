import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabaseClient";
import PdfPreview from "../components/pdfPreview";
import UploadSkeletonLoader from "../components/Skeleton/UploadSkeletonLoader";
import { useAuth } from "../providers/AuthProvider";

const BUCKET = "epaper-pdf";

interface PdfFile {
  name: string;
  url: string;
  path: string;
}

export default function PdfUploader() {
  const [pdfList, setPdfList] = useState<PdfFile[]>([]);
  const [search, setSearch] = useState<string>("");
  const [cities] = useState<string[]>(["Bhopal", "Sehore", "Vidisha", "Rajgarh", "Narmadapuram"]);
  const [selectedCity, setSelectedCity] = useState<string>("Bhopal");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { role } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCity, setFilterCity] = useState<string>("All");
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadSectionExpanded, setUploadSectionExpanded] = useState(false); // ✅ NEW STATE

  const fetchPDFs = useCallback(async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
      if (error) {
        console.error("Fetch PDFs error:", error);
        return;
      }
      const filesWithUrls: PdfFile[] = data.map((file) => {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
        return { name: file.name, url: urlData.publicUrl, path: file.name };
      });
      setPdfList(filesWithUrls);
    } catch (err) {
      console.error("Fetch PDFs exception:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPDFs();
  }, [fetchPDFs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPDFs();
    setRefreshing(false);
  };

  const uploadPDF = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!result.assets || !result.assets.length) {
        setLoading(false);
        return Alert.alert("Error", "No file selected.");
      }

      const fileUri = result.assets[0].uri;
      const fileName = `${selectedCity}-${String(selectedDate.getDate()).padStart(2, "0")}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${selectedDate.getFullYear()}.pdf`;

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(fileName);

      if (urlError || !signedUrlData) {
        setMessage("Failed to get upload URL: " + urlError?.message);
        setLoading(false);
        return;
      }

      const signedUrl = signedUrlData.signedUrl;

      const uploadResult = await FileSystem.uploadAsync(signedUrl, fileUri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (uploadResult.status === 200) {
        setMessage("success");
        setUploadedFileName(fileName);
        fetchPDFs();
        
        setTimeout(() => {
          setMessage(null);
          setUploadedFileName(null);
        }, 3000);
      } else {
        setMessage(`Upload failed with status: ${uploadResult.status}`);
        console.error("Upload result:", uploadResult);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setMessage("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedDate, fetchPDFs]);

  const deletePDF = useCallback(
    (filePath: string, fileName: string) => {
      Alert.alert(
        "Delete PDF", 
        `Are you sure you want to delete ${fileName}?`, 
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
                if (error) {
                  Alert.alert("Error", error.message);
                } else {
                  Alert.alert("Success", "PDF deleted successfully!");
                  fetchPDFs();
                }
              } catch (err) {
                console.error("Delete PDF error:", err);
                Alert.alert("Error", "Something went wrong while deleting.");
              }
            },
          },
        ]
      );
    },
    [fetchPDFs]
  );

  const filteredList = pdfList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    
    if (filterCity === "All") {
      return matchesSearch;
    }
    
    const matchesCity = item.name.toLowerCase().startsWith(filterCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (selectedPdf) {
    return <PdfPreview pdfUrl={selectedPdf} goBack={() => setSelectedPdf(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C62828" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📰 E-Paper</Text>
          <Text style={styles.headerSubtitle}>Daily Digital Newspaper</Text>
        </View>
        {role === "admin" && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* ✅ COLLAPSIBLE ADMIN UPLOAD SECTION */}
        {role === "admin" && (
          <View style={styles.uploadSection}>
            {/* ✅ COLLAPSIBLE HEADER */}
            <TouchableOpacity
              onPress={() => setUploadSectionExpanded(!uploadSectionExpanded)}
              style={styles.uploadSectionHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                <Ionicons name="cloud-upload-outline" size={18} color="#C62828" /> Upload E-Paper
              </Text>
              <View style={styles.expandIndicator}>
                <Text style={styles.expandText}>
                  {uploadSectionExpanded ? "Collapse" : "Expand"}
                </Text>
                <Ionicons 
                  name={uploadSectionExpanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#666" 
                />
              </View>
            </TouchableOpacity>

            {/* ✅ COLLAPSIBLE CONTENT */}
            {uploadSectionExpanded && (
              <View style={styles.uploadContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="location-outline" size={14} color="#666" /> Select City
                  </Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedCity}
                      onValueChange={(itemValue) => setSelectedCity(itemValue)}
                      style={styles.picker}
                    >
                      {cities.map((city) => (
                        <Picker.Item key={city} label={city} value={city} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="calendar-outline" size={14} color="#666" /> Select Date
                  </Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color="#C62828" />
                    <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, date) => {
                        setShowDatePicker(Platform.OS === "ios");
                        if (date) setSelectedDate(date);
                      }}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
                  onPress={uploadPDF}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.uploadButtonText}>Uploading...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={20} color="#fff" />
                      <Text style={styles.uploadButtonText}>Upload PDF</Text>
                    </>
                  )}
                </TouchableOpacity>

                {message && (
                  <View style={[
                    styles.messageContainer,
                    message === "success" ? styles.messageSuccess : styles.messageError
                  ]}>
                    <Ionicons 
                      name={message === "success" ? "checkmark-circle" : "alert-circle"} 
                      size={20} 
                      color={message === "success" ? "#2e7d32" : "#d32f2f"}
                    />
                    <Text style={[
                      styles.messageText,
                      message === "success" ? styles.messageSuccessText : styles.messageErrorText
                    ]}>
                      {message === "success" 
                        ? `${uploadedFileName} uploaded successfully!` 
                        : message
                      }
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ✅ Skeleton or Content */}
        {initialLoading ? (
          <UploadSkeletonLoader />
        ) : (
          <>
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  placeholder="Search PDF by name..."
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>
                <Ionicons name="filter-outline" size={16} color="#333" /> Filter by City
              </Text>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filterCity === "All" && styles.filterChipActive
                  ]}
                  onPress={() => setFilterCity("All")}
                >
                  <Text style={[
                    styles.filterText,
                    filterCity === "All" && styles.filterTextActive
                  ]}>
                    All Cities
                  </Text>
                </TouchableOpacity>
                
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.filterChip,
                      filterCity === city && styles.filterChipActive
                    ]}
                    onPress={() => setFilterCity(city)}
                  >
                    <Text style={[
                      styles.filterText,
                      filterCity === city && styles.filterTextActive
                    ]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.listSection}>
              <Text style={styles.listTitle}>
                <Ionicons name="document-text-outline" size={18} color="#333" /> Available E-Papers ({filteredList.length})
              </Text>

              <FlatList
                data={filteredList}
                keyExtractor={(item) => item.path}
                renderItem={({ item }) => (
                  <View style={styles.pdfCard}>
                    <TouchableOpacity
                      onPress={() => setSelectedPdf(item.url)}
                      style={styles.pdfCardContent}
                    >
                      <View style={styles.pdfIcon}>
                        <Ionicons name="document" size={32} color="#C62828" />
                      </View>
                      
                      <View style={styles.pdfInfo}>
                        <Text style={styles.pdfName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.pdfMeta}>
                          <Ionicons name="location" size={12} color="#999" /> 
                          {" "}{item.name.split("-")[0] || "Unknown"}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    {role === "admin" && (
                      <TouchableOpacity
                        onPress={() => deletePDF(item.path, item.name)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No PDFs found</Text>
                    <Text style={styles.emptySubtext}>
                      {search 
                        ? "Try a different search term" 
                        : filterCity === "All"
                        ? "Upload your first e-paper"
                        : `No e-papers available for ${filterCity}`
                      }
                    </Text>
                  </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#C62828"]}
                    tintColor="#C62828"
                  />
                }
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // ✅ NEW COLLAPSIBLE STYLES
  uploadSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  uploadContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  // END NEW STYLES
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  messageSuccess: {
    backgroundColor: "#e8f5e9",
  },
  messageError: {
    backgroundColor: "#ffebee",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  messageSuccessText: {
    color: "#2e7d32",
  },
  messageErrorText: {
    color: "#d32f2f",
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  filterSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: "#C62828",
    borderColor: "#C62828",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  listSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pdfCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  pdfMeta: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
  },
});
