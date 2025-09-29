import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import PdfPreview from "../components/pdfPreview"; // spelling fix: components

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

        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const result = await supabase
              .storage
              .from("epaper-pdf")
              .createSignedUrl(file.name, 60);

            if (result.error) {
              console.log("Signed URL error:", result.error.message);
              return { name: file.name, url: "" };
            }

            return { name: file.name, url: result.data.signedUrl };
          })
        );
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
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        backgroundColor: "white",
      }}
    >
      {selectedPdf ? (
        <View style={{ flex: 1 }}>
          <PdfPreview pdfUrl={selectedPdf} goBack={() => setSelectedPdf(null)} />
        </View>
      ) : (
        <FlatList
          data={pdfFiles}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ padding: 20, borderBottomWidth: 1, borderColor: "#ccc" }}
              onPress={() => setSelectedPdf(item.url)} // navigation ki jagah yahan state set karo
            >
              <Text style={{ color: "blue", fontSize: 16 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
