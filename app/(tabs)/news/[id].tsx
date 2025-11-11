// 📄 File: app/(tabs)/news/[id].tsx
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, View, Text } from "react-native";

import { supabase } from "@/lib/supabaseClient";
import NewsDetailView from "../../components/NewsDetailView";
import { NewsData } from "../../../types/news";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching news detail:", error);
      } else {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNewsDetail();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#C62828" />
      </SafeAreaView>
    );
  }

  if (!news) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View>
          <Text style={{ color: "#666", fontSize: 16 }}>News not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NewsDetailView
      news={news}
      onBack={() => router.back()}
      editable={false}
      onSave={() => {}}
    />
  );
}
