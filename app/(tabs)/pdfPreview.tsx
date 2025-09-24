import React, { useState, useEffect } from "react";
import { SafeAreaView, ActivityIndicator, Dimensions, Button, View } from "react-native";
import Pdf from "react-native-pdf";
import RNFetchBlob from "rn-fetch-blob";

type Props = {
  pdfUrl: string;
  goBack: () => void;
};

export default function PdfPreview({ pdfUrl, goBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [localPath, setLocalPath] = useState<string | null>(null);

  useEffect(() => {
    const downloadPdf = async () => {
      try {
        const res = await RNFetchBlob.config({
          fileCache: true,
          trusty: true, // Android SSL ignore
        }).fetch("GET", pdfUrl);

        setLocalPath(res.path());
      } catch (err) {
        console.log("PDF download error:", err);
      }
    };

    downloadPdf();
  }, [pdfUrl]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button title="Back" onPress={goBack} />

      <View style={{ flex: 1 }}>
        {localPath ? (
          <Pdf
            source={{ uri: `file://${localPath}` }}
            onLoadComplete={() => setLoading(false)}
            onError={(error) => {
              console.log("PDF load error:", error);
              setLoading(false);
            }}
            style={{ flex: 1, width: Dimensions.get("window").width }}
          />
        ) : (
          <ActivityIndicator
            size="large"
            color="blue"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -25,
              marginTop: -25,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
