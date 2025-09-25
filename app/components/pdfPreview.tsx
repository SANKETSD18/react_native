import React, { useState } from "react";
import { SafeAreaView, ActivityIndicator, Button, View } from "react-native";
import Pdf from "react-native-pdf";

type Props = {
  pdfUrl: string;
  goBack: () => void;
};

export default function PdfPreview({ pdfUrl, goBack }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title="Back" onPress={goBack} />
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Pdf
          source={{ uri: pdfUrl }}
          trustAllCerts={false}
          onLoadComplete={() => setLoading(false)}
          onPageChanged={() => setLoading(false)}
          onError={(error) => {
            console.log("PDF load error:", error);
            setLoading(false);
          }}
          style={{ flex: 1, width: '100%' }}
        />
        {loading && (
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
