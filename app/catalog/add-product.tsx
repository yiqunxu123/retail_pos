/**
 * Add Product Screen
 * 
 * Form to add a new product to the catalog.
 * Based on kapp web UI design.
 */

import { Ionicons } from "@expo/vector-icons";
import type { AxiosError } from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { PageHeader } from "../../components";
import { CATEGORIES_TABLE, DevDataOverlay, PRODUCTS_TABLE, PROMOTION_DETAILS_TABLE } from "../../components/DevDataOverlay";
import {
    createCategory,
    createProduct,
    fetchBrands,
    fetchCategories,
    fetchChannels,
    fetchManufacturers,
    fetchSuppliers,
    generateProductDescription,
    parseProductApiError,
    type ChannelInfoPayload,
    type ListItem,
    type ProductPayload,
    type PromotionRow,
} from "../../utils/api/products";
import { powerSyncDb } from "../../utils/powersync/PowerSyncProvider";

// Tab configuration
const TABS = [
  { key: "basic", label: "Basic" },
  { key: "pricing", label: "Pricing & Stock" },
  { key: "seo", label: "SEO" },
  { key: "variants", label: "Variants" },
  { key: "tax", label: "Tax Section" },
  { key: "promotions", label: "Promotions" },
];

// Unit enum – mirrors kapp UNIT constants
const UNIT = { PIECE: 1, PACK: 2, CASE: 3, PALLET: 4 } as const;

// Video type enum – mirrors kapp VIDEO_TYPE constants
const VIDEO_TYPE = { VIDEO: 4, YOUTUBE_LINK: 5 } as const;

// Promotion constants – mirrors kapp Common/constants
const PROMOTION_STATUS: Record<string, { name: string; value: number; color: string; textColor: string }> = {
  ACTIVE:   { name: "Active",   value: 1, color: "#EAF4F0", textColor: "#10B265" },
  UPCOMING: { name: "Upcoming", value: 2, color: "#E6ECFD", textColor: "#0646E9" },
  EXPIRED:  { name: "Expired",  value: 3, color: "#FFE7E5", textColor: "#FB1100" },
};

const PROMOTION_VALUE_TYPE: Record<string, { type: string; value: number }> = {
  PERCENTAGE_DISCOUNT: { type: "% Disc.",     value: 1 },
  PRICE_DISCOUNT:      { type: "Price Disc.", value: 2 },
  FIXED:               { type: "Fixed Price", value: 3 },
};

const SALE_ORDER_SOURCE: Record<string, { name: string; value: number }> = {
  ECOM:   { name: "Ecom",   value: 1 },
  PORTAL: { name: "Portal", value: 2 },
  BOTH:   { name: "Both",   value: 3 },
};

const UNIT_NAMES: Record<number, string> = { 1: "Piece", 2: "Pack", 3: "Case", 4: "Pallet" };

const MSA_CODES = [
  { code: "003211", description: "Moist Snuff" },
  { code: "003212", description: "Loose Leaf" },
  { code: "003213", description: "Dry Snuff" },
  { code: "003214", description: "Twist/Rope/Plug" },
  { code: "003215", description: "DNU Plug" },
  { code: "003217", description: "Snus" },
  { code: "003218", description: "Hard Snuff" },
  { code: "003221", description: "RYO Tobacco" },
  { code: "003227", description: "Cigars - Handmade or hand rolled" },
  { code: "003231", description: "Cigarettes" },
  { code: "003232", description: "Heated Tobacco" },
  { code: "003241", description: "Pipe Tobacco" },
  { code: "003251", description: "Cigar" },
  { code: "003252", description: "Little/Cigars Filtered" },
  { code: "003261", description: "Tubes/Papers/Wraps" },
  { code: "003262", description: "Accessories" },
  { code: "003281", description: "Kits" },
  { code: "003292", description: "E-Vapor" },
  { code: "003293", description: "Tobacco Drived Nicotine Products" },
  { code: "003263", description: "Lighters" },
  { code: "003271", description: "3261-RJR" },
  { code: "003291", description: "Nicotine Replace Therapy" },
] as const;

/** Round number to 2 decimal places */
function round2(v: number | string): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Convert a quantity entered at `soldByUnit` level to the lowest (Piece) unit.
 * Mirrors kapp's convertToLowest logic in utils.js.
 *
 *  unitPrices = the unit_prices array for this channel
 *  soldByUnit = the unit the user sells by (UNIT.PIECE/PACK/CASE/PALLET)
 *
 * Returns the multiplier to convert 1 sold-unit qty into base (Piece) qty.
 */
function convertToLowest(
  soldByUnit: number,
  unitPrices: Array<{ unit: number; definition: number | null }>,
): number {
  if (soldByUnit === UNIT.PIECE) return 1;

  // Build a lookup: unit -> definition
  const defMap = new Map<number, number>();
  for (const up of unitPrices) {
    if (up.definition) defMap.set(up.unit, up.definition);
  }

  // Hierarchy: Pallet -> Case -> Pack -> Piece
  const parentOf: Record<number, number> = {
    [UNIT.PACK]: UNIT.PIECE,
    [UNIT.CASE]: UNIT.PACK,
    [UNIT.PALLET]: UNIT.CASE,
  };

  let multiplier = 1;
  let current = soldByUnit;
  while (current !== UNIT.PIECE) {
    const def = defMap.get(current);
    if (!def) return 1; // Missing definition – fallback to 1
    multiplier *= def;
    current = parentOf[current] ?? UNIT.PIECE;
  }
  return multiplier;
}

/** Map a unit label string to its numeric constant */
function unitLabelToId(label: string): number {
  switch (label) {
    case "Pack": return UNIT.PACK;
    case "Case": return UNIT.CASE;
    case "Pallet": return UNIT.PALLET;
    default: return UNIT.PIECE;
  }
}

type CategoryNode = ListItem & {
  children?: CategoryNode[];
  parent_id?: number | null;
  parentId?: number | null;
};


function normalizeCategoryList(data: unknown): ListItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as ListItem[];
  const obj = data as Record<string, unknown>;
  const candidates = [
    obj.entities,
    obj.rows,
    obj.categories,
    obj.data,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as ListItem[];
  }
  return [];
}

