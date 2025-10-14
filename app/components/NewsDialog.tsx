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
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabaseClient";
import { Picker } from "@react-native-picker/picker";
import { NewsData } from "../../types/news" // ✅ Import from news.tsx

// ✅ Remove local type definitions - use imported NewsData instead

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewsData) => void; // ✅ Use imported NewsData
};

const BUCKET = "news-media";

const NewsDialog: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Get file extension from URI
  const getFileExtension = (uri: string): string => {
    const lastDot = uri.lastIndexOf('.');
    if (lastDot === -1) return '.jpg';
    return uri.substring(lastDot);
  };

  const uploadFileToBucket = async (
    uri: string,
    bucket: string,
    path: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

      const byteArray = Uint8Array.from(
        atob(base64),
        (c) => c.charCodeAt(0)
      );

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, byteArray, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

      return urlData.publicUrl;
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

  const pickAndUploadMedia = async () => {
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
    if (!title.trim() || !description.trim() || !category) {
      Alert.alert("Validation Error", "Please fill all required fields.");
      return;
    }

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
        const fileName = picked.type === "image" 
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
          <ScrollView>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ height: 50, width: "100%" }}
            >
              <Picker.Item label="India" value="India" />
              <Picker.Item label="International" value="International" />
              <Picker.Item label="Sport" value="Sport" />
              <Picker.Item label="Entertainment" value="Entertainment" />
            </Picker>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickAndUploadMedia}
              disabled={uploading}
            >
              <Text style={{ color: uploading ? "gray" : "white" }}>
                {uploading ? "Uploading..." : "Upload File (Photo/Video)"}
              </Text>
            </TouchableOpacity>

            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 100, height: 60, marginTop: 8 }}
              />
            )}
            {videoUrl && (
              <Text style={{ marginTop: 8, textAlign: "center" }}>
                Video Uploaded
              </Text>
            )}
            {fileName && (
              <Text style={{ marginTop: 8, textAlign: "center", color: "#555" }}>
                Uploaded File: {fileName}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.submitButton, uploading && { backgroundColor: "gray" }]}
              onPress={handleSubmit}
              disabled={uploading || !title.trim()}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>

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
    borderRadius: 12,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  uploadButton: {
    backgroundColor: "#C62828",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: "#C62828",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    alignItems: "center",
  },
  cancelText: {
    color: "#C62828",
    fontWeight: "600",
  },
});

export default NewsDialog;
