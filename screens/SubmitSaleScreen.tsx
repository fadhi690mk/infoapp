import React from "react";
import { View, Text } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { ArrowLeft } from "lucide-react-native";

export function SubmitSaleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const productId = route.params?.productId;

  return (
    <AppLayout title="Submit Sale">
      <Button variant="ghost" size="sm" className="mb-4" onPress={() => navigation.goBack()}>
        <ArrowLeft size={16} color="#333" />
        <Text className="text-sm">Back</Text>
      </Button>

      <Card>
        <CardContent className="p-4 gap-4">
          <View className="gap-1.5">
            <Label>Customer Name *</Label>
            <Input placeholder="Enter customer name" />
          </View>
          <View className="gap-1.5">
            <Label>Customer Phone *</Label>
            <Input placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} />
          </View>
          <View className="gap-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any notes about this sale" multiline />
          </View>
          <Button>
            <Text className="text-primary-foreground">Submit Sale</Text>
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