function buildCategoryTree(items: ListItem[]): CategoryNode[] {
  if (!items.length) return [];
  const hasNestedChildren = items.some((item) => Array.isArray((item as CategoryNode).children));
  if (hasNestedChildren) return items as CategoryNode[];

  const nodes = new Map<number, CategoryNode>();
  items.forEach((item) => {
    nodes.set(item.id, { ...(item as CategoryNode), children: [] });
  });

  const roots: CategoryNode[] = [];
  nodes.forEach((node) => {
    const parentId = (node.parent_id ?? node.parentId ?? null) as number | null;
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)?.children?.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Form input component
function FormInput({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  info,
  required,
  disabled,
}: { 
  label: string; 
  placeholder?: string; 
  value: string; 
  onChangeText: (text: string) => void;
  info?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-gray-700 text-sm font-medium">
          {label}
          {required && <Text className="text-red-500">*</Text>}
        </Text>
        {info && (
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
        )}
      </View>
      <TextInput
        className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
        placeholder={placeholder || label}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        style={disabled ? { backgroundColor: '#F3F4F6' } : {}}
      />
    </View>
  );
}

// Switch component
function FormSwitch({ 
  label, 
  value, 
  onValueChange 
}: { 
  label: string; 
  value: boolean; 
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View className="flex-row items-center mr-6 mb-3">
      <Text className="text-gray-600 text-sm mr-2">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
        thumbColor="white"
      />
    </View>
  );
}

export default function AddProductScreen() {
  const router = useRouter();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState("basic");

  // --- Scroll refs for field focus ---
  const basicScrollRef = useRef<ScrollView>(null);
  const pricingScrollRef = useRef<ScrollView>(null);
  const seoScrollRef = useRef<ScrollView>(null);
  const fieldYMap = useRef<Record<string, number>>({});

  // Helper: record a field's Y position relative to its parent ScrollView
  const trackFieldLayout = useCallback((fieldKey: string, y: number) => {
    fieldYMap.current[fieldKey] = y;
  }, []);

  // ---------- Loading / submission state ----------
  const [saving, setSaving] = useState(false);

  // ---------- Reference data fetched from server ----------
  const [channelsList, setChannelsList] = useState<ListItem[]>([]);
  const [brandsList, setBrandsList] = useState<ListItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<ListItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<ListItem[]>([]);
  const [manufacturersList, setManufacturersList] = useState<ListItem[]>([]);

  // Selected references
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [selectedManufacturerIds, setSelectedManufacturerIds] = useState<number[]>([]);

  // Form state - Basic
  const [productName, setProductName] = useState("");
  const [alias, setAlias] = useState("");
  const [productEcomName, setProductEcomName] = useState("");
  const [sku, setSku] = useState("");
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [weight, setWeight] = useState("");
  const [upc, setUpc] = useState("");
  const [autoFetchImage, setAutoFetchImage] = useState(true);
  const [retailUpc1, setRetailUpc1] = useState("");
  const [retailUpc2, setRetailUpc2] = useState("");
  const [binCode, setBinCode] = useState("");
  const [zone, setZone] = useState("");
  const [aisle, setAisle] = useState("");
  const [tags, setTags] = useState("");
  const [productNote, setProductNote] = useState("");
  const [description, setDescription] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  
  // Switches - Basic
  const [isMsa, setIsMsa] = useState(false);
  const [enableBoProduct, setEnableBoProduct] = useState(false);
  const [isTaxApplicable, setIsTaxApplicable] = useState(false);
  
  // Switches - Ecommerce
  const [isOnline, setIsOnline] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHotSeller, setIsHotSeller] = useState(false);
  
  // Add Category Modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryMsaCode, setCategoryMsaCode] = useState("");
  const [categoryIsMsa, setCategoryIsMsa] = useState(false);
  const [categoryIsFeature, setCategoryIsFeature] = useState(false);
  const [categoryParentId, setCategoryParentId] = useState<number | null>(null);
  const [showMsaCodeModal, setShowMsaCodeModal] = useState(false);
  const [msaCodeDraft, setMsaCodeDraft] = useState("");
  const [showParentCategoryModal, setShowParentCategoryModal] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  
  // Pricing & Stock Tab state
  const [measuredBy, setMeasuredBy] = useState("Count");
  const [soldBy, setSoldBy] = useState("Piece");
  const [boughtBy, setBoughtBy] = useState("Piece");
  
  // Unit of Measurement data
  const [unitData, setUnitData] = useState([
    { unit: "Piece", unitId: UNIT.PIECE, qty: "1", upc: "" },
    { unit: "Pack", unitId: UNIT.PACK, qty: "", qtyLabel: "pieces", upc: "" },
    { unit: "Case", unitId: UNIT.CASE, qty: "", qtyLabel: "packs", upc: "" },
    { unit: "Pallet", unitId: UNIT.PALLET, qty: "", qtyLabel: "cases", upc: "" },
  ]);
  
  // Pricing data
  const [pricingData, setPricingData] = useState([
    { unit: "Piece", unitId: UNIT.PIECE, qty: "1", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Pack", unitId: UNIT.PACK, qty: "", qtyLabel: "Pieces", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Case", unitId: UNIT.CASE, qty: "", qtyLabel: "Packs", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
    { unit: "Pallet", unitId: UNIT.PALLET, qty: "", qtyLabel: "Cases", baseCost: "", netCost: "", salePrice: "", margin: "", msrp: "", lowestPrice: "", ecomPrice: "", tier1: "", tier2: "", tier3: "", tier4: "", tier5: "" },
  ]);
  
  // Stock data
  const [stockData, setStockData] = useState([
    { srNo: "1", warehouse: "Primary", channelId: 1, availableQty: "0", onHoldQty: "0", damagedQty: "0", backOrderQty: "", comingSoonQty: "" },
  ]);
  
  // Collapsible sections
  const [measurementExpanded, setMeasurementExpanded] = useState(true);
  const [pricingExpanded, setPricingExpanded] = useState(true);
  const [stockExpanded, setStockExpanded] = useState(true);

  // Category tree expand/collapse
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
  
  // SEO Tab state
  const [seoSlug, setSeoSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  
  // Promotions Tab state
  const [promotionSearch, setPromotionSearch] = useState("");
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);
  const [promotionStatusFilter, setPromotionStatusFilter] = useState<number[]>([]);
  const [promotionRows, setPromotionRows] = useState<PromotionRow[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsTotalCount, setPromotionsTotalCount] = useState(0);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [enableBoOnline, setEnableBoOnline] = useState(false);
  
  // Youtube
  const [youtubeLink, setYoutubeLink] = useState("");

  // Status (1 = Active, 2 = Inactive — mirrors kapp)
  const [status, setStatus] = useState(1);

  // Main category selector modal
  const [showMainCategoryModal, setShowMainCategoryModal] = useState(false);

  // Generic picker modal for dropdowns (Sold By, Bought By, Measured By, etc.)
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: Array<{ label: string; value: string }>;
    selected: string;
    onSelect: (value: string) => void;
  }>({ visible: false, title: '', options: [], selected: '', onSelect: () => {} });

  const openPicker = useCallback((
    title: string,
    options: Array<{ label: string; value: string }>,
    selected: string,
    onSelect: (value: string) => void,
  ) => {
    setPickerModal({ visible: true, title, options, selected, onSelect });
  }, []);

  const closePicker = useCallback(() => {
    setPickerModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // Active channel tab in pricing section
  const [activePricingChannel, setActivePricingChannel] = useState(0);

  // ------------------------------------------------------------------
  // Fetch reference data on mount (channels, brands, categories, etc.)
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [channelsRes, brandsRes, categoriesRes, suppliersRes, manufacturersRes] =
          await Promise.allSettled([
            fetchChannels({ page_size: 100 }),
            fetchBrands({ page_size: 200 }),
            fetchCategories(),
            fetchSuppliers({ page_size: 200 }),
            fetchManufacturers({ page_size: 200 }),
          ]);

        if (channelsRes.status === "fulfilled") {
          const channels = channelsRes.value.data.entities || [];
          setChannelsList(channels);
          // Build initial stock data rows from channels
          if (channels.length > 0) {
            setStockData(
              channels.map((ch, i) => ({
                srNo: String(i + 1),
                warehouse: ch.name,
                channelId: ch.id,
                availableQty: "0",
                onHoldQty: "0",
                damagedQty: "0",
                backOrderQty: "",
                comingSoonQty: "",
              })),
            );
          }
        }
        if (brandsRes.status === "fulfilled") setBrandsList(brandsRes.value.data.entities || []);
        if (categoriesRes.status === "fulfilled") {
          setCategoriesList(normalizeCategoryList(categoriesRes.value.data));
        }
        if (suppliersRes.status === "fulfilled") setSuppliersList(suppliersRes.value.data.entities || []);
        if (manufacturersRes.status === "fulfilled") setManufacturersList(manufacturersRes.value.data.entities || []);
      } catch (e) {
        console.warn("Failed to load reference data", e);
      }
    };
    loadReferenceData();
  }, []);

  // ------------------------------------------------------------------
  // Promotions: read from local PowerSync DB
  // ------------------------------------------------------------------
  const loadPromotions = useCallback(async () => {
    try {
      setPromotionsLoading(true);

      // Build WHERE clauses for search / status filter
      const conditions: string[] = [];
      const params: any[] = [];

      if (promotionSearch.trim()) {
        conditions.push("p.name LIKE ?");
        params.push(`%${promotionSearch.trim()}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const sql = `
        SELECT
          pd.id            AS promotion_detail_id,
          p.id             AS promotion_id,
          p.name           AS name,
          p.start_datetime AS start_datetime,
          p.end_datetime   AS end_datetime,
          p.applicable_for AS applicable_for,
          p.status         AS promotion_status,
          pd.value         AS value,
          pd.value_type    AS value_type,
          pd.unit          AS unit,
          pd.total_ecom_sold   AS total_ecom_sold,
          pd.total_tenant_sold AS total_tenant_sold,
          pd.total_app_sold    AS total_app_sold
        FROM promotions p
        LEFT JOIN promotion_details pd ON pd.promotion_id = p.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT 50
      `;

      const rows = await powerSyncDb.getAll<any>(sql, params);

      const mapped: PromotionRow[] = rows.map((r: any) => ({
        promotion_detail_id: r.promotion_detail_id ?? 0,
        promotion_id: r.promotion_id,
        name: r.name,
        start_datetime: r.start_datetime,
        end_datetime: r.end_datetime,
        applicable_for: r.applicable_for,
        promotion_status: r.promotion_status,
        value: r.value ?? 0,
        value_type: r.value_type ?? 0,
        unit_price: r.unit ? { id: 0, unit: r.unit } : undefined,
        total_sold: (r.total_ecom_sold ?? 0) + (r.total_tenant_sold ?? 0),
        total_tenant_sold: r.total_tenant_sold ?? 0,
        total_ecom_sold: r.total_ecom_sold ?? 0,
        total_app_sold: r.total_app_sold ?? 0,
      }));

      // Client-side status filter (promotion_status is computed, not stored)
      const filtered = promotionStatusFilter.length > 0
        ? mapped.filter((r) => promotionStatusFilter.includes(r.promotion_status))
        : mapped;

      setPromotionRows(filtered);
      setPromotionsTotalCount(filtered.length);
    } catch (err) {
      console.warn("Failed to load promotions from local DB", err);
      setPromotionRows([]);
      setPromotionsTotalCount(0);
    } finally {
      setPromotionsLoading(false);
    }
  }, [promotionSearch, promotionStatusFilter]);

  // Load promotions when switching to the promotions tab
  useEffect(() => {
    if (activeTab === "promotions") {
      loadPromotions();
    }
  }, [activeTab, loadPromotions]);

  // ------------------------------------------------------------------
  // Build unit_prices from the pricing + unit measurement form state
  // Mirrors kapp's onSubmit + parseToIntData channel_info builder
  // ------------------------------------------------------------------
  const buildUnitPrices = useCallback(() => {
    return unitData
      .map((u, index) => {
        const p = pricingData[index];
        const def = u.unitId === UNIT.PIECE ? 1 : (parseInt(u.qty) || null);
        // Skip units that have no definition (except piece)
        if (!def && u.unitId !== UNIT.PIECE) return null;

        return {
          unit: u.unitId,
          unit_name: u.unit,
          definition: def,
          upc: u.upc || "",
          base_cost: round2(p.baseCost),
          cost: round2(p.netCost),
          price: round2(p.salePrice),
          margin: round2(p.margin),
          margin_type: 1,
          lowest_selling_price: round2(p.lowestPrice),
          ecom_price: round2(p.ecomPrice),
          msrp_price: round2(p.msrp),
          // Mirrors kapp: empty tier prices default to 0, not null
          unit_price_tiers: [
            { tier_id: 1, price: p.tier1 ? round2(p.tier1) : 0 },
            { tier_id: 2, price: p.tier2 ? round2(p.tier2) : 0 },
            { tier_id: 3, price: p.tier3 ? round2(p.tier3) : 0 },
            { tier_id: 4, price: p.tier4 ? round2(p.tier4) : 0 },
            { tier_id: 5, price: p.tier5 ? round2(p.tier5) : 0 },
          ],
        };
      })
      .filter(Boolean) as ChannelInfoPayload["unit_prices"];
  }, [unitData, pricingData]);

  // ------------------------------------------------------------------
  // Build the full ProductPayload – mirrors kapp parseToIntData
  // ------------------------------------------------------------------
  const buildPayload = useCallback((): ProductPayload => {
    const soldByUnit = unitLabelToId(soldBy);
    const boughtByUnit = unitLabelToId(boughtBy);

    const unitPrices = buildUnitPrices();

    // Compute conversion multiplier – mirrors kapp convertToLowest
    const inBase = convertToLowest(soldByUnit, unitPrices);

    // Build channel_info array — one entry per channel (warehouse/storefront)
    // Mirrors kapp parseToIntData: quantities are converted to lowest (Piece) unit
    const channelInfo: ChannelInfoPayload[] = stockData.map((s) => ({
      channel_id: s.channelId,
      channel_name: s.warehouse,
      in_hand: (parseInt(s.availableQty) || 0) * inBase,
      on_hold: (parseInt(s.onHoldQty) || 0) * inBase,
      damaged: (parseInt(s.damagedQty) || 0) * inBase,
      back_order: (parseInt(s.backOrderQty) || 0) * inBase || null,
      coming_soon: (parseInt(s.comingSoonQty) || 0) * inBase || null,
      min_qty: 0,
      max_qty: 0,
      ps_allowed_qty: null,
      autoCalculate: true,
      sold_by_unit: soldByUnit,
      bought_by_unit: boughtByUnit,
      unit_prices: unitPrices,
    }));

    // If no channels loaded, create a default channel entry
    if (channelInfo.length === 0) {
      channelInfo.push({
        channel_id: 1,
        channel_name: "Primary",
        in_hand: 0,
        on_hold: 0,
        damaged: 0,
        back_order: null,
        coming_soon: null,
        min_qty: 0,
        max_qty: 0,
        ps_allowed_qty: null,
        autoCalculate: true,
        sold_by_unit: soldByUnit,
        bought_by_unit: boughtByUnit,
        unit_prices: unitPrices,
      });
    }

    const tagValues = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: ProductPayload = {
      name: productName.trim(),
      ecom_name: productEcomName.trim() || null,
      auto_generate_sku: autoGenerateSku,
      auto_fetch_img: autoFetchImage,
      sku: autoGenerateSku ? undefined : sku.trim(),
      slug: seoSlug.trim() || productName.trim(),
      weight: weight ? round2(weight) : undefined,
      weight_unit: 2, // lb
      upc: upc.trim() || undefined,
      upc_2: retailUpc1.trim() || undefined,
      upc_3: retailUpc2.trim() || undefined,
      bin: binCode.trim() || undefined,
      zone: zone.trim() || undefined,
      aisle: aisle.trim() || undefined,
      description: description.trim() || productNote.trim() || undefined,
      brand_id: selectedBrandId,
      main_category_id: selectedMainCategoryId,
      category_ids: selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : selectedMainCategoryId
          ? [selectedMainCategoryId]
          : [],
      supplier_ids: selectedSupplierIds,
      manufacturer_ids: selectedManufacturerIds,
      tag_values: tagValues,
      status,
      unit_of_measurement: 10, // UnitOfMeasurement.COUNT = 10 (only valid value on backend)
      is_tax_applicable: isTaxApplicable,
      is_msa_compliant: isMsa,
      is_online: isOnline,
      is_featured: isFeatured,
      is_hot_seller: isHotSeller,
      is_new_arrival: isNewArrival,
      back_order_portal: enableBoProduct,
      back_order_ecom: enableBoOnline,
      channel_info: channelInfo,
      images: [],
      // Mirrors kapp VIDEO_TYPE: YouTube = 5
      video_link: youtubeLink.trim() || undefined,
      video_type: youtubeLink.trim() ? VIDEO_TYPE.YOUTUBE_LINK : undefined,
      product_seo_meta_data: {
        title: metaTitle.trim(),
        description: metaDescription.trim(),
      },
    };

    // Mirrors kapp: include msa_attributes only when is_msa_compliant is true
    if (isMsa) {
      payload.msa_attributes = {
        category_id: selectedMainCategoryId || null,
        category: "",
        product_description: "",
        promotion_description: "",
        promotion_indicator: "N",
        items_per_selling_unit: "",
        dist_comp_shipper_flag: "",
        manufacturer_promo_code: "",
      };
    }

    return payload;
  }, [
    productName, productEcomName, autoGenerateSku, autoFetchImage, sku,
    seoSlug, weight, upc, retailUpc1, retailUpc2, binCode, zone, aisle,
    description, productNote, selectedBrandId, selectedMainCategoryId,
    selectedCategoryIds, selectedSupplierIds, selectedManufacturerIds,
    tags, status, measuredBy, isTaxApplicable, isMsa, isOnline, isFeatured,
    isHotSeller, isNewArrival, enableBoProduct, enableBoOnline, stockData,
    soldBy, boughtBy, buildUnitPrices, youtubeLink, metaTitle, metaDescription,
  ]);

  // ------------------------------------------------------------------
  // Save handler – mirrors kapp AddFormPage.saveProduct
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Calculate Prices – mirrors kapp handleAutoCalculation
  // Divides the bought-by unit's prices down to per-piece, then scales
  // up to every other defined unit.
  // ------------------------------------------------------------------
  const handleCalculatePrices = useCallback(() => {
    const boughtByUnit = unitLabelToId(boughtBy);
    const boughtByIndex = pricingData.findIndex((p) => p.unitId === boughtByUnit);
    if (boughtByIndex === -1) {
      Alert.alert("Info", "Bought-by unit not found in pricing data");
      return;
    }

    const source = pricingData[boughtByIndex];
    const sourceCost = parseFloat(source.netCost);
    const sourceBaseCost = parseFloat(source.baseCost);
    const sourcePrice = parseFloat(source.salePrice);

    if (!sourceCost || !sourcePrice) {
      Alert.alert("Info", "Please enter net cost and sale price for the bought-by unit first");
      return;
    }

    // Build unit definitions for conversion
    const unitPricesForConversion = unitData.map((u) => ({
      unit: u.unitId,
      definition: u.unitId === UNIT.PIECE ? 1 : (parseInt(u.qty) || null),
    }));

    const boughtByLowest = convertToLowest(boughtByUnit, unitPricesForConversion);

    // Per-piece base values
    const ppCost = sourceCost / boughtByLowest;
    const ppBaseCost = sourceBaseCost / boughtByLowest;
    const ppPrice = sourcePrice / boughtByLowest;
    const ppMargin = parseFloat(source.margin || "0") / boughtByLowest;
    const ppMsrp = parseFloat(source.msrp || "0") / boughtByLowest;
    const ppLowest = parseFloat(source.lowestPrice || "0") / boughtByLowest;
    const ppEcom = parseFloat(source.ecomPrice || "0") / boughtByLowest;

    const newPricingData = pricingData.map((p) => {
      if (p.unitId === boughtByUnit) return p; // Don't overwrite the source unit

      const unitLowest = convertToLowest(p.unitId, unitPricesForConversion);
      if (!unitLowest) return p;

      return {
        ...p,
        baseCost: String(round2(ppBaseCost * unitLowest)),
        netCost: String(round2(ppCost * unitLowest)),
        salePrice: String(round2(ppPrice * unitLowest)),
        margin: String(round2(ppMargin * unitLowest)),
        msrp: String(round2(ppMsrp * unitLowest)),
        lowestPrice: String(round2(ppLowest * unitLowest)),
        ecomPrice: String(round2(ppEcom * unitLowest)),
      };
    });

    setPricingData(newPricingData);
    Alert.alert("Success", "Prices calculated based on bought-by unit");
  }, [boughtBy, pricingData, unitData]);

  // Helper: show validation error, switch tab if needed, and scroll to field
  const showValidationError = useCallback((tab: string, message: string, fieldKey?: string) => {
    const needsSwitch = activeTab !== tab;
    if (needsSwitch) {
      setActiveTab(tab);
    }
    // Delay so the tab switch renders & layout completes before scrolling + alert
    const delay = needsSwitch ? 300 : 50;
    setTimeout(() => {
      // Scroll to the target field
      if (fieldKey) {
        const y = fieldYMap.current[fieldKey];
        if (y !== undefined) {
          const scrollRef =
            tab === "basic" ? basicScrollRef
            : tab === "pricing" ? pricingScrollRef
            : tab === "seo" ? seoScrollRef
            : null;
          scrollRef?.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
        }
      }
      Alert.alert("Validation Error", message);
    }, delay);
  }, [activeTab]);

  const handleSave = useCallback(async () => {
    // --- Validation (mirrors kapp Yup schema + handleSaveClick) ---

    // ===== Basic Tab validations =====

    // 1. Product name required (min 2, max 300 chars)
    if (!productName.trim()) {
      showValidationError("basic", "Product name is required", "productName");
      return;
    }
    if (productName.trim().length < 2) {
      showValidationError("basic", "Product name must be at least 2 characters", "productName");
      return;
    }
    if (productName.trim().length > 300) {
      showValidationError("basic", "Product name must be at most 300 characters", "productName");
      return;
    }

    // 2. SKU validation – mirrors kapp: .required + .max(14) + regex
    if (!autoGenerateSku) {
      const trimmedSku = sku.trim();
      if (!trimmedSku) {
        showValidationError("basic", "SKU is required when auto-generate is off", "sku");
        return;
      }
      if (trimmedSku.length > 14) {
        showValidationError("basic", "SKU must be at most 14 characters", "sku");
        return;
      }
      const SKU_REGEX = /^[A-Za-z0-9]+(?:(?:(?!--)[A-Za-z0-9-])+[A-Za-z0-9])?$/;
      if (!SKU_REGEX.test(trimmedSku)) {
        showValidationError("basic", "SKU can only contain letters, numbers, and single hyphens (not at start/end)", "sku");
        return;
      }
    }

    // 3. Category required – mirrors kapp: categories.min(1) + main_category_id.required
    if (!selectedMainCategoryId && selectedCategoryIds.length === 0) {
      showValidationError("basic", "Please select at least one category", "mainCategory");
      return;
    }
    if (!selectedMainCategoryId) {
      showValidationError("basic", "Please select a main category", "mainCategory");
      return;
    }

    // 4. Weight validation – if provided, must be >= 0
    if (weight !== undefined && weight !== null && weight !== "" && Number(weight) < 0) {
      showValidationError("basic", "Weight must be 0 or greater", "weight");
      return;
    }

    // ===== Pricing & Stock Tab validations =====

    // 5. Channel info – at least one channel required
    if (!stockData || stockData.length === 0) {
      showValidationError("pricing", "Please add at least one sales channel", "channels");
      return;
    }

    // 6. Unit name non-empty check – mirrors kapp handleSaveClick
    const unitNameErrors: string[] = [];
    const unitPositionNames = ["First unit", "Second unit", "Third unit", "Fourth unit"];
    unitData.forEach((u, idx) => {
      const hasDef = u.unitId === UNIT.PIECE ? true : !!(parseInt(u.qty) || 0);
      const hasUpc = !!u.upc?.trim();
      if ((hasDef || hasUpc) && (!u.unit || u.unit.trim() === "")) {
        unitNameErrors.push(unitPositionNames[idx] || `Unit ${idx + 1}`);
      }
    });
    if (unitNameErrors.length > 0) {
      showValidationError("pricing", `Please provide unit names for: ${unitNameErrors.join(", ")}`, "unitMeasurement");
      return;
    }

    // 7. Piece unit price validations – cost, base_cost, price required & > 0
    const piecePricing = pricingData.find((p) => p.unitId === UNIT.PIECE);
    if (piecePricing) {
      const cost = parseFloat(piecePricing.netCost as string);
      const baseCost = parseFloat(piecePricing.baseCost as string);
      const price = parseFloat(piecePricing.salePrice as string);
      if (!cost || cost <= 0) {
        showValidationError("pricing", "Piece net cost is required and must be greater than 0", "pricingTable");
        return;
      }
      if (!baseCost || baseCost <= 0) {
        showValidationError("pricing", "Piece base cost is required and must be greater than 0", "pricingTable");
        return;
      }
      if (!price || price <= 0) {
        showValidationError("pricing", "Piece sale price is required and must be greater than 0", "pricingTable");
        return;
      }
      // Max 2 decimal places
      const DECIMAL_2 = /^-?\d+(\.\d{1,2})?$/;
      if (String(piecePricing.netCost).trim() && !DECIMAL_2.test(String(piecePricing.netCost).trim())) {
        showValidationError("pricing", "Net cost can have at most 2 decimal places", "pricingTable");
        return;
      }
      if (String(piecePricing.baseCost).trim() && !DECIMAL_2.test(String(piecePricing.baseCost).trim())) {
        showValidationError("pricing", "Base cost can have at most 2 decimal places", "pricingTable");
        return;
      }
      if (String(piecePricing.salePrice).trim() && !DECIMAL_2.test(String(piecePricing.salePrice).trim())) {
        showValidationError("pricing", "Sale price can have at most 2 decimal places", "pricingTable");
        return;
      }
    }

    // ===== SEO Tab validations =====

    // 8. Slug max length
    if (seoSlug && seoSlug.length > 100) {
      showValidationError("seo", "SEO slug must be at most 100 characters", "seoSlug");
      return;
    }

    // 9. YouTube link format validation
    if (youtubeLink && youtubeLink.trim()) {
      const YT_REGEX = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu\.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
      if (!YT_REGEX.test(youtubeLink.trim())) {
        showValidationError("basic", "Please enter a valid YouTube URL", "youtubeLink");
        return;
      }
    }

    // ===== MSA validations (Basic tab switches) =====
    if (isMsa) {
      if (!selectedMainCategoryId) {
        showValidationError("basic", "MSA category is required when Is MSA is enabled", "mainCategory");
        return;
      }
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const { data } = await createProduct(payload);

      Alert.alert("Success", data.message || "Product created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const axErr = error as AxiosError;
      console.warn("[AddProduct] Save failed:", axErr?.response?.status, JSON.stringify(axErr?.response?.data));
      const messages = parseProductApiError(axErr);
      Alert.alert("Error", messages.join("\n"));
    } finally {
      setSaving(false);
    }
  }, [productName, autoGenerateSku, sku, selectedMainCategoryId, selectedCategoryIds,
    unitData, pricingData, stockData, weight, seoSlug, youtubeLink, isMsa, activeTab,
    buildPayload, router, showValidationError]);

  const categoryTree = useMemo(() => buildCategoryTree(categoriesList), [categoriesList]);

  // Defined units for Sold By / Bought By dropdowns.
  // In kapp, all 4 unit_prices have unit_name pre-populated ("Piece","Pack","Case","Pallet"),
  // so getDefinedUnits() always returns all 4.  We mirror that behaviour here.
  const definedUnits = useMemo(() => unitData, [unitData]);
  const parentCategoryOptions = useMemo(() => {
    const flatten = (nodes: CategoryNode[], depth = 0): Array<{ id: number; label: string }> => {
      return nodes.flatMap((node) => {
        const prefix = depth > 0 ? `${"—".repeat(depth)} ` : "";
        const current = { id: node.id, label: `${prefix}${node.name}` };
        const children = node.children?.length ? flatten(node.children, depth + 1) : [];
        return [current, ...children];
      });
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  const getAllParentIds = useCallback((categoryId: number, tree: CategoryNode[]): number[] => {
    const findParents = (id: number, nodes: CategoryNode[], path: number[] = []): number[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.id];
        if (node.id === id) return path;
        if (node.children?.length) {
          const result = findParents(id, node.children, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    return findParents(categoryId, tree) || [];
  }, []);

  const toggleCategorySelection = useCallback((cat: CategoryNode) => {
    const isSelected = selectedCategoryIds.includes(cat.id);
    const isMain = selectedMainCategoryId === cat.id;

    if (isSelected) {
      const newSelectedIds = selectedCategoryIds.filter((id) => id !== cat.id);
      setSelectedCategoryIds(newSelectedIds);

      if (isMain) {
        setSelectedMainCategoryId(newSelectedIds.length > 0 ? newSelectedIds[0] : null);
      } else if (selectedMainCategoryId && !newSelectedIds.includes(selectedMainCategoryId)) {
        setSelectedMainCategoryId(newSelectedIds.length > 0 ? newSelectedIds[0] : null);
      }
    } else {
      const parentIds = getAllParentIds(cat.id, categoryTree);
      const idsToAdd = [cat.id, ...parentIds].filter((id) => !selectedCategoryIds.includes(id));
      const newSelectedIds = [...selectedCategoryIds, ...idsToAdd];
      setSelectedCategoryIds(newSelectedIds);

      if (!selectedMainCategoryId || !newSelectedIds.includes(selectedMainCategoryId)) {
        setSelectedMainCategoryId(cat.id);
      }
    }
  }, [selectedCategoryIds, selectedMainCategoryId, categoryTree, getAllParentIds]);

  const renderCategoryNode = (cat: CategoryNode, depth: number) => {
    const isSelected = selectedCategoryIds.includes(cat.id);
    const isMain = selectedMainCategoryId === cat.id;
    const hasChildren = !!cat.children?.length;
    const isExpanded = expandedCategoryIds.includes(cat.id);

    return (
      <View key={cat.id}>
        <View className={`rounded-lg ${isSelected ? "bg-red-50" : "bg-transparent"}`}>
          <View
            className="flex-row items-center py-2.5 pr-2"
            style={{ paddingLeft: depth * 12 }}
          >
            <Pressable
              className="w-5 h-5 items-center justify-center mr-1"
              onPress={() => {
                if (!hasChildren) return;
                setExpandedCategoryIds((prev) =>
                  prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                );
              }}
              hitSlop={8}
            >
              {hasChildren ? (
                <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={14} color="#9CA3AF" />
              ) : (
                <View className="w-5 h-5" />
              )}
            </Pressable>

            <Pressable
              className="flex-row items-center flex-1"
              onPress={() => toggleCategorySelection(cat)}
            >
              <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${isSelected ? "bg-red-500 border-red-500" : "border-gray-300"}`}>
                {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text className={`text-sm flex-1 ${isSelected ? "text-gray-800 font-medium" : "text-gray-600"}`} numberOfLines={1}>
                {cat.name}
              </Text>
              {isMain && (
                <View className="bg-red-500 rounded px-1.5 py-0.5 ml-2">
                  <Text className="text-white text-[10px] font-bold">Main</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {hasChildren && isExpanded && cat.children?.map((child) => renderCategoryNode(child, depth + 1))}
      </View>
    );
  };


  // Render Basic Tab Content
  const renderBasicTab = () => (
    <View className="flex-1 flex-row">
      {/* Left Sidebar - Category (mirrors kapp CategoryTree) */}
      <View className="w-56 bg-[#F7F7F9] border-r border-gray-200 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-medium">
            Select Category<Text className="text-red-500">*</Text>
          </Text>
          <Pressable 
            className="w-6 h-6 rounded-full bg-red-50 items-center justify-center"
            onPress={() => setShowAddCategoryModal(true)}
          >
            <Ionicons name="add" size={16} color="#EC1A52" />
          </Pressable>
        </View>

        {categoryTree.length === 0 ? (
          <View className="flex-row items-center py-3">
            <Text className="text-gray-500 text-sm flex-1">No Category Found</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator>
            {categoryTree.map((cat) => renderCategoryNode(cat, 0))}
          </ScrollView>
        )}
      </View>

      {/* Main Form */}
      <ScrollView ref={basicScrollRef} className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Status toggle row — mirrors kapp PRODUCT_STATUS: ACTIVE=1, INACTIVE=2, DISCONTINUED=3 */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-lg font-semibold text-gray-800">General Information</Text>
          <Pressable
            className="rounded-lg px-4 py-2 flex-row items-center"
            style={{
              backgroundColor:
                status === 1 ? "#1F2937"    // ACTIVE  – dark
                : status === 2 ? "#9CA3AF"  // INACTIVE – gray
                : "#F59E0B",                 // DISCONTINUED – amber
            }}
            onPress={() => setStatus(status === 1 ? 2 : status === 2 ? 3 : 1)}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 6,
                backgroundColor:
                  status === 1 ? "#22C55E"     // green dot
                  : status === 2 ? "#EF4444"   // red dot
                  : "transparent",
                borderWidth: status === 3 ? 1.5 : 0,
                borderColor: status === 3 ? "#FFFFFF" : "transparent",
              }}
            />
            <Text className="text-white font-medium mr-2">
              {status === 1 ? "ACTIVE" : status === 2 ? "INACTIVE" : "DISCONTINUED"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="white" />
          </Pressable>
        </View>

        {/* Row 1: Product Name, Alias, Product Ecom Name */}
        <View className="flex-row gap-4" onLayout={(e) => trackFieldLayout("productName", e.nativeEvent.layout.y)}>
          <View className="flex-1">
            <FormInput
              label="Product Name"
              required
              info
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Alias"
              info
              placeholder="Alias Name"
              value={alias}
              onChangeText={setAlias}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Product Ecom Name"
              placeholder="Product Ecom Name"
              value={productEcomName}
              onChangeText={setProductEcomName}
            />
          </View>
        </View>

        {/* Row 2: SKU, Weight, Select Brand */}
        <View className="flex-row gap-4" onLayout={(e) => trackFieldLayout("sku", e.nativeEvent.layout.y)}>
          <View className="flex-1">
            <FormInput
              label="SKU"
              info
              placeholder="SKU"
              value={sku}
              onChangeText={setSku}
              disabled={autoGenerateSku}
            />
            <Pressable 
              className="flex-row items-center mt-1"
              onPress={() => setAutoGenerateSku(!autoGenerateSku)}
            >
              <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${autoGenerateSku ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                {autoGenerateSku && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text className="text-gray-600 text-sm">Auto generated SKU</Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Weight</Text>
              <View className="flex-row">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-l-lg px-4 py-3 shadow-sm"
                  placeholder="Enter Weight"
                  placeholderTextColor="#9ca3af"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
                <Pressable className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg px-3 flex-row items-center">
                  <Text className="text-gray-600 mr-1">lb</Text>
                  <Ionicons name="chevron-down" size={14} color="#6B7280" />
                </Pressable>
              </View>
            </View>
          </View>
          <View className="flex-1">
            {/* Brand picker — shows list from brandsList */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Text className="text-gray-700 text-sm font-medium">Select Brand</Text>
              </View>
              <Pressable
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                onPress={() => {
                  if (brandsList.length === 0) return;
                  // Cycle through brands or show picker
                  const currentIdx = brandsList.findIndex((b) => b.id === selectedBrandId);
                  const nextIdx = (currentIdx + 1) % brandsList.length;
                  setSelectedBrandId(brandsList[nextIdx].id);
                }}
                onLongPress={() => setSelectedBrandId(null)}
              >
                <Text className={selectedBrandId ? "text-gray-800" : "text-gray-400"}>
                  {selectedBrandId
                    ? brandsList.find((b) => b.id === selectedBrandId)?.name || "Select"
                    : "Select"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
              {selectedBrandId && (
                <Pressable className="mt-1" onPress={() => setSelectedBrandId(null)}>
                  <Text className="text-red-400 text-xs">Clear</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Row 3: UPC, Retail UPC 1, Retail UPC 2 */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="UPC"
              info
              placeholder="Enter UPC"
              value={upc}
              onChangeText={setUpc}
            />
            <Pressable 
              className="flex-row items-center mt-1"
              onPress={() => setAutoFetchImage(!autoFetchImage)}
            >
              <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${autoFetchImage ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                {autoFetchImage && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text className="text-gray-600 text-sm">Auto fetch image</Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <FormInput
              label="Retail UPC 1"
              placeholder="Retail UPC 1"
              value={retailUpc1}
              onChangeText={setRetailUpc1}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Retail UPC 2"
              placeholder="Retail UPC 2"
              value={retailUpc2}
              onChangeText={setRetailUpc2}
            />
          </View>
        </View>

        {/* Row 4: Bin Code, Zone, Aisle */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Bin Code"
              info
              placeholder="Bin Code"
              value={binCode}
              onChangeText={setBinCode}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Zone"
              placeholder="Enter Zone"
              value={zone}
              onChangeText={setZone}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Aisle"
              placeholder="Enter Aisle"
              value={aisle}
              onChangeText={setAisle}
            />
          </View>
        </View>

        {/* Row 5: Manufacturer, Select Suppliers, Select Main Category */}
        <View className="flex-row gap-4" onLayout={(e) => trackFieldLayout("mainCategory", e.nativeEvent.layout.y)}>
          {/* Manufacturer picker */}
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Manufacturer</Text>
              <Pressable
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                onPress={() => {
                  if (manufacturersList.length === 0) return;
                  const currentIdx = manufacturersList.findIndex((m) => selectedManufacturerIds.includes(m.id));
                  const nextIdx = (currentIdx + 1) % manufacturersList.length;
                  setSelectedManufacturerIds([manufacturersList[nextIdx].id]);
                }}
                onLongPress={() => setSelectedManufacturerIds([])}
              >
                <Text className={selectedManufacturerIds.length ? "text-gray-800" : "text-gray-400"} numberOfLines={1}>
                  {selectedManufacturerIds.length
                    ? manufacturersList.find((m) => m.id === selectedManufacturerIds[0])?.name || "Select"
                    : "Select"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
              {selectedManufacturerIds.length > 0 && (
                <Pressable className="mt-1" onPress={() => setSelectedManufacturerIds([])}>
                  <Text className="text-red-400 text-xs">Clear</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Suppliers picker */}
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Select Suppliers</Text>
              <Pressable
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                onPress={() => {
                  if (suppliersList.length === 0) return;
                  const currentIdx = suppliersList.findIndex((s) => selectedSupplierIds.includes(s.id));
                  const nextIdx = (currentIdx + 1) % suppliersList.length;
                  setSelectedSupplierIds([suppliersList[nextIdx].id]);
                }}
                onLongPress={() => setSelectedSupplierIds([])}
              >
                <Text className={selectedSupplierIds.length ? "text-gray-800" : "text-gray-400"} numberOfLines={1}>
                  {selectedSupplierIds.length
                    ? suppliersList.find((s) => s.id === selectedSupplierIds[0])?.name || "Select"
                    : "Select"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
              {selectedSupplierIds.length > 0 && (
                <Pressable className="mt-1" onPress={() => setSelectedSupplierIds([])}>
                  <Text className="text-red-400 text-xs">Clear</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Main Category picker */}
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Select Main Category<Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                onPress={() => {
                  if (selectedCategoryIds.length === 0) {
                    Alert.alert("Info", "Please select categories from the left panel first");
                    return;
                  }
                  setShowMainCategoryModal(true);
                }}
              >
                <Text className={selectedMainCategoryId ? "text-gray-800" : "text-gray-400"} numberOfLines={1}>
                  {selectedMainCategoryId
                    ? categoriesList.find((c) => c.id === selectedMainCategoryId)?.name || "Select"
                    : "Select"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Row 6: Tags, Product Note */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormInput
              label="Tags"
              info
              placeholder="Tags"
              value={tags}
              onChangeText={setTags}
            />
          </View>
          <View className="flex-[2]">
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">Product Note</Text>
              <TextInput
                className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Place note here"
                placeholderTextColor="#9ca3af"
                value={productNote}
                onChangeText={setProductNote}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>
        </View>

        {/* Switches Row */}
        <View className="flex-row flex-wrap mb-6">
          <FormSwitch label="Is MSA" value={isMsa} onValueChange={setIsMsa} />
          <FormSwitch label="Enable BO product" value={enableBoProduct} onValueChange={setEnableBoProduct} />
          <FormSwitch label="Is Tax Applicable" value={isTaxApplicable} onValueChange={setIsTaxApplicable} />
        </View>

        {/* Ecommerce Section */}
        <Text className="text-lg font-semibold text-gray-800 mb-4">Ecommerce</Text>
        <View className="flex-row flex-wrap mb-4">
          <FormSwitch label="Online" value={isOnline} onValueChange={setIsOnline} />
          <FormSwitch label="Featured" value={isFeatured} onValueChange={setIsFeatured} />
          <FormSwitch label="Is Hot Seller" value={isHotSeller} onValueChange={setIsHotSeller} />
          <FormSwitch label="New Arrival" value={isNewArrival} onValueChange={setIsNewArrival} />
        </View>
        <View className="mb-6">
          <FormSwitch label="Enable BO for Online site" value={enableBoOnline} onValueChange={setEnableBoOnline} />
        </View>

        {/* Detail Product Description */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">Detail Product Description</Text>
          <Pressable
            className="border border-gray-300 rounded-lg px-4 py-2 flex-row items-center"
            style={generatingDescription ? { opacity: 0.6 } : {}}
            disabled={generatingDescription}
            onPress={async () => {
              if (!productName.trim()) {
                Alert.alert("Info", "Please enter product name to get description");
                return;
              }
              if (!selectedMainCategoryId) {
                Alert.alert("Info", "Please select category to get description");
                return;
              }
              const brandName = selectedBrandId
                ? brandsList.find((b) => b.id === selectedBrandId)?.name
                : undefined;
              try {
                setGeneratingDescription(true);
                const { data } = await generateProductDescription({
                  product_name: productName.trim(),
                  brand_name: brandName || undefined,
                  main_category_id: selectedMainCategoryId,
                });
                if (data.description) {
                  setDescription(data.description);
                }
              } catch (err: any) {
                Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to generate description");
              } finally {
                setGeneratingDescription(false);
              }
            }}
          >
            {generatingDescription && <ActivityIndicator size="small" color="#6B7280" style={{ marginRight: 6 }} />}
            <Text className="text-gray-600">{generatingDescription ? "Generating..." : "Generate Description"}</Text>
          </Pressable>
        </View>
        <TextInput
          className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6 shadow-sm"
          placeholder="Enter product description..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />

        {/* Youtube Link */}
        <View className="mb-6 flex-row items-center" onLayout={(e) => trackFieldLayout("youtubeLink", e.nativeEvent.layout.y)}>
          <Text className="text-gray-700 text-sm font-medium mr-3" style={{ width: 90 }}>Youtube Link</Text>
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            placeholder="Enter youtube link"
            placeholderTextColor="#9ca3af"
            value={youtubeLink}
            onChangeText={setYoutubeLink}
          />
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );

  // Render Pricing & Stock Tab Content
  const renderPricingTab = () => (
    <ScrollView ref={pricingScrollRef} className="flex-1 bg-[#F7F7F9]" showsVerticalScrollIndicator={false}>
      {/* Define Unit of Measurement Section */}
      <View className="bg-[#F7F7F9] m-4 rounded-lg border border-gray-200" onLayout={(e) => trackFieldLayout("unitMeasurement", e.nativeEvent.layout.y)}>
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setMeasurementExpanded(!measurementExpanded)}
        >
          <Text className="text-lg font-semibold text-gray-800">Define Unit of Measurement</Text>
          <Ionicons name={measurementExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {measurementExpanded && (
          <View className="p-4">
            {/* Measured By */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm mb-2">
                This product is measured by<Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center w-48"
                onPress={() => openPicker(
                  "Measured By",
                  [{ label: "Count", value: "Count" }],
                  measuredBy,
                  (v) => setMeasuredBy(v),
                )}
              >
                <Text className="text-gray-800">{measuredBy}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Units Table */}
            <View>
              {/* Header */}
              <View className="flex-row py-2 border-b border-gray-200">
                <Text className="w-20 text-gray-600 text-sm font-medium">Unit</Text>
                <Text className="w-40 text-gray-600 text-sm font-medium">Packaging Quantity</Text>
                <Text className="flex-1 text-gray-600 text-sm font-medium">UPC*</Text>
              </View>
              
              {/* Rows */}
              {unitData.map((item, index) => (
                <View key={item.unit} className="flex-row items-center py-3 border-b border-gray-100">
                  <Text className="w-20 text-gray-700">{item.unit}</Text>
                  <View className="w-40 flex-row items-center">
                    <TextInput
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 w-20 shadow-sm"
                      placeholder={index === 0 ? "1" : "Enter Q..."}
                      placeholderTextColor="#9ca3af"
                      value={item.qty}
                      onChangeText={(text) => {
                        const newData = [...unitData];
                        newData[index].qty = text;
                        setUnitData(newData);
                      }}
                      editable={index !== 0}
                      keyboardType="numeric"
                    />
                    {item.qtyLabel && (
                      <Text className="text-gray-500 text-sm ml-2">= {item.qtyLabel}</Text>
                    )}
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 ml-4 shadow-sm"
                    placeholder="UPC"
                    placeholderTextColor="#9ca3af"
                    value={item.upc}
                    onChangeText={(text) => {
                      const newData = [...unitData];
                      newData[index].upc = text;
                      setUnitData(newData);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Define Pricing Section */}
      <View className="bg-[#F7F7F9] mx-4 mb-4 rounded-lg border border-gray-200" onLayout={(e) => trackFieldLayout("pricingTable", e.nativeEvent.layout.y)}>
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setPricingExpanded(!pricingExpanded)}
        >
          <Text className="text-lg font-semibold text-gray-800">Define Pricing</Text>
          <Ionicons name={pricingExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {pricingExpanded && (
          <View className="p-4">
            {/* Channel Tabs — mirrors kapp channel TabPane */}
            <View className="flex-row mb-4 border-b border-gray-200">
              {stockData.map((ch, idx) => {
                const isActiveChannel = activePricingChannel === idx;
                return (
                  <Pressable
                    key={ch.channelId}
                    className="mr-1 px-4 pb-2"
                    onPress={() => setActivePricingChannel(idx)}
                  >
                    <Text className={`text-sm font-medium ${isActiveChannel ? "text-red-500" : "text-gray-500"}`}>
                      {ch.warehouse}
                    </Text>
                    {isActiveChannel && (
                      <View className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: "#EC1A52" }} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Sold By & Bought By */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">
                  This product is sold by<Text className="text-red-500">*</Text>
                </Text>
                <Pressable
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                  onPress={() => openPicker(
                    "This product is sold by",
                    definedUnits.map((u) => ({ label: u.unit, value: u.unit })),
                    soldBy,
                    (v) => setSoldBy(v),
                  )}
                >
                  <Text className="text-gray-800">{soldBy}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">
                  This product is bought by<Text className="text-red-500">*</Text>
                </Text>
                <Pressable
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                  onPress={() => openPicker(
                    "This product is bought by",
                    definedUnits.map((u) => ({ label: u.unit, value: u.unit })),
                    boughtBy,
                    (v) => setBoughtBy(v),
                  )}
                >
                  <Text className="text-gray-800">{boughtBy}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-1 justify-end">
                <Pressable 
                  className="flex-row items-center justify-center px-4 py-3 rounded-lg"
                  style={{ backgroundColor: "#8B5CF6" }}
                  onPress={handleCalculatePrices}
                >
                  <Ionicons name="calculator-outline" size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Calculate Prices</Text>
                </Pressable>
              </View>
            </View>

            {/* Pricing Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header */}
                <View className="flex-row py-3 border-b border-gray-200 bg-[#F7F7F9] shadow-sm">
                  <Text className="w-16 text-gray-600 text-xs font-medium">Unit</Text>
                  <Text className="w-28 text-gray-600 text-xs font-medium">Packaging Quantity</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Base Cost Price* ($)</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Net Cost Price* ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Sale Price* ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Margin* ($)</Text>
                  <Text className="w-16 text-gray-600 text-xs font-medium">MSRP</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Lowest Selling Price</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Ecom Price</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 1 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 2 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 3 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 4 SP ($)</Text>
                  <Text className="w-20 text-gray-600 text-xs font-medium">Tier 5 SP ($)</Text>
                </View>
                
                {/* Rows */}
                {pricingData.map((item, index) => {
                  const updatePricing = (field: string, value: string) => {
                    const newData = [...pricingData];
                    (newData[index] as any)[field] = value;
                    setPricingData(newData);
                  };
                  return (
                  <View key={item.unit} className="flex-row items-center py-2 border-b border-gray-100">
                    <Text className="w-16 text-gray-700 text-sm">{item.unit}</Text>
                    <View className="w-28 flex-row items-center">
                      <TextInput
                        className="bg-gray-100 border border-gray-200 rounded px-2 py-1.5 w-12 text-sm"
                        placeholder={index === 0 ? "1" : "Qty"}
                        placeholderTextColor="#9ca3af"
                        value={item.qty}
                        editable={index !== 0}
                        onChangeText={(text) => updatePricing("qty", text)}
                        keyboardType="numeric"
                      />
                      {item.qtyLabel && (
                        <Text className="text-gray-400 text-xs ml-1">= {item.qtyLabel}</Text>
                      )}
                    </View>
                    <TextInput className="w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm" placeholder="Base ..." placeholderTextColor="#d1d5db" value={item.baseCost} onChangeText={(v) => updatePricing("baseCost", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Net c..." placeholderTextColor="#d1d5db" value={item.netCost} onChangeText={(v) => updatePricing("netCost", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Price" placeholderTextColor="#d1d5db" value={item.salePrice} onChangeText={(v) => updatePricing("salePrice", v)} keyboardType="decimal-pad" />
                    <View className="w-20 flex-row items-center ml-1">
                      <TextInput className="flex-1 bg-white border border-gray-200 rounded-l px-2 py-1.5 text-sm" placeholder="Margin" placeholderTextColor="#d1d5db" value={item.margin} onChangeText={(v) => updatePricing("margin", v)} keyboardType="decimal-pad" />
                      <Pressable className="bg-gray-100 border border-l-0 border-gray-200 rounded-r px-1 py-1.5">
                        <Text className="text-gray-500 text-xs">$</Text>
                      </Pressable>
                    </View>
                    <TextInput className="w-16 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="MSRP" placeholderTextColor="#d1d5db" value={item.msrp} onChangeText={(v) => updatePricing("msrp", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Lowest..." placeholderTextColor="#d1d5db" value={item.lowestPrice} onChangeText={(v) => updatePricing("lowestPrice", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1" placeholder="Ecom ..." placeholderTextColor="#d1d5db" value={item.ecomPrice} onChangeText={(v) => updatePricing("ecomPrice", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1 shadow-sm" placeholder="Tier 1" placeholderTextColor="#d1d5db" value={item.tier1} onChangeText={(v) => updatePricing("tier1", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1 shadow-sm" placeholder="Tier 2" placeholderTextColor="#d1d5db" value={item.tier2} onChangeText={(v) => updatePricing("tier2", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1 shadow-sm" placeholder="Tier 3" placeholderTextColor="#d1d5db" value={item.tier3} onChangeText={(v) => updatePricing("tier3", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1 shadow-sm" placeholder="Tier 4" placeholderTextColor="#d1d5db" value={item.tier4} onChangeText={(v) => updatePricing("tier4", v)} keyboardType="decimal-pad" />
                    <TextInput className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm ml-1 shadow-sm" placeholder="Tier 5" placeholderTextColor="#d1d5db" value={item.tier5} onChangeText={(v) => updatePricing("tier5", v)} keyboardType="decimal-pad" />
                  </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Stock Information Section */}
      <View className="bg-[#F7F7F9] mx-4 mb-4 rounded-lg border border-gray-200" onLayout={(e) => trackFieldLayout("channels", e.nativeEvent.layout.y)}>
        <Pressable 
          className="flex-row items-center justify-between p-4 border-b border-gray-100"
          onPress={() => setStockExpanded(!stockExpanded)}
        >
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-gray-800">Stock Information</Text>
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </View>
          <Ionicons name={stockExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
        </Pressable>
        
        {stockExpanded && (
          <View className="p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header */}
                <View className="flex-row py-3 border-b border-gray-200 bg-[#F7F7F9] shadow-sm">
                  <Text className="w-16 text-gray-600 text-xs font-medium">Sr no.</Text>
                  <Text className="w-40 text-gray-600 text-xs font-medium">Warehouses/Storefront</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Available Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">On hold Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Damaged Qty</Text>
                  <Text className="w-24 text-gray-600 text-xs font-medium">Back Order Qty</Text>
                  <Text className="w-28 text-gray-600 text-xs font-medium">Coming Soon Qty</Text>
                </View>
                
                {/* Rows */}
                {stockData.map((item, index) => (
                  <View key={index} className="flex-row items-center py-3 border-b border-gray-100">
                    <Text className="w-16 text-gray-700 text-sm">{item.srNo}</Text>
                    <View className="w-40">
                      <TextInput
                        className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm"
                        value={item.warehouse}
                        editable={false}
                      />
                    </View>
                    <TextInput
                      className="w-24 bg-white border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.availableQty}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newData = [...stockData];
                        newData[index].availableQty = text;
                        setStockData(newData);
                      }}
                    />
                    <TextInput
                      className="w-24 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.onHoldQty}
                      editable={false}
                    />
                    <TextInput
                      className="w-24 bg-white border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={item.damagedQty}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newData = [...stockData];
                        newData[index].damagedQty = text;
                        setStockData(newData);
                      }}
                    />
                    <TextInput
                      className="w-24 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="Back Order"
                      placeholderTextColor="#d1d5db"
                      editable={false}
                    />
                    <TextInput
                      className="w-28 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm ml-1"
                      placeholder="Coming Soon"
                      placeholderTextColor="#d1d5db"
                      editable={false}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Bottom spacing */}
      <View className="h-10" />
    </ScrollView>
  );

  // Render SEO Tab Content
  const renderSeoTab = () => (
    <ScrollView ref={seoScrollRef} className="flex-1 bg-[#F7F7F9] p-6" showsVerticalScrollIndicator={false}>
      <View className="bg-[#F7F7F9] rounded-lg border border-gray-200 p-6">
        {/* Slug */}
        <View className="mb-6" onLayout={(e) => trackFieldLayout("seoSlug", e.nativeEvent.layout.y)}>
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-700 text-sm font-medium">Slug</Text>
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </View>
          <TextInput
            className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Product Slug"
            placeholderTextColor="#d1d5db"
            value={seoSlug}
            onChangeText={setSeoSlug}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{seoSlug.length} character(s)</Text>
        </View>

        {/* Meta Title */}
        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-2">Meta Title</Text>
          <TextInput
            className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Meta Title for Product"
            placeholderTextColor="#d1d5db"
            value={metaTitle}
            onChangeText={setMetaTitle}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{metaTitle.length} character(s)</Text>
        </View>

        {/* Meta Description */}
        <View className="mb-2">
          <Text className="text-gray-700 text-sm font-medium mb-2">Meta Description</Text>
          <TextInput
            className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
            placeholder="Enter Meta Description for Product"
            placeholderTextColor="#d1d5db"
            value={metaDescription}
            onChangeText={setMetaDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">{metaDescription.length} character(s)</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Render Promotions Tab Content
  // Mirrors kapp PromotionsSectionCard + PromotionsSectionListTable + filters
  const renderPromotionsTab = () => {
    // Helper: format promo value display – mirrors kapp PROMOTION_VALUE_TYPE render
    const formatPromoValue = (row: PromotionRow) => {
      for (const key of Object.keys(PROMOTION_VALUE_TYPE)) {
        const vt = PROMOTION_VALUE_TYPE[key];
        if (row.value_type === vt.value) {
          const suffix = vt.value !== PROMOTION_VALUE_TYPE.PERCENTAGE_DISCOUNT.value ? " $" : "";
          return `${row.value}${suffix} (${vt.type})`;
        }
      }
      return String(row.value ?? "");
    };

    // Helper: format applicable_for – mirrors kapp ApplicableForColumnFormatter
    const formatApplicableFor = (value: number) => {
      for (const key of Object.keys(SALE_ORDER_SOURCE)) {
        if (SALE_ORDER_SOURCE[key].value === value) return SALE_ORDER_SOURCE[key].name;
      }
      return "";
    };

    // Helper: format date string – simple MM/DD/YYYY HH:mm
    const formatDT = (dt: string | null) => {
      if (!dt) return "";
      try {
        const d = new Date(dt);
        if (isNaN(d.getTime())) return dt;
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${mm}/${dd}/${yyyy} ${hh}:${mi}`;
      } catch { return dt || ""; }
    };

    // Helper: get promotion status badge info
    const getStatusBadge = (statusValue: number) => {
      for (const key of Object.keys(PROMOTION_STATUS)) {
        if (PROMOTION_STATUS[key].value === statusValue) return PROMOTION_STATUS[key];
      }
      return null;
    };

    // Toggle a status filter chip
    const toggleStatusFilter = (value: number) => {
      setPromotionStatusFilter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      );
    };

    return (
      <View className="flex-1 bg-[#F7F7F9]">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Search & Filter Section */}
            <View className="bg-[#F7F7F9] rounded-lg border border-gray-200 p-4 mb-4">
              <Text className="text-gray-800 font-medium mb-3">Search Promotions</Text>
              <View className="flex-row gap-3">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5"
                  placeholder="Search"
                  placeholderTextColor="#9ca3af"
                  value={promotionSearch}
                  onChangeText={setPromotionSearch}
                />
                <Pressable
                  className="flex-row items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300"
                  onPress={() => setShowAdvanceFilters(!showAdvanceFilters)}
                >
                  <Ionicons name="filter" size={16} color="#374151" />
                  <Text className="text-gray-700 font-medium">Advance Filters</Text>
                </Pressable>
              </View>

              {/* Advance Filters Panel */}
              {showAdvanceFilters && (
                <View className="mt-4 bg-[#F7F7F9] border border-gray-200 rounded-lg p-4">
                  <Text className="text-lg font-semibold text-gray-800 mb-4">Advance Filters</Text>

                  {/* Status multi-select chips */}
                  <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-medium mb-2">Status</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {Object.keys(PROMOTION_STATUS).map((key) => {
                        const st = PROMOTION_STATUS[key];
                        const selected = promotionStatusFilter.includes(st.value);
                        return (
                          <Pressable
                            key={key}
                            className="px-4 py-2 rounded-full border"
                            style={{
                              backgroundColor: selected ? st.color : "#fff",
                              borderColor: selected ? st.textColor : "#D1D5DB",
                            }}
                            onPress={() => toggleStatusFilter(st.value)}
                          >
                            <Text style={{ color: selected ? st.textColor : "#6B7280", fontWeight: selected ? "600" : "400" }}>
                              {st.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Active filter tags preview */}
                  {promotionStatusFilter.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mb-3">
                      {promotionStatusFilter.map((v) => {
                        const badge = getStatusBadge(v);
                        return badge ? (
                          <View key={v} className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: badge.color }}>
                            <Text style={{ color: badge.textColor, fontSize: 12 }}>{badge.name}</Text>
                            <Pressable onPress={() => toggleStatusFilter(v)} className="ml-1">
                              <Ionicons name="close-circle" size={14} color={badge.textColor} />
                            </Pressable>
                          </View>
                        ) : null;
                      })}
                    </View>
                  )}

                  <View className="flex-row gap-3">
                    <Pressable
                      className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
                      onPress={() => {
                        setPromotionStatusFilter([]);
                        setPromotionSearch("");
                        setShowAdvanceFilters(false);
                      }}
                    >
                      <Text className="text-gray-700 font-medium">Clear Filter</Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 py-3 rounded-lg items-center"
                      style={{ backgroundColor: "#EC1A52" }}
                      onPress={() => {
                        setShowAdvanceFilters(false);
                        loadPromotions();
                      }}
                    >
                      <Text className="text-white font-medium">Apply</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Info banner for new product (no productId yet) */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text className="text-blue-700 text-sm ml-2 flex-1">
                Promotions will be available after the product is saved. You can link promotions from the Marketing module.
              </Text>
            </View>


            {/* Loading Indicator */}
            {promotionsLoading && (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#EC1A52" />
              </View>
            )}

            {/* Promotions Table */}
            {!promotionsLoading && (
              <View className="bg-[#F7F7F9] rounded-lg border border-gray-200">
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 1100 }}>
                    {/* Table Header – mirrors kapp columns */}
                    <View className="flex-row bg-[#F7F7F9] py-3 px-4 border-b border-gray-200 shadow-sm">
                      <Text className="text-gray-500 text-xs font-semibold uppercase" style={{ width: 180 }}>Promotion Name</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase" style={{ width: 150 }}>Promo Price</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 100 }}>Applied To</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 80 }}>Unit</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 130 }}>Start Date</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 130 }}>End Date</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 90 }}>Total Qty</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 80 }}>POS Qty</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 90 }}>Ecom Qty</Text>
                      <Text className="text-gray-500 text-xs font-semibold uppercase text-center" style={{ width: 80 }}>Status</Text>
                    </View>

                    {/* Empty State */}
                    {promotionRows.length === 0 && (
                      <View className="py-20 items-center justify-center">
                        <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-base">No Data</Text>
                      </View>
                    )}

                    {/* Data Rows */}
                    {promotionRows.map((row, index) => {
                      const badge = getStatusBadge(row.promotion_status);
                      return (
                        <View key={`${row.promotion_id}-${row.promotion_detail_id}-${index}`} className="flex-row items-center py-3 px-4 border-b border-gray-100">
                          <Text className="text-gray-800 text-sm" style={{ width: 180 }} numberOfLines={2}>{row.name}</Text>
                          <Text className="text-gray-700 text-sm" style={{ width: 150 }}>{formatPromoValue(row)}</Text>
                          <Text className="text-gray-700 text-sm text-center" style={{ width: 100 }}>{formatApplicableFor(row.applicable_for)}</Text>
                          <Text className="text-gray-700 text-sm text-center" style={{ width: 80 }}>{UNIT_NAMES[row.unit_price?.unit ?? 0] || ""}</Text>
                          <Text className="text-gray-600 text-xs text-center" style={{ width: 130 }}>{formatDT(row.start_datetime)}</Text>
                          <Text className="text-gray-600 text-xs text-center" style={{ width: 130 }}>{formatDT(row.end_datetime)}</Text>
                          <Text className="text-gray-700 text-sm text-center" style={{ width: 90 }}>{Number(row.total_sold)}</Text>
                          <Text className="text-gray-700 text-sm text-center" style={{ width: 80 }}>{Number(row.total_tenant_sold)}</Text>
                          <Text className="text-gray-700 text-sm text-center" style={{ width: 90 }}>{Number(row.total_ecom_sold)}</Text>
                          <View style={{ width: 80, alignItems: "center" }}>
                            {badge ? (
                              <View className="px-2 py-1 rounded" style={{ backgroundColor: badge.color }}>
                                <Text style={{ color: badge.textColor, fontSize: 11, fontWeight: "600" }}>{badge.name}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Total count footer */}
                {promotionRows.length > 0 && (
                  <View className="flex-row justify-between items-center px-4 py-3 border-t border-gray-200 bg-[#F7F7F9] shadow-sm">
                    <Text className="text-gray-500 text-sm">
                      Showing {promotionRows.length} of {promotionsTotalCount} promotion(s)
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render placeholder for other tabs
  const renderPlaceholderTab = (tabName: string) => (
    <View className="flex-1 items-center justify-center">
      <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
      <Text className="text-gray-400 mt-4 text-lg">{tabName} - Coming Soon</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F7F7F9]">
      <PageHeader title="Add Product" rightContent={
        <View className="flex-row items-center gap-3">
          <Pressable
            className="px-5 py-2.5 rounded-lg border border-gray-300"
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text className="text-gray-700 font-medium">Cancel</Text>
          </Pressable>
          <Pressable
            className="px-5 py-2.5 rounded-lg flex-row items-center"
            style={{ backgroundColor: saving ? "#F87171" : "#EC1A52", opacity: saving ? 0.7 : 1 }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving && <ActivityIndicator size="small" color="white" style={{ marginRight: 6 }} />}
            <Text className="text-white font-medium">{saving ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>
      } />

      {/* Tab Navigation */}
      <View className="bg-[#F7F7F9] border-b border-gray-200">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="px-5 py-4"
            >
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.key ? "text-red-500" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: "#EC1A52" }}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === "basic" && renderBasicTab()}
        {activeTab === "pricing" && renderPricingTab()}
        {activeTab === "seo" && renderSeoTab()}
        {activeTab === "variants" && renderPlaceholderTab("Variants")}
        {activeTab === "tax" && renderPlaceholderTab("Tax Section")}
        {activeTab === "promotions" && renderPromotionsTab()}
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[600px] max-w-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <Text className="text-xl font-semibold text-gray-800">Add Category</Text>
              <Pressable onPress={() => setShowAddCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Row 1: Category Name, MSA Code, Is MSA, Is Feature */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium mb-2">
                    Category Name<Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="bg-[#F7F7F9] border border-gray-200 rounded-lg px-4 py-3"
                    placeholder="Enter Category Name"
                    placeholderTextColor="#9ca3af"
                    value={categoryName}
                    onChangeText={setCategoryName}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium mb-2">MSA Code</Text>
                  <Pressable
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center shadow-sm"
                    onPress={() => {
                      if (!categoryIsMsa) {
                        Alert.alert("Info", "Turn on Is MSA to enter MSA code");
                        return;
                      }
                      setMsaCodeDraft(categoryMsaCode);
                      setShowMsaCodeModal(true);
                    }}
                    style={!categoryIsMsa ? { backgroundColor: "#F3F4F6" } : {}}
                  >
                    <Text className={categoryMsaCode ? "text-gray-800" : "text-gray-400"}>
                      {categoryMsaCode
                        ? `${categoryMsaCode} - ${MSA_CODES.find((m) => m.code === categoryMsaCode)?.description || ""}`
                        : "Please select Msa Code"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                  </Pressable>
                </View>
                <View className="items-center">
                  <Text className="text-gray-700 text-sm font-medium mb-2">Is MSA</Text>
                  <Switch
                    value={categoryIsMsa}
                    onValueChange={(val) => {
                      setCategoryIsMsa(val);
                      if (!val) setCategoryMsaCode("");
                    }}
                    trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
                    thumbColor="white"
                  />
                </View>
                <View className="items-center">
                  <Text className="text-gray-700 text-sm font-medium mb-2">Is Feature</Text>
                  <Switch
                    value={categoryIsFeature}
                    onValueChange={setCategoryIsFeature}
                    trackColor={{ false: "#D1D5DB", true: "#EC1A52" }}
                    thumbColor="white"
                  />
                </View>
              </View>

              {/* Row 2: Parent Category */}
              <View className="mb-6">
                <Text className="text-gray-700 text-sm font-medium mb-2">Parent Category</Text>
                <Pressable
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-row justify-between items-center w-64"
                  onPress={() => setShowParentCategoryModal(true)}
                >
                  <Text className={categoryParentId ? "text-gray-800" : "text-gray-400"}>
                    {categoryParentId
                      ? categoriesList.find((c) => c.id === categoryParentId)?.name || "Select"
                      : "Please Select"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
              </View>

            </View>

            {/* Footer */}
            <View className="flex-row justify-end gap-3 p-6 border-t border-gray-200">
              <Pressable
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: "#3B82F6" }}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <Text className="text-white font-medium">Close</Text>
              </Pressable>
              <Pressable
                className="px-6 py-3 rounded-lg flex-row items-center"
                style={[
                  { backgroundColor: "#8B5CF6" },
                  savingCategory ? { opacity: 0.6 } : {},
                ]}
                disabled={savingCategory}
                onPress={async () => {
                  if (!categoryName.trim()) {
                    Alert.alert("Error", "Category name is required");
                    return;
                  }
                  if (categoryIsMsa && !categoryMsaCode) {
                    Alert.alert("Error", "MSA Code is required when Is MSA is on");
                    return;
                  }
                  try {
                    setSavingCategory(true);
                    await createCategory({
                      name: categoryName.trim(),
                      parent_id: categoryParentId || null,
                      code: categoryIsMsa ? categoryMsaCode : null,
                      is_msa_compliant: categoryIsMsa,
                      visible_on_ecom: categoryIsFeature,
                    });
                    Alert.alert("Success", "Category added successfully");
                    // Reset form
                    setCategoryName("");
                    setCategoryMsaCode("");
                    setCategoryIsMsa(false);
                    setCategoryIsFeature(false);
                    setCategoryParentId(null);
                    setShowAddCategoryModal(false);
                    // Refresh categories list
                    const categoriesRes = await fetchCategories();
                    setCategoriesList(normalizeCategoryList(categoriesRes.data));
                  } catch (err: any) {
                    const msg = err?.response?.data?.errors
                      ? err.response.data.errors.join("\n")
                      : err?.response?.data?.message || err?.message || "Failed to create category";
                    Alert.alert("Error", msg);
                  } finally {
                    setSavingCategory(false);
                  }
                }}
              >
                {savingCategory && <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />}
                <Text className="text-white font-medium">{savingCategory ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Category Modal */}
      <Modal
        visible={showMainCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMainCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[420px] max-w-[90%]">
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">Select Main Category</Text>
              <Pressable onPress={() => setShowMainCategoryModal(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {selectedCategoryIds.map((id) => {
                const cat = categoriesList.find((c) => c.id === id);
                if (!cat) return null;
                const isActive = selectedMainCategoryId === id;
                return (
                  <Pressable
                    key={id}
                    className={`px-5 py-3 flex-row items-center justify-between ${isActive ? "bg-red-50" : ""}`}
                    onPress={() => {
                      setSelectedMainCategoryId(id);
                      setShowMainCategoryModal(false);
                    }}
                  >
                    <Text className={isActive ? "text-gray-800 font-medium" : "text-gray-700"}>
                      {cat.name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color="#EC1A52" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MSA Code Modal */}
      <Modal
        visible={showMsaCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMsaCodeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[520px] max-w-[92%]">
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">MSA Code</Text>
              <Pressable onPress={() => setShowMsaCodeModal(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {MSA_CODES.map((item) => {
                const isActive = msaCodeDraft === item.code;
                return (
                  <Pressable
                    key={item.code}
                    className={`px-5 py-3 flex-row items-center justify-between ${isActive ? "bg-red-50" : ""}`}
                    onPress={() => setMsaCodeDraft(item.code)}
                  >
                    <Text className={isActive ? "text-gray-800 font-medium" : "text-gray-700"}>
                      {item.code} - {item.description}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color="#EC1A52" />}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="flex-row justify-end gap-3 p-5 border-t border-gray-200">
              <Pressable
                className="px-5 py-2.5 rounded-lg border border-gray-300"
                onPress={() => setShowMsaCodeModal(false)}
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                className="px-5 py-2.5 rounded-lg"
                style={{ backgroundColor: "#EC1A52" }}
                onPress={() => {
                  setCategoryMsaCode(msaCodeDraft.trim());
                  setShowMsaCodeModal(false);
                }}
              >
                <Text className="text-white font-medium">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Parent Category Modal */}
      <Modal
        visible={showParentCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowParentCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[520px] max-w-[92%]">
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">Select Parent Category</Text>
              <Pressable onPress={() => setShowParentCategoryModal(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable
                className={`px-5 py-3 flex-row items-center justify-between ${categoryParentId === null ? "bg-red-50" : ""}`}
                onPress={() => {
                  setCategoryParentId(null);
                  setShowParentCategoryModal(false);
                }}
              >
                <Text className={categoryParentId === null ? "text-gray-800 font-medium" : "text-gray-700"}>
                  No Parent
                </Text>
                {categoryParentId === null && <Ionicons name="checkmark" size={18} color="#EC1A52" />}
              </Pressable>
              {parentCategoryOptions.map((item) => {
                const isActive = categoryParentId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    className={`px-5 py-3 flex-row items-center justify-between ${isActive ? "bg-red-50" : ""}`}
                    onPress={() => {
                      setCategoryParentId(item.id);
                      setShowParentCategoryModal(false);
                    }}
                  >
                    <Text className={isActive ? "text-gray-800 font-medium" : "text-gray-700"}>
                      {item.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color="#EC1A52" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generic Picker Modal — used for Sold By, Bought By, Measured By dropdowns */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl w-[420px] max-w-[90%]">
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">{pickerModal.title}</Text>
              <Pressable onPress={closePicker} hitSlop={8}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {pickerModal.options.map((opt) => {
                const isActive = pickerModal.selected === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    className={`px-5 py-3 flex-row items-center justify-between ${isActive ? "bg-red-50" : ""}`}
                    onPress={() => {
                      pickerModal.onSelect(opt.value);
                      closePicker();
                    }}
                  >
                    <Text className={isActive ? "text-gray-800 font-medium" : "text-gray-700"}>
                      {opt.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color="#EC1A52" />}
                  </Pressable>
                );
              })}
              {pickerModal.options.length === 0 && (
                <View className="py-12 items-center">
                  <Text className="text-gray-400">No options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DevDataOverlay
        tables={[PRODUCTS_TABLE, CATEGORIES_TABLE, PROMOTION_DETAILS_TABLE]}
        defaultTable="products"
      />
    </View>
  );
}
