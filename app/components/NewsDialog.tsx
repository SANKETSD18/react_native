import { supabase } from "@/lib/supabaseClient";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NewsData } from "../../types/news";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewsData) => void; // ✅ Use imported NewsData
};

const BUCKET = "news-media";

const NewsDialog: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  const { user } = useAuth();
  const role = user?.user_metadata?.role || "guest";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("India");

  const [picked, setPicked] = useState<{
    uri: string;
    type: "image" | "video";
    fileName: string;
    contentType: string;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Helper: Format date as YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper: Get file extension from URI
  const getFileExtension = (uri: string): string => {
    const lastDot = uri.lastIndexOf(".");
    if (lastDot === -1) return ".jpg";
    return uri.substring(lastDot);
  };

  const uploadFileToBucket = async (
    uri: string,
    bucket: string,
    path: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Media library access is needed");
        return null;
      }

      let fetchUri = uri;
      if (Platform.OS === "android" && !fetchUri.startsWith("file://")) {
        fetchUri = "file://" + fetchUri;
      }

      const base64 = await FileSystem.readAsStringAsync(fetchUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, byteArray, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      return urlData.publicUrl;
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

   const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        uri = "file://" + uri;
      }

      const fileNameLocal = asset.fileName || `${Date.now()}.jpg`;

      setFileName(fileNameLocal);
      setImageUrl(null);
      setVideoUrl(null);

      setPicked({
        uri,
        type: "image",
        fileName: fileNameLocal,
        contentType: "image/jpeg",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        uri = "file://" + uri;
      }

      const fileNameLocal = asset.fileName || `${Date.now()}.mp4`;

      setFileName(fileNameLocal);
      setImageUrl(null);
      setVideoUrl(null);

      setPicked({
        uri,
        type: "video",
        fileName: fileNameLocal,
        contentType: "video/mp4",
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Remove selected media
  const removeMedia = () => {
    setPicked(null);
    setFileName(null);
    setImageUrl(null);
    setVideoUrl(null);
  };const pickAndUploadMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        uri = "file://" + uri;
      }

      const fileExt = asset.type === "image" ? "jpg" : "mp4";
      const fileNameLocal = asset.fileName || `${Date.now()}.${fileExt}`;

      setFileName(fileNameLocal);
      setImageUrl(null);
      setVideoUrl(null);

      setPicked({
        uri,
        type: asset.type === "image" ? "image" : "video",
        fileName: fileNameLocal,
        contentType: asset.type === "image" ? "image/jpeg" : "video/mp4",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = async () => {
    setTitle("");
    setDescription("");
    setCategory("India");
    setImageUrl(null);
    setVideoUrl(null);
    setFileName(null);
    setPicked(null);
    onClose();
  };

  const handleSubmit = async () => {
    console.log("🔵 Submit clicked");
    console.log("🔵 Role:", role);
    console.log("🔵 Title:", title.trim());
    console.log("🔵 Description:", description.trim());
    console.log("🔵 Category:", category);

    if (role !== "admin") {
      console.log("🔴 Not admin");
      onClose();
      setTimeout(() => {
        console.log("🔴 Showing unauthorized alert");
        Alert.alert("Unauthorized", "Only admins can add news");
      }, 100);
      return;
    }

    if (!title.trim() || !description.trim() || !category) {
      console.log("🔴 Validation failed");
      setTimeout(() => {
        console.log("🔴 Showing validation alert");
        Alert.alert("Validation Error", "Please fill all required fields.");
      }, 100);
      return;
    }

    console.log("✅ Validation passed, starting upload...");

    setUploading(true);

    try {
      const { data: insertedNews, error: insertError } = await supabase
        .from("news")
        .insert([{ title, description, category }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newsId = insertedNews.id;
      const createdAt = insertedNews.created_at;

      let publicURL: string | null = null;
      let filePath: string | null = null;

      if (picked) {
        const date = formatDate(createdAt);
        const extension = getFileExtension(picked.uri);
        const timestamp = Date.now();
        const fileName =
          picked.type === "image"
            ? `image-${timestamp}${extension}`
            : `video-${timestamp}${extension}`;

        filePath = `${date}/${newsId}/${fileName}`;
        console.log("Uploading to path:", filePath);

        publicURL = await uploadFileToBucket(
          picked.uri,
          BUCKET,
          filePath,
          picked.contentType
        );
      }

      const updatePayload: any = {};
      if (picked) {
        if (picked.type === "image") {
          updatePayload.image_url = publicURL;
          updatePayload.image_path = filePath;
          updatePayload.video_url = null;
          updatePayload.video_path = null;
          setImageUrl(publicURL);
          setVideoUrl(null);
        } else {
          updatePayload.video_url = publicURL;
          updatePayload.video_path = filePath;
          updatePayload.image_url = null;
          updatePayload.image_path = null;
          setVideoUrl(publicURL);
          setImageUrl(null);
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from("news")
          .update(updatePayload)
          .eq("id", newsId);
        if (updateError) throw updateError;
      }

      Alert.alert("Success", "News added successfully!");

      // ✅ Create complete NewsData object
      const newNewsData: NewsData = {
        id: newsId,
        title,
        description,
        category,
        image_url: updatePayload.image_url || null,
        video_url: updatePayload.video_url || null,
        image_path: updatePayload.image_path || null,
        video_path: updatePayload.video_path || null,
        created_at: createdAt,
      };

      onSubmit(newNewsData);

      resetForm();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.dialog}>
          <Text style={styles.header}>Add News</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            {/* Description Input */}
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            {/* Category Picker */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                <Picker.Item label="🇮🇳 India" value="India" />
                <Picker.Item label="🌍 International" value="International" />
                <Picker.Item label="⚽ Sport" value="Sport" />
                <Picker.Item label="🎬 Entertainment" value="Entertainment" />
              </Picker>
            </View>

            {/* ✅ NEW: Beautiful Media Upload Section */}
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Add Media (Optional)</Text>
              
              {/* Media Buttons Row */}
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Ionicons name="image" size={24} color="#C62828" />
                  <Text style={styles.mediaButtonText}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={pickVideo}
                  disabled={uploading}
                >
                  <Ionicons name="videocam" size={24} color="#C62828" />
                  <Text style={styles.mediaButtonText}>Video</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Media Preview */}
              {picked && (
                <View style={styles.mediaPreview}>
                  {picked.type === "image" && (
                    <Image
                      source={{ uri: picked.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  {picked.type === "video" && (
                    <View style={styles.videoPreview}>
                      <Ionicons name="play-circle" size={50} color="#C62828" />
                      <Text style={styles.videoText}>Video Selected</Text>
                    </View>
                  )}

                  {/* File Name & Remove Button */}
                  <View style={styles.mediaInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={removeMedia}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (uploading || !title.trim() || !description.trim()) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={uploading || !title.trim() || !description.trim()}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <Text style={styles.submitText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Submit News</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "85%",
    borderRadius: 16,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  
  // ✅ NEW: Media Section Styles
  mediaSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  mediaButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#C62828",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  mediaButtonText: {
    color: "#C62828",
    fontSize: 15,
    fontWeight: "600",
  },
  mediaPreview: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  videoPreview: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  videoText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  mediaInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff",
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: "#555",
  },
  removeButton: {
    padding: 4,
  },

  submitButton: {
    backgroundColor: "#C62828",
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default NewsDialog;





