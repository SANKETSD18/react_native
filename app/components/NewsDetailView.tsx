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
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Video from "react-native-video";
import { decode as decodeB64 } from "base64-arraybuffer";
import { supabase } from "../../lib/supabaseClient";
import { NewsData } from "../../types/news";
import Ionicons from "@expo/vector-icons/Ionicons"; // ✅ Add this import
import { Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  news: NewsData;
  onBack: () => void;
  editable?: boolean;
  onSave: (
    data: NewsData & { image_path?: string | null; video_path?: string | null }
  ) => void;
};

type UploadResult = { publicUrl: string; path: string };

const BUCKET = "news-media";

const NewsDetailView: React.FC<Props> = ({
  news,
  onBack,
  editable = false,
  onSave,
}) => {
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(
    news.image_url ?? null
  );
  const [serverVideoUrl, setServerVideoUrl] = useState<string | null>(
    news.video_url ?? null
  );
  const [serverImagePath, setServerImagePath] = useState<string | null>(
    (news as any)?.image_path ?? null
  );
  const [serverVideoPath, setServerVideoPath] = useState<string | null>(
    (news as any)?.video_path ?? null
  );

  const [localTitle, setLocalTitle] = useState(news.title);
  const [localDesc, setLocalDesc] = useState(news.description);

  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    mime: string;
  } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{
    uri: string;
    mime: string;
  } | null>(null);

  const [isWorking, setIsWorking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Helper functions remain same
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getFileExtension = (uri: string): string => {
    const lastDot = uri.lastIndexOf(".");
    if (lastDot === -1) return "";
    return uri.substring(lastDot);
  };

  const generateMediaPath = (
    uri: string,
    type: "image" | "video",
    newsId: string,
    createdAt: string
  ): string => {
    const date = formatDate(createdAt);
    const extension = getFileExtension(uri);
    const fileName = `${type}${extension}`;
    return `${date}/${newsId}/${fileName}`;
  };

  const deleteFromBucket = async (path: string | null) => {
    if (!path) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const uploadFileToBucket = async (
    uri: string,
    path: string,
    contentType: string
  ): Promise<UploadResult> => {
    let fetchUri = uri;
    if (Platform.OS === "android" && !fetchUri.startsWith("file://"))
      fetchUri = "file://" + fetchUri;
    const base64 = await FileSystem.readAsStringAsync(fetchUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = decodeB64(base64);

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Failed to get public URL");
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
    const pick = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
    });
    if (!pick.assets?.length) return;
    const asset = pick.assets[0];
    setPendingVideo({ uri: asset.uri, mime: asset.mimeType || "video/mp4" });
    setPendingImage(null);
  };

  const removeMedia = () => {
    setPendingImage(null);
    setPendingVideo(null);
  };

  const handleSave = async () => {
    try {
      setIsWorking(true);

      let newImageUrl: string | null = serverImageUrl;
      let newImagePath: string | null = serverImagePath;
      let newVideoUrl: string | null = serverVideoUrl;
      let newVideoPath: string | null = serverVideoPath;

      if (pendingImage) {
        const date = formatDate(
          (news as any).created_at || new Date().toISOString()
        );
        const extension = getFileExtension(pendingImage.uri);
        const timestamp = Date.now();
        const fileName = `image-${timestamp}${extension}`;
        const path = `${date}/${news.id}/${fileName}`;

        if (serverImagePath) {
          setStatusMsg("Deleting previous image...");
          await deleteFromBucket(serverImagePath);
        }
        if (serverVideoPath) {
          setStatusMsg("Deleting previous video...");
          await deleteFromBucket(serverVideoPath);
        }

        setStatusMsg("Uploading image...");
        const uploaded = await uploadFileToBucket(
          pendingImage.uri,
          path,
          pendingImage.mime
        );

        newImageUrl = uploaded.publicUrl;
        newImagePath = uploaded.path;
        newVideoUrl = null;
        newVideoPath = null;
      }

      if (pendingVideo) {
        const date = formatDate(
          (news as any).created_at || new Date().toISOString()
        );
        const extension = getFileExtension(pendingVideo.uri);
        const timestamp = Date.now();
        const fileName = `video-${timestamp}${extension}`;
        const path = `${date}/${news.id}/${fileName}`;

        if (serverImagePath) {
          setStatusMsg("Deleting previous image...");
          await deleteFromBucket(serverImagePath);
        }
        if (serverVideoPath) {
          setStatusMsg("Deleting previous video...");
          await deleteFromBucket(serverVideoPath);
        }

        setStatusMsg("Uploading video...");
        const uploaded = await uploadFileToBucket(
          pendingVideo.uri,
          path,
          pendingVideo.mime
        );

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
      setStatusMsg("Saved successfully!");

      setTimeout(() => setStatusMsg(null), 2000);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleCancel = () => {
    setPendingImage(null);
    setPendingVideo(null);
    setLocalTitle(news.title);
    setLocalDesc(news.description);
  };

  const previewImage = pendingImage
    ? { uri: pendingImage.uri }
    : serverImageUrl
    ? { uri: serverImageUrl }
    : null;
  const previewVideo =
    !pendingImage && (pendingVideo ? pendingVideo.uri : serverVideoUrl || null);

  const handleShare = async () => {
    try {
      // यहाँ पर link generate करो (जैसे news id से)
      const newsLink = `pradesh-times://news/${news.id}`;

      // अब share API को call करो
      await Share.share({
        message: `📰 ${news.title}\n\n${news.description}\n\nRead full news here:\n${newsLink}`,
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Unable to share this news right now.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <View style={styles.container}>
      {/* ✅ Modern Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{  alignItems: "center" }}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            {/* <Text style={styles.shareButtonText}>Share News</Text> */}
          </TouchableOpacity>
        </View>

        {editable && (
          <View style={styles.editBadge}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editBadgeText}>Edit Mode</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {editable ? (
          <>
            {/* ✅ Status Message */}
            {isWorking && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#C62828" />
                <Text style={styles.statusWorking}>
                  {statusMsg ?? "Working..."}
                </Text>
              </View>
            )}

            {!isWorking && statusMsg && (
              <View style={[styles.statusContainer, styles.statusSuccess]}>
                <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                <Text style={styles.statusSuccessText}>{statusMsg}</Text>
              </View>
            )}

            {/* ✅ Media Section */}
            <View style={styles.mediaSection}>
              <Text style={styles.sectionTitle}>Media</Text>

              {/* Media Buttons */}
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  onPress={selectImage}
                  style={styles.mediaButton}
                  disabled={isWorking}
                >
                  <Ionicons name="image" size={24} color="#C62828" />
                  <Text style={styles.mediaButtonText}>Choose Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={selectVideo}
                  style={styles.mediaButton}
                  disabled={isWorking}
                >
                  <Ionicons name="videocam" size={24} color="#C62828" />
                  <Text style={styles.mediaButtonText}>Choose Video</Text>
                </TouchableOpacity>
              </View>

              {/* Media Preview */}
              {(previewImage || previewVideo) && (
                <View style={styles.mediaPreviewContainer}>
                  {previewImage && (
                    <Image
                      source={previewImage}
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  )}

                  {!previewImage && previewVideo && (
                    <View style={styles.videoPreviewWrapper}>
                      <Video
                        source={{ uri: previewVideo }}
                        style={styles.mediaPreview}
                        controls
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {/* Remove Media Button */}
                  {(pendingImage || pendingVideo) && (
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={removeMedia}
                    >
                      <Ionicons name="close-circle" size={28} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ✅ Title Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                <Ionicons name="newspaper-outline" size={16} color="#666" />{" "}
                Title
              </Text>
              <TextInput
                style={styles.titleInput}
                value={localTitle}
                onChangeText={setLocalTitle}
                placeholder="Enter news title"
                placeholderTextColor="#999"
              />
            </View>

            {/* ✅ Description Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                <Ionicons name="document-text-outline" size={16} color="#666" />{" "}
                Description
              </Text>
              <TextInput
                style={styles.descInput}
                value={localDesc}
                onChangeText={setLocalDesc}
                placeholder="Enter news description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
              />
            </View>

            {/* ✅ Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.saveButton, isWorking && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isWorking}
              >
                {isWorking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isWorking}
              >
                <Ionicons name="close-circle-outline" size={20} color="#666" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* ✅ View Mode - Display Only */}
            {(serverImageUrl || serverVideoUrl) && (
              <View style={styles.mediaViewContainer}>
                {serverImageUrl && (
                  <Image
                    source={{ uri: serverImageUrl }}
                    style={styles.mediaView}
                    resizeMode="cover"
                  />
                )}
                {serverVideoUrl && (
                  <Video
                    source={{ uri: serverVideoUrl }}
                    style={styles.mediaView}
                    controls
                    resizeMode="contain"
                  />
                )}
              </View>
            )}

            <View style={styles.contentView}>
              <Text style={styles.categoryBadge}>{news.category}</Text>
              <Text style={styles.titleView}>{news.title}</Text>
              <Text style={styles.descriptionView}>{news.description}</Text>

              <View style={styles.metaInfo}>
                <Ionicons name="time-outline" size={16} color="#999" />
                <Text style={styles.dateText}>
                  {new Date(news.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    
    </View>
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 12,
    
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusWorking: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "500",
  },
  statusSuccess: {
    backgroundColor: "#e8f5e9",
  },
  statusSuccessText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
  },
  mediaSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  mediaButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: "600",
  },
  mediaPreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  videoPreviewWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  removeMediaButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 4,
  },
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  descInput: {
    fontSize: 15,
    color: "#555",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    minHeight: 120,
    textAlignVertical: "top",
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    padding: 16,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
  },
  // share button styles
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // View Mode Styles
  mediaViewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  mediaView: {
    width: "100%",
    height: 280,
  },
  contentView: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#C62828",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  titleView: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#222",
    marginBottom: 12,
    lineHeight: 32,
  },
  descriptionView: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dateText: {
    fontSize: 14,
    color: "#999",
  },
});

export default NewsDetailView;
