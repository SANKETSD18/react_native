import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, Linking, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/supabaseClient";

export default function upload() {
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const pickAndUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setLoading(true);

      const fileName = `${Date.now()}_${asset.name ?? "document.pdf"}`;

      let fileData: Blob;
      if (Platform.OS === "web" && (asset as any).file) {
        fileData = (asset as any).file as File;
      } else {
        const response = await fetch(asset.uri);
        fileData = await response.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from("epaper-pdf")
        .upload(fileName, fileData, {
          contentType: asset.mimeType ?? "application/pdf",
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message ?? "Upload failed");

      const { data: urlData } = supabase.storage.from("epaper-pdf").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // Insert with date
      const { error: dbError } = await supabase
        .from("epapers")
        .insert([
          {
            title: asset.name ?? fileName,
            pdf_url: publicUrl,
            date: selectedDate.toISOString().split("T")[0], // YYYY-MM-DD
          },
        ]);

      if (dbError) console.log("DB Insert Error:", dbError);

      setUploadedFile({ name: asset.name ?? fileName, url: publicUrl });
    } catch (err: any) {
      alert(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>📄 Upload PDF</Text>

      <Button title="Pick Date" onPress={() => setShowPicker(true)} />
      <Text style={{ marginVertical: 10 }}>
        Selected Date: {selectedDate.toISOString().split("T")[0]}
      </Text>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (date) setSelectedDate(date);
            setShowPicker(false);
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Choose & Upload PDF" onPress={pickAndUploadPdf} />
      )}

      {uploadedFile && (
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>
            ✅ Uploaded: {uploadedFile.name}
          </Text>
          <Button title="View PDF" onPress={() => Linking.openURL(uploadedFile.url)} />
        </View>
      )}
    </View>
  );
}
