import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Input } from "./Input";
import { ChevronDown, Plus } from "lucide-react-native";
import { colors } from "../../utils/theme";

export interface SearchableSelectProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Allow adding a new option by typing and selecting "Add '...'" (default true) */
  allowAdd?: boolean;
}

/**
 * Search, select from list, or add new value — matches promoter SearchableCombobox workflow.
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  allowAdd = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [extraOptions, setExtraOptions] = useState<string[]>([]);

  const allOptions = useMemo(() => [...options, ...extraOptions], [options, extraOptions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allOptions;
    const q = search.toLowerCase();
    return allOptions.filter((o) => o.toLowerCase().includes(q));
  }, [allOptions, search]);

  const exactMatch = allOptions.some((o) => o.toLowerCase() === search.trim().toLowerCase());
  const canAdd = allowAdd && search.trim() !== "";

  const handleSelect = (selected: string) => {
    onValueChange(selected === value ? "" : selected);
    setOpen(false);
    setSearch("");
  };

  const handleAddNew = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (!allOptions.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      setExtraOptions((prev) => [...prev, trimmed]);
    }
    onValueChange(trimmed);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modal}>
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              autoFocus
            />
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 && !canAdd && (
                <Text style={styles.empty}>No results found.</Text>
              )}
              {filtered.length === 0 && canAdd && (
                <TouchableOpacity style={styles.addRow} onPress={handleAddNew}>
                  <Plus size={18} color={colors.primary} />
                  <Text style={styles.addText}>Add &quot;{search.trim()}&quot;</Text>
                </TouchableOpacity>
              )}
              {filtered.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.option, value === opt && styles.optionSelected]}
                  onPress={() => handleSelect(opt)}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
              {canAdd && search.trim() && !exactMatch && filtered.length > 0 && (
                <TouchableOpacity style={styles.addRow} onPress={handleAddNew}>
                  <Plus size={18} color={colors.primary} />
                  <Text style={styles.addText}>Add &quot;{search.trim()}&quot;</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    fontSize: 16,
    color: colors.foreground,
    flex: 1,
  },
  triggerPlaceholder: {
    color: colors.mutedForeground,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    maxHeight: "70%",
  },
  searchInput: {
    marginBottom: 12,
  },
  list: {
    maxHeight: 280,
  },
  empty: {
    fontSize: 14,
    color: colors.mutedForeground,
    paddingVertical: 16,
    textAlign: "center",
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  optionSelected: {
    backgroundColor: "rgba(30, 58, 95, 0.1)",
  },
  optionText: {
    fontSize: 16,
    color: colors.foreground,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
});
