import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import PdfPreview from "./pdfPreview"; // PdfPreview.tsx ka path check karo
import { supabase } from "@/supabaseClient";

export default function PdfListScreen() {
  const [pdfFiles, setPdfFiles] = useState<{ name: string; url: string }[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const { data, error } = await supabase.storage.from("epaper-pdf").list();

        if (error) {
          console.log("Supabase Error:", error.message);
          setLoading(false);
          return;
        }

        if (!Array.isArray(data)) {
          console.log("Invalid data:", data);
          setLoading(false);
          return;
        }

        const filesWithUrls = data.map((file) => ({
          name: file.name,
          url: `https://kenepxfwouuyhzpahsqk.supabase.co/storage/v1/object/public/epaper-pdf/${file.name}`,
        }));

        setPdfFiles(filesWithUrls);
      } catch (err) {
        console.log("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {selectedPdf ? (
        <PdfPreview pdfUrl={selectedPdf} goBack={() => setSelectedPdf(null)} />
      ) : (
        <FlatList
          data={pdfFiles}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ padding: 20, borderBottomWidth: 1 }}
              onPress={() => setSelectedPdf(item.url)}
            >
              <Text style={{ color: "blue", fontSize: 16 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
