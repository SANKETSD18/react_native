// 📄 File: app/(tabs)/news/[id].tsx
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, View, Text } from "react-native";

import { supabase } from "@/lib/supabaseClient";
import NewsDetailView from "../../components/NewsDetailView";
import { NewsData } from "../../../types/news";

export default function NewsDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit: string }>();
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const isEditMode = edit === "true";

  const handleSave = async (
    updatedNews: NewsData & {
      image_path?: string | null;
      video_path?: string | null;
    }
  ) => {
    const { error } = await supabase
      .from("news")
      .update({
        title: updatedNews.title,
        description: updatedNews.description,
        image_url: updatedNews.image_url,
        video_url: updatedNews.video_url,
        image_path: updatedNews.image_path,
        video_path: updatedNews.video_path,
      })
      .eq("id", updatedNews.id);

    if (error) {
      console.log("Update error:", error);
      return;
    }

    // router.replace("/(tabs)/news");
    router.replace("/news");
  };

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
      onBack={() => router.replace("/news")}
      editable={isEditMode}
      onSave={handleSave}
    />
  );
}
