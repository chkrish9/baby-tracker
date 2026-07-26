import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fixedColors } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeContext";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { colors } = useTheme();

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const tints: Record<ToastType, { bg: string; text: string }> = {
    success: { bg: fixedColors.mint[100], text: fixedColors.emerald[800] },
    error: { bg: fixedColors.red[50], text: fixedColors.red[700] },
    info: { bg: colors.pink[50], text: colors.pink[700] },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View pointerEvents="none" style={styles.stack}>
        {toasts.map((t) => (
          <View key={t.id} style={[styles.toast, { backgroundColor: tints[t.type].bg }]}>
            <Text style={[styles.text, { color: tints[t.type].text }]}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  stack: {
    position: "absolute",
    bottom: 112,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    maxWidth: 384,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
