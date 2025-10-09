import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../providers/AuthProvider";
import PdfPreview from "../components/pdfPreview";

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
  //  console.log(role) 

  // Separate state for showing PDF preview
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const fetchPDFs = useCallback(async () => {
    try {
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
    }
  }, []);

  useEffect(() => {
    fetchPDFs();
  }, [fetchPDFs]);

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

      // Generate signed upload URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(fileName);

      if (urlError || !signedUrlData) {
        setMessage("Failed to get upload URL: " + urlError?.message);
        setLoading(false);
        return;
      }

      const signedUrl = signedUrlData.signedUrl;

      // Upload file using FileSystem uploadAsync
      const uploadResult = await FileSystem.uploadAsync(signedUrl, fileUri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (uploadResult.status === 200) {
        setMessage("✅ PDF uploaded successfully!");
        setUploadedFileName(fileName);
        fetchPDFs();
      } else {
        setMessage(`Upload failed with status: ${uploadResult.status}`);
        console.error("Upload result:", uploadResult);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setMessage("⚠️ Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedDate, fetchPDFs]);

  const deletePDF = useCallback(
    (filePath: string) => {
      Alert.alert("Confirm Delete", `Are you sure you want to delete ${filePath}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
              if (error) Alert.alert("Error", error.message);
              else {
                Alert.alert("Deleted", "PDF deleted successfully!");
                fetchPDFs();
              }
            } catch (err) {
              console.error("Delete PDF error:", err);
              Alert.alert("Error", "Something went wrong while deleting.");
            }
          },
        },
      ]);
    },
    [fetchPDFs]
  );

  const filteredList = pdfList.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  // If a PDF is selected for preview, show the PdfPreview component
  if (selectedPdf) {
    return <PdfPreview pdfUrl={selectedPdf} goBack={() => setSelectedPdf(null)} />;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
      }}
    >
      {/* Admin-only upload section */}
      {role === "admin" && (
        <>
          <Text>Select City:</Text>
          <Picker selectedValue={selectedCity} onValueChange={(itemValue) => setSelectedCity(itemValue)} style={{ marginVertical: 10 }}>
            {cities.map((city) => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>

          <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
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

          {loading ? (
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <ActivityIndicator size="large" color="blue" />
              <Text style={{ marginTop: 5 }}>Uploading...</Text>
            </View>
          ) : (
            <Button title="Upload PDF" onPress={uploadPDF} />
          )}

          {message && <Text style={{ marginVertical: 10, textAlign: "center" }}>{message}</Text>}

          {uploadedFileName && (
            <Text style={{ marginVertical: 8, fontWeight: "bold", color: "green", textAlign: "center" }}>
              📄 {uploadedFileName} added successfully!
            </Text>
          )}
        </>
      )}

      <TextInput
        placeholder="🔍 Search PDF by name..."
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 8,
          marginVertical: 10,
          borderRadius: 5,
        }}
      />

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <TouchableOpacity onPress={() => setSelectedPdf(item.url)} style={{ flex: 1 }}>
              <Text style={{ color: "blue" }}>{item.name}</Text>
            </TouchableOpacity>

            {/* Show delete button only for admin */}
            {role === "admin" && (
              <TouchableOpacity onPress={() => deletePDF(item.path)}>
                <Text style={{ color: "red" }}>🗑 Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
