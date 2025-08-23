import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, Linking, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/supabaseClient";

export default function UploadPdf() {
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  const pickAndUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      console.log("Selected File:", file);

      setLoading(true);

      const fileName = `${Date.now()}_${file.name}`;
      let fileData: Blob | Uint8Array;

      if (Platform.OS === "web") {
        // Web: base64 को Uint8Array में बदलो
        const base64 = file.uri.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        fileData = bytes;
      } else {
        // Native: fetch करके blob लो
        const response = await fetch(file.uri);
        fileData = await response.blob();
      }

      // Upload to Supabase
      const { error } = await supabase.storage
        .from("epaper-pdf")
        .upload(fileName, fileData, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        setLoading(false);
        console.error("Upload Error:", error.message);
        return;
      }

      // Public URL nikalna
      const { data: urlData } = supabase.storage
        .from("epaper-pdf")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // DB me insert
      const { error: dbError } = await supabase
        .from("epapers")
        .insert([{ title: file.name, pdf_url: publicUrl }]);

      setLoading(false);

      if (dbError) {
        console.error("DB Error:", dbError.message);
      } else {
        setUploadedFile({ name: file.name, url: publicUrl }); // ✅ state update
      }
    } catch (err: any) {
      setLoading(false);
      console.error("Upload Error:", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>📄 Upload PDF</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Choose & Upload PDF" onPress={pickAndUploadPdf} />
      )}

      {/* ✅ Upload hone ke baad info show karo */}
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
