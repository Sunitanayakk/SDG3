import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSetu } from "../../services/context";
export default function TabsLayout() {
  const { t } = useSetu();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#ffffff18",
          minHeight: 75,
          paddingTop: 9,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: "#e0c9a5",
        tabBarInactiveTintColor: "#a69d8f",
        tabBarLabelStyle: { fontSize: 10, marginTop: 3 },
      }}
    >
      {(["index", "chat", "resources", "profile"] as const).map((name, i) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: [t.home, t.chat, t.resources, t.profile][i],
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={
                  (
                    [
                      "home-outline",
                      "chatbubble-ellipses-outline",
                      "library-outline",
                      "person-outline",
                    ] as const
                  )[i]
                }
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
