import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/supabaseClient";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";


const BUCKET = "epaper-pdf";

export default function PdfUploader() {
  // pdfList state
  const navigation = useNavigation();
  const [pdfList, setPdfList] = useState<{ name: string; url: string; path: string }[]>([]);

  const [search, setSearch] = useState("");
  const [cities] = useState<string[]>([
    "Bhopal",
    "Sehore",
    "Vidisha",
    "Rajgarh",
    "Narmadapuram",
  ]); // predefined cities
  const [selectedCity, setSelectedCity] = useState("Bhopal");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Upload PDF
  const uploadPDF = async () => {
    try {
      setMessage(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Error", "No file selected.");
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileNameFromPicker = result.assets[0].name;

      if (!fileUri || !fileNameFromPicker) {
        Alert.alert("Error", "Could not get file details.");
        return;
      }

      if (!selectedCity.trim()) {
        Alert.alert("Error", "Please select city.");
        return;
      }

      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      const fileName = `${selectedCity}-${day}-${month}-${year}.pdf`;

      setLoading(true);

      // Read file as base64 → Uint8Array
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Upload to Supabase
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, byteArray, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        setMessage("❌ Upload Failed: " + error.message);
      } else {
        setMessage("✅ PDF uploaded successfully!");
        fetchPDFs();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("⚠️ Something went wrong during upload.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch PDFs
  const fetchPDFs = async () => {
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100,
      offset: 0,
    });
    if (error) {
      console.error(error);
      return;
    }

    const filesWithUrls = data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(file.name);

      return {
        name: file.name,
        url: urlData.publicUrl,
        path: file.name, // 👈 अब path भी आ जाएगा
      };
    });

    setPdfList(filesWithUrls);
  };


  // Delete PDF
  const deletePDF = async (filePath: string) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete ${filePath}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.storage
              .from(BUCKET)
              .remove([filePath]); // <- ab exact path delete hoga

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              Alert.alert("Deleted", "PDF deleted successfully!");
              fetchPDFs();
            }
          } catch (err) {
            console.error("Delete Error:", err);
            Alert.alert("Error", "Something went wrong while deleting.");
          }
        },
      },
    ]);
  };


  // Open PDF in browser / viewer
  const openPDF = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url); // OS native PDF viewer open होगा
      } else {
        Alert.alert("Error", "Cannot open PDF file");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to open PDF");
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const filteredList = pdfList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // 👈 Android fix
      backgroundColor: "#fff", // ताकि white रहे
      paddingHorizontal: 20,
    }}>
      {/* City Picker */}
      <Text>Select City:</Text>
      <Picker
        selectedValue={selectedCity}
        onValueChange={(value) => setSelectedCity(value)}
        style={{ marginVertical: 10 }}
      >
        {cities.map((city) => (
          <Picker.Item key={city} label={city} value={city} />
        ))}
      </Picker>

      {/* Date Picker */}
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

      {/* Upload Button */}
      {loading ? (
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 5 }}>Uploading...</Text>
        </View>
      ) : (
        <Button title="Upload PDF" onPress={uploadPDF} />
      )}

      {/* Success/Error Message */}
      {message && (
        <Text style={{ marginVertical: 10, textAlign: "center" }}>{message}</Text>
      )}

      {/* Search */}
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

      {/* PDF List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.name}
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
            <TouchableOpacity onPress={() => openPDF(item.url)} style={{ flex: 1 }}>
              <Text style={{ color: "blue" }}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deletePDF(item.path)}>
              <Text style={{ color: "red" }}>🗑 Delete</Text>
            </TouchableOpacity>


          </View>
        )}
      />
    </SafeAreaView>
  );
}
