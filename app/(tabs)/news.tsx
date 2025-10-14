import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";
import NewsDialog from "../components/NewsDialog";
import NewsListItem from "../components/NewsItem";
import NewsDetailView from "../components/NewsDetailView";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { NewsData } from "../../types/news";

const News = () => {
  const { user } = useAuth();
  const role: string = user?.user_metadata?.role || "guest";
  const email = user?.user_metadata?.email;
  const username = email?.split("@")[0] || "";

  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newsList, setNewsList] = useState<NewsData[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsData | null>(null);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching news:", error);
    } else {
      setNewsList(data || []);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleEdit = (item: NewsData) => {
    setSelectedNews(item);
    setIsEditMode(true);
  };

  const handleDelete = async (newsId: string, imagePath?: string | null, videoPath?: string | null) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this news?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (imagePath) {
                console.log("Deleting image from storage:", imagePath);
                const { error: imageDeleteError } = await supabase.storage
                  .from("news-media")
                  .remove([imagePath]);
                
                if (imageDeleteError) {
                  console.error("Image delete error:", imageDeleteError);
                }
              }

              if (videoPath) {
                console.log("Deleting video from storage:", videoPath);
                const { error: videoDeleteError } = await supabase.storage
                  .from("news-media")
                  .remove([videoPath]);
                
                if (videoDeleteError) {
                  console.error("Video delete error:", videoDeleteError);
                }
              }

              const { error: dbError } = await supabase
                .from("news")
                .delete()
                .eq("id", newsId);

              if (dbError) throw dbError;

              Alert.alert("Success", "News deleted successfully!");
              
              fetchNews();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Unknown error");
            }
          },
        },
      ]
    );
  };

  const handleNewsUpdate = async (updatedNews: NewsData & { image_path?: string | null; video_path?: string | null }) => {
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
      console.error("Update error:", error);
      // alert("Failed to update news.",error);
      return;
    }

    fetchNews();

    setSelectedNews(null);
    setIsEditMode(false);
  };

  const handleNewsSubmit = (insertedNews: NewsData) => {
    setNewsList((prev) => [insertedNews, ...prev]);
    setShowDialog(false);
  };

  const renderItem = ({ item }: { item: NewsData }) => (
    <TouchableOpacity onPress={() => setSelectedNews(item)}>
      <NewsListItem 
        item={item} 
        onEdit={handleEdit} 
        onDelete={() => handleDelete(item.id, item.image_path, item.video_path)}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!selectedNews && (
        <>
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome back, {username}</Text>
            <Text style={styles.date}>
              Today, {new Date().toLocaleDateString()}
            </Text>
          </View>

          {role === "admin" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDialog(true)}
            >
              <Text style={styles.addButtonText}>Add News</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={newsList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10 }}
          />
        </>
      )}

      {selectedNews && (
        <NewsDetailView
          news={selectedNews}
          onBack={() => {
            setSelectedNews(null);
            setIsEditMode(false);
          }}
          editable={isEditMode}
          onSave={handleNewsUpdate}
        />
      )}

      <NewsDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleNewsSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    backgroundColor: "#C62828",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  date: {
    fontSize: 14,
    color: "#eee",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#C62828",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default News;
