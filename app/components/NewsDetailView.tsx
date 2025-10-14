import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Video from "react-native-video";
import { decode as decodeB64 } from "base64-arraybuffer";
import { supabase } from "../../lib/supabaseClient";
import { NewsData } from "../(tabs)/news";

type Props = {
  news: NewsData;
  onBack: () => void;
  editable?: boolean;
  onSave: (data: NewsData & { image_path?: string | null; video_path?: string | null }) => void;
  
};

type UploadResult = { publicUrl: string; path: string };

const BUCKET = "news-media";

const NewsDetailView: React.FC<Props> = ({ news, onBack, editable = false, onSave }) => {
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(news.image_url ?? null);
  const [serverVideoUrl, setServerVideoUrl] = useState<string | null>(news.video_url ?? null);
  const [serverImagePath, setServerImagePath] = useState<string | null>((news as any)?.image_path ?? null);
  const [serverVideoPath, setServerVideoPath] = useState<string | null>((news as any)?.video_path ?? null);

  const [localTitle, setLocalTitle] = useState(news.title);
  const [localDesc, setLocalDesc] = useState(news.description);

  const [pendingImage, setPendingImage] = useState<{ uri: string; mime: string } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ uri: string; mime: string } | null>(null);

  const [isWorking, setIsWorking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
    if (lastDot === -1) return '';
    return uri.substring(lastDot); // Returns ".jpg", ".mp4", etc.
  };

  // Helper: Generate unique filename with timestamp
  const generateFileName = (uri: string): string => {
    const extension = getFileExtension(uri);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${randomStr}${extension}`;
  };

  // Helper: Generate path as date/newsid/filename
  const generateMediaPath = (uri: string, type: 'image' | 'video', newsId: string, createdAt: string): string => {
  const date = formatDate(createdAt);
  const extension = getFileExtension(uri);
  const fileName = `${type}${extension}`; // "image.jpg" or "video.mp4"
  return `${date}/${newsId}/${fileName}`; // "2025-10-14/abc-123/image.jpg"
};

  const deleteFromBucket = async (path: string | null) => {
    console.log("Deleting from bucket:", path);
    if (!path) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("Delete error:", error);
      throw error;
    }
    console.log("Successfully deleted:", path);
  };

  const uploadFileToBucket = async (uri: string, path: string, contentType: string): Promise<UploadResult> => {
  let fetchUri = uri;
  if (Platform.OS === "android" && !fetchUri.startsWith("file://")) fetchUri = "file://" + fetchUri;
  const base64 = await FileSystem.readAsStringAsync(fetchUri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = decodeB64(base64);

  // ✅ यहाँ upsert: true add करो
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { 
    contentType, 
    upsert: true  // ✅ Change: false से true करो
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");
  console.log("New media public URL:", data.publicUrl);
  console.log("New media path:", path);
  return { publicUrl: data.publicUrl, path };
};


  const selectImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission required", "Media library access is needed");
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (pick.canceled || !pick.assets?.length) return;
    const asset = pick.assets[0];
    setPendingImage({ uri: asset.uri, mime: asset.mimeType || "image/jpeg" });
    setPendingVideo(null);
  };

  const selectVideo = async () => {
    const pick = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
    if (!pick.assets?.length) return;
    const asset = pick.assets[0];
    setPendingVideo({ uri: asset.uri, mime: asset.mimeType || "video/mp4" });
    setPendingImage(null);
  };

 

const handleSave = async () => {
  try {
    setIsWorking(true);

    let newImageUrl: string | null = serverImageUrl;
    let newImagePath: string | null = serverImagePath;
    let newVideoUrl: string | null = serverVideoUrl;
    let newVideoPath: string | null = serverVideoPath;

    if (pendingImage) {
      const date = formatDate((news as any).created_at || new Date().toISOString());
      const extension = getFileExtension(pendingImage.uri);
      const timestamp = Date.now(); // ✅ For unique filename
      const fileName = `image-${timestamp}${extension}`; // ✅ Unique: image-1728897456789.jpg
      const path = `${date}/${news.id}/${fileName}`;

      console.log("Using path for image upload:", path);

      // Delete ALL existing media first
      if (serverImagePath) {
        setStatusMsg("Deleting previous image...");
        await deleteFromBucket(serverImagePath);
      }
      if (serverVideoPath) {
        setStatusMsg("Deleting previous video...");
        await deleteFromBucket(serverVideoPath);
      }

      setStatusMsg("Uploading image...");
      const uploaded = await uploadFileToBucket(pendingImage.uri, path, pendingImage.mime);

      newImageUrl = uploaded.publicUrl;
      newImagePath = uploaded.path;
      newVideoUrl = null;
      newVideoPath = null;
    }

    if (pendingVideo) {
      const date = formatDate((news as any).created_at || new Date().toISOString());
      const extension = getFileExtension(pendingVideo.uri);
      const timestamp = Date.now(); // ✅ For unique filename
      const fileName = `video-${timestamp}${extension}`; // ✅ Unique: video-1728897456789.mp4
      const path = `${date}/${news.id}/${fileName}`;

      console.log("Using path for video upload:", path);

      if (serverImagePath) {
        setStatusMsg("Deleting previous image...");
        await deleteFromBucket(serverImagePath);
      }
      if (serverVideoPath) {
        setStatusMsg("Deleting previous video...");
        await deleteFromBucket(serverVideoPath);
      }

      setStatusMsg("Uploading video...");
      const uploaded = await uploadFileToBucket(pendingVideo.uri, path, pendingVideo.mime);

      newVideoUrl = uploaded.publicUrl;
      newVideoPath = uploaded.path;
      newImageUrl = null;
      newImagePath = null;
    }

    setServerImageUrl(newImageUrl);
    setServerVideoUrl(newVideoUrl);
    setServerImagePath(newImagePath);
    setServerVideoPath(newVideoPath);

    const payload: any = {
      ...news,
      title: localTitle,
      description: localDesc,
      image_url: newImageUrl,
      video_url: newVideoUrl,
      image_path: newImagePath ?? null,
      video_path: newVideoPath ?? null,
    };

    onSave(payload);

    setPendingImage(null);
    setPendingVideo(null);
    setStatusMsg("Saved successfully.");
  } catch (e: any) {
    Alert.alert("Save failed", e?.message ?? "Unknown error");
  } finally {
    setTimeout(() => setStatusMsg(null), 1200);
    setIsWorking(false);
  }
};



  const handleCancel = () => {
    setPendingImage(null);
    setPendingVideo(null);
    setLocalTitle(news.title);
    setLocalDesc(news.description);
    setStatusMsg("Changes discarded.");
    setTimeout(() => setStatusMsg(null), 1000);
  };

  const previewImage = pendingImage ? { uri: pendingImage.uri } : serverImageUrl ? { uri: serverImageUrl } : null;
  const previewVideo = !pendingImage && (pendingVideo ? pendingVideo.uri : serverVideoUrl || null);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {editable ? (
        <>
          {isWorking ? (
            <Text style={{ color: "#C62828", marginBottom: 8 }}>{statusMsg ?? "Working..."}</Text>
          ) : statusMsg ? (
            <Text style={{ color: "#2e7d32", marginBottom: 8 }}>{statusMsg}</Text>
          ) : (
            <Text style={{ color: "#888", marginBottom: 6 }}>
              Selecting image or video will only stage changes; nothing uploads until Save. One media type is kept.
            </Text>
          )}

          <TouchableOpacity onPress={selectImage} style={{ marginBottom: 12 }}>
            <Text style={{ color: "#C62828" }}>Choose Image</Text>
          </TouchableOpacity>

          {previewImage ? <Image source={previewImage} style={styles.media} resizeMode="contain" /> : null}

          <TouchableOpacity onPress={selectVideo} style={{ marginVertical: 12 }}>
            <Text style={{ color: "#C62828" }}>Choose Video</Text>
          </TouchableOpacity>

          {!previewImage && previewVideo ? (
            <Video source={{ uri: previewVideo }} style={styles.media} controls resizeMode="contain" />
          ) : null}

          <TextInput style={styles.titleInput} value={localTitle} onChangeText={setLocalTitle} placeholder="Title" />
          <TextInput
            style={styles.descInput}
            value={localDesc}
            onChangeText={setLocalDesc}
            placeholder="Description"
            multiline
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 20 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Button title="Save" color="#C62828" onPress={handleSave} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" color="#888" onPress={handleCancel} />
            </View>
          </View>
        </>
      ) : (
        <>
          {serverImageUrl ? (
            <Image source={{ uri: serverImageUrl }} style={styles.media} resizeMode="contain" />
          ) : serverVideoUrl ? (
            <Video source={{ uri: serverVideoUrl }} style={styles.media} controls resizeMode="contain" />
          ) : null}
          <Text style={styles.title}>{news.title}</Text>
          <Text style={styles.description}>{news.description}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  backButton: { marginBottom: 10 },
  backText: { color: "blue", fontSize: 18 },
  media: { width: "100%", height: 220, borderRadius: 8 },
  title: { fontWeight: "bold", fontSize: 22, marginTop: 15 },
  description: { marginTop: 10, fontSize: 16, color: "#555" },
  titleInput: {
    fontWeight: "bold",
    fontSize: 22,
    marginTop: 15,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  descInput: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
});

export default NewsDetailView;
