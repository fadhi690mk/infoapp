import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, PlaceholderImage } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Eye, X, Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react-native";
import {
  getEcomProducts,
  getEcomPrimaryCategories,
  getEcomSecondaryCategories,
  resolveImageUrl,
} from "../services/api";
import type {
  EcomProduct,
  EcomPrimaryCategory,
  EcomSecondaryCategory,
} from "../services/api";
import { colors } from "../utils/theme";

const SORT_OPTIONS = [
  { value: "name", label: "Name A–Z" },
  { value: "popular", label: "Most selling" },
  { value: "profit", label: "Most profitable" },
];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 400;

function StockBadge({ stock, minLevel }: { stock: number; minLevel: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (stock <= minLevel) return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

type PickerType = "primary" | "secondary" | "sort" | "pageSize" | null;

export function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<EcomProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryCategories, setPrimaryCategories] = useState<EcomPrimaryCategory[]>([]);
  const [secondaryCategories, setSecondaryCategories] = useState<EcomSecondaryCategory[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<number | "">("");
  const [secondaryCategoryId, setSecondaryCategoryId] = useState<number | "">("");
  const [orderBy, setOrderBy] = useState("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [pickerOpen, setPickerOpen] = useState<PickerType>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasFiltersApplied =
    primaryCategoryId !== "" ||
    secondaryCategoryId !== "" ||
    searchApplied !== "";

  const loadPrimaryCategories = useCallback(async () => {
    try {
      const list = await getEcomPrimaryCategories();
      setPrimaryCategories(Array.isArray(list) ? list : []);
    } catch {
      setPrimaryCategories([]);
    }
  }, []);

  useEffect(() => {
    loadPrimaryCategories();
  }, [loadPrimaryCategories]);

  useEffect(() => {
    if (primaryCategoryId === "") {
      setSecondaryCategories([]);
      setSecondaryCategoryId("");
      return;
    }
    getEcomSecondaryCategories(primaryCategoryId as number)
      .then((list) => setSecondaryCategories(Array.isArray(list) ? list : []))
      .catch(() => setSecondaryCategories([]));
    setSecondaryCategoryId("");
  }, [primaryCategoryId]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Parameters<typeof getEcomProducts>[0] = {
      page,
      page_size: pageSize,
      is_active: true,
      order_by: orderBy,
    };
    if (primaryCategoryId !== "")
      params.primary_category = primaryCategoryId as number;
    if (secondaryCategoryId !== "")
      params.secondary_category = secondaryCategoryId as number;
    if (searchApplied) params.name = searchApplied;

    getEcomProducts(params)
      .then((res) => {
        setProducts(res.results ?? []);
        setTotalCount(res.count ?? 0);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setProducts([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, orderBy, primaryCategoryId, secondaryCategoryId, searchApplied]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const clearFilters = useCallback(() => {
    setPrimaryCategoryId("");
    setSecondaryCategoryId("");
    setSearchInput("");
    setSearchApplied("");
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchApplied(value.trim());
      setPage(1);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const setPrimary = useCallback((id: number | "") => {
    setPrimaryCategoryId(id);
    setPage(1);
    setPickerOpen(null);
  }, []);

  const setSecondary = useCallback((id: number | "") => {
    setSecondaryCategoryId(id);
    setPage(1);
    setPickerOpen(null);
  }, []);

  const setSort = useCallback((value: string) => {
    setOrderBy(value);
    setPage(1);
    setPickerOpen(null);
  }, []);

  const setSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
    setPickerOpen(null);
  }, []);

  const primaryLabel =
    primaryCategoryId === ""
      ? "Category"
      : primaryCategories.find((c) => c.id === primaryCategoryId)?.name ?? "Category";
  const secondaryLabel =
    secondaryCategoryId === ""
      ? "Subcategory"
      : secondaryCategories.find((c) => c.id === secondaryCategoryId)?.name ?? "Subcategory";
  const sortLabel = SORT_OPTIONS.find((o) => o.value === orderBy)?.label ?? "Sort";

  return (
    <AppLayout title="Affiliate Products">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Filter block — matches promoter: search + clear, then row of dropdowns */}
        <View style={styles.filterBlock}>
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
              <Input
                placeholder="Search products…"
                value={searchInput}
                onChangeText={handleSearchChange}
                style={styles.searchInput}
              />
            </View>
            {hasFiltersApplied && (
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <X size={16} color={colors.mutedForeground} />
                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.filtersRow}>
            <Pressable
              style={styles.pickerCategory}
              onPress={() => setPickerOpen("primary")}
            >
              <Text style={styles.pickerText} numberOfLines={1}>
                {primaryLabel}
              </Text>
              <ChevronDown size={16} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              style={[styles.pickerCategory, primaryCategoryId === "" && styles.pickerDisabled]}
              onPress={() => primaryCategoryId !== "" && setPickerOpen("secondary")}
              disabled={primaryCategoryId === ""}
            >
              <Text style={styles.pickerText} numberOfLines={1}>
                {secondaryLabel}
              </Text>
              <ChevronDown size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.filtersRow}>
            <Pressable style={[styles.picker, styles.pickerGrow]} onPress={() => setPickerOpen("sort")}>
              <Text style={styles.pickerText} numberOfLines={1}>
                {sortLabel}
              </Text>
              <ChevronDown size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={styles.perPageWrap}>
              <Text style={styles.perPageLabel}>Per page</Text>
              <Pressable style={styles.pickerSmall} onPress={() => setPickerOpen("pageSize")}>
                <Text style={styles.pickerText}>{pageSize}</Text>
                <ChevronDown size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.muted}>Loading products…</Text>
          </View>
        ) : products.length === 0 ? (
          <Text style={styles.empty}>No products found.</Text>
        ) : (
          <>
            <View style={styles.list}>
              {products.map((p) => {
                const basePrice = parseFloat(p.base_cost_price || "0");
                const sellPrice = parseFloat(p.final_selling_price || "0");
                const profit = sellPrice - basePrice;
                const shortDesc = (p.description || "").slice(0, 80);
                return (
                  <Card key={p.id} className="overflow-hidden">
                    <CardContent noPadding>
                      <PlaceholderImage
                        uri={p.image ? resolveImageUrl(p.image) : ""}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <StockBadge
                            stock={p.stock_quantity}
                            minLevel={p.minimum_stock_alert}
                          />
                        </View>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {shortDesc}
                        </Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>
                            Base: <Text style={styles.priceValue}>₹{basePrice.toFixed(0)}</Text>
                          </Text>
                          <Text style={styles.priceLabel}>
                            Sell: <Text style={styles.priceValueSecondary}>₹{sellPrice.toFixed(0)}</Text>
                          </Text>
                          <Text style={styles.priceLabel}>
                            Profit: <Text style={styles.priceValueSuccess}>₹{profit.toFixed(0)}</Text>
                          </Text>
                        </View>
                        <Button
                          size="sm"
                          onPress={() =>
                            navigation.navigate("ProductDetails", { id: String(p.id) })
                          }
                        >
                          <Eye size={16} color="#fff" />
                          <Text style={styles.btnText}>View Details</Text>
                        </Button>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>

            {/* Pagination */}
            <View style={styles.pagination}>
              <Text style={styles.paginationInfo}>
                {totalCount === 0
                  ? "No products"
                  : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                      page * pageSize,
                      totalCount
                    )} of ${totalCount}`}
              </Text>
              {totalPages > 1 && (
                <View style={styles.paginationControls}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={18} color={colors.foreground} />
                  </Button>
                  <Text style={styles.pageNum}>
                    {page} / {totalPages}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={18} color={colors.foreground} />
                  </Button>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Picker modals */}
      <Modal
        visible={pickerOpen !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerOpen(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
            {pickerOpen === "primary" && (
              <>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setPrimary("")}
                >
                  <Text style={styles.optionText}>All categories</Text>
                </TouchableOpacity>
                {primaryCategories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.option}
                    onPress={() => setPrimary(c.id)}
                  >
                    <Text style={styles.optionText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {pickerOpen === "secondary" && (
              <>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setSecondary("")}
                >
                  <Text style={styles.optionText}>All subcategories</Text>
                </TouchableOpacity>
                {secondaryCategories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.option}
                    onPress={() => setSecondary(c.id)}
                  >
                    <Text style={styles.optionText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {pickerOpen === "sort" &&
              SORT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={styles.option}
                  onPress={() => setSort(o.value)}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            {pickerOpen === "pageSize" &&
              PAGE_SIZE_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={styles.option}
                  onPress={() => setSize(n)}
                >
                  <Text style={styles.optionText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 4 },
  filterBlock: {
    marginBottom: 16,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    position: "relative",
    minWidth: 0,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 36,
    height: 40,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  pickerCategory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
    minWidth: 100,
    flex: 0,
    maxWidth: 160,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
  },
  pickerGrow: {
    flex: 1,
    maxWidth: undefined,
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  pickerText: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  pickerSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    width: 72,
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
  },
  perPageWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perPageLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  error: {
    fontSize: 14,
    color: colors.destructive,
    marginBottom: 12,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  muted: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  empty: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    paddingVertical: 32,
  },
  list: { gap: 16 },
  cardImage: { width: "100%", height: 160 },
  cardBody: { padding: 16, gap: 8 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  cardDesc: { fontSize: 12, color: colors.mutedForeground },
  priceRow: { flexDirection: "row", gap: 12 },
  priceLabel: { fontSize: 12, color: colors.mutedForeground },
  priceValue: { fontWeight: "600", color: colors.foreground },
  priceValueSecondary: { fontWeight: "600", color: colors.secondary },
  priceValueSuccess: { fontWeight: "600", color: colors.success },
  btnText: { color: "#fff", fontSize: 14 },
  pagination: {
    marginTop: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  paginationInfo: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageNum: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalScroll: {
    maxHeight: 400,
  },
  option: {
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 14,
    color: colors.foreground,
  },
});
