import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { apiClient } from '../../api/client';
import { ImageUpload } from '../../components/common/ImageUpload';
import { Toast } from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import { ChevronLeft } from '../../assets/icons/ChevronLeft';
import { Package } from '../../assets/icons/Package';

type VariantOption = {
    id: string;
    label: string;
    type: string;
    value: string;
    price: string;
    mrp: string;
    stock: string;
    imageUrl: string;
    videoUrl: string;
    sku: string;
};

export const SellerAddProduct = () => {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId?: string }>();
    const isEditMode = Boolean(productId);
    const { user } = useUser();
    const { toast, showToast, hideToast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
    const [profileChecked, setProfileChecked] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        mrp: '',
        categoryId: '',
        subcategory: '',
        stock: '',
        brand: '',
        sku: '',
        material: '',
        colorOptions: [] as string[],
        sizeOptions: [] as string[],
        aboutItem: '',
        ram: '',
        storage: '',
        dimensionWidth: '',
        dimensionHeight: '',
        dimensionDepth: '',
        dimensionUnit: 'cm',
        attributes: [] as Array<{ key: string; values: string[] }>,
        weightGrams: '',
        countryOfOrigin: 'India',
        warrantyInfo: '',
        highlights: '',
        returnPolicy: '7 Days Return',
        deliveryTime: '2-3 Days',
        isSameDayEligible: false,
        cityAvailability: '',
        thumbnailUrl: '',
        imageUrls: [] as string[],
        videoUrls: [] as string[],
        descriptionMedia: [] as Array<{ url: string; type: 'image' | 'video'; alt?: string }>,
        discountPercent: '',
        tags: '',
        variantOptions: [] as VariantOption[],
    });
    const [colorInput, setColorInput] = useState('');
    const [sizeInput, setSizeInput] = useState('');
    const [attributeKeyInput, setAttributeKeyInput] = useState('');
    const [attributeValueInput, setAttributeValueInput] = useState('');
    const [categorySearch, setCategorySearch] = useState("");
    const [subcategorySearch, setSubcategorySearch] = useState("");
    const [variantDraft, setVariantDraft] = useState<VariantOption>({
        id: '',
        label: '',
        type: 'Size',
        value: '',
        price: '',
        mrp: '',
        stock: '',
        imageUrl: '',
        videoUrl: '',
        sku: '',
    });

    const stateToCities: Record<string, string[]> = {
        Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
        Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
        Karnataka: ["Bengaluru", "Mysuru", "Mangalore", "Hubli"],
        Delhi: ["New Delhi", "Dwarka", "Rohini", "Saket"],
    };
    const defaultState = "Gujarat";
    const selectedState = formData.cityAvailability ? defaultState : defaultState;
    const cityList = stateToCities[selectedState] || [];

    // Fetch existing product if in edit mode
    useEffect(() => {
        if (!isEditMode || !productId) return;
        setFetchingProduct(true);
        apiClient.get<any>(`/products/${productId}`)
            .then((product) => {
                setFormData({
                    title: product.title || '',
                    description: product.description || '',
                    price: String(product.price || ''),
                    mrp: String(product.mrp || ''),
                    categoryId: product.categoryId || product.category || '',
                    subcategory: product.subcategory || '',
                    stock: String(product.stock || ''),
                    brand: product.brand || '',
                    sku: product.sku || '',
                    material: product.material || '',
                    colorOptions: product.colorOptions || [],
                    sizeOptions: product.sizeOptions || [],
                    aboutItem: product.aboutItem || '',
                    ram: product.ram || '',
                    storage: product.storage || '',
                    dimensionWidth: String(product.dimensions?.width || ''),
                    dimensionHeight: String(product.dimensions?.height || ''),
                    dimensionDepth: String(product.dimensions?.depth || ''),
                    dimensionUnit: product.dimensions?.unit || 'cm',
                    attributes: product.attributes || [],
                    weightGrams: String(product.weightGrams || ''),
                    countryOfOrigin: product.countryOfOrigin || 'India',
                    warrantyInfo: product.warrantyInfo || '',
                    highlights: (product.highlights || []).join('\n'),
                    returnPolicy: product.returnPolicy || '7 Days Return',
                    deliveryTime: product.deliveryTime || '2-3 Days',
                    isSameDayEligible: Boolean(product.isSameDayEligible),
                cityAvailability: (product.cityAvailability || []).join(', '),
                thumbnailUrl: product.thumbnailUrl || '',
                imageUrls: product.imageUrls || [],
                    videoUrls: product.videoUrls || [],
                    descriptionMedia: product.descriptionMedia || [],
                    discountPercent: String(product.discountPercent || ''),
                    tags: (product.tags || []).join(', '),
                    variantOptions: (product.variantOptions || []).map((variant: any) => ({
                        id: variant.id || '',
                        label: variant.label || '',
                        type: variant.type || 'Size',
                        value: variant.value || '',
                        price: String(variant.price ?? ''),
                        mrp: String(variant.mrp ?? ''),
                        stock: String(variant.stock ?? ''),
                        imageUrl: variant.imageUrl || '',
                        videoUrl: variant.videoUrl || '',
                        sku: variant.sku || '',
                    })),
                });
                setCategorySearch(product.categoryId || product.category || "");
                setSubcategorySearch(product.subcategory || "");
            })
            .catch((err) => {
                console.error('Failed to load product:', err);
                showToast('Failed to load product for editing.', 'error');
            })
            .finally(() => setFetchingProduct(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, isEditMode]);

    useEffect(() => {
        if (!user?.uid || isEditMode) {
            setProfileChecked(true);
            return;
        }
        let cancelled = false;
        const checkProfile = async () => {
            try {
                const profile = await apiClient.get<any>('/auth/profile');
                const required = [
                    'businessName',
                    'businessType',
                    'panNumber',
                    'phone',
                    'address',
                    'bankName',
                    'accountNumber',
                    'ifscCode',
                    'panCardUrl',
                    'cancelledChequeUrl',
                ];
                const missing = required.filter((field) => !profile?.[field]);
                if (!cancelled && missing.length) {
                    showToast(`Complete seller profile first: ${missing.join(', ')}`, 'warning');
                    navigate('/seller/profile');
                }
            } catch (err: any) {
                if (!cancelled) showToast(err?.message || 'Unable to validate seller profile', 'error');
            } finally {
                if (!cancelled) setProfileChecked(true);
            }
        };
        void checkProfile();
        return () => {
            cancelled = true;
        };
    }, [user, navigate, showToast, isEditMode]);

    const categoryTree: Record<string, { name: string; subcategories: string[] }> = {
        men: { name: 'Men', subcategories: ['T-Shirts', 'Shirts', 'Jeans', 'Footwear', 'Innerwear', 'Ethnic Wear', 'Watches', 'Accessories', 'Sportswear'] },
        women: { name: 'Women', subcategories: ['Sarees', 'Kurtas', 'Dresses', 'Footwear', 'Jewelry', 'Handbags', 'Beauty', 'Activewear'] },
        kids: { name: 'Kids', subcategories: ['Clothing', 'Toys', 'Footwear', 'School Supplies', 'Baby Care'] },
        home: { name: 'Home', subcategories: ['Kitchen', 'Decor', 'Furniture', 'Storage', 'Lighting', 'Bedding', 'Dining'] },
        artisans: { name: 'Artisans', subcategories: ['Handmade Decor', 'Handloom', 'Crafts', 'Jewelry', 'Pottery', 'Textiles'] },
        electronics: { name: 'Electronics', subcategories: ['Mobiles', 'Accessories', 'Audio', 'Wearables', 'Laptops', 'Cameras', 'Smart Home'] },
        beauty: { name: 'Beauty', subcategories: ['Skincare', 'Haircare', 'Makeup', 'Fragrances', 'Personal Care'] },
        grocery: { name: 'Grocery', subcategories: ['Snacks', 'Staples', 'Beverages', 'Organic', 'Household'] },
        sports: { name: 'Sports', subcategories: ['Fitness', 'Outdoor', 'Equipment', 'Footwear', 'Accessories'] },
        automotive: { name: 'Automotive', subcategories: ['Car Accessories', 'Bike Accessories', 'Tools', 'Care'] },
        books: { name: 'Books', subcategories: ['Fiction', 'Non-fiction', 'Academic', 'Children', 'Self-help'] },
        pets: { name: 'Pets', subcategories: ['Food', 'Accessories', 'Grooming', 'Toys'] },
        jewelry: { name: 'Jewelry', subcategories: ['Gold', 'Silver', 'Imitation', 'Watches', 'Accessories'] },
        furniture: { name: 'Furniture', subcategories: ['Living Room', 'Bedroom', 'Office', 'Outdoor'] },
        tools: { name: 'Tools & Hardware', subcategories: ['Power Tools', 'Hand Tools', 'Safety', 'Electrical'] },
        health: { name: 'Health', subcategories: ['Supplements', 'Medical Devices', 'Wellness', 'Ayurvedic'] },
        stationery: { name: 'Stationery', subcategories: ['Notebooks', 'Pens', 'Art Supplies', 'Office'] },
        footwear: { name: 'Footwear', subcategories: ['Sneakers', 'Formal', 'Ethnic', 'Sports', 'Kids'] },
        accessories: { name: 'Accessories', subcategories: ['Bags', 'Belts', 'Hats', 'Sunglasses'] },
    };
    const categories = Object.entries(categoryTree).map(([id, v]) => ({ id, name: v.name }));
    const subcategories = formData.categoryId ? categoryTree[formData.categoryId]?.subcategories || [] : [];
    const normalizedCategory = String(formData.categoryId || '').toLowerCase();
    const electronicsCategories = ['electronics'];
    const electronicsSubcategories = ['mobiles', 'laptops', 'smart-home', 'wearables', 'audio', 'cameras', 'accessories'];
    const showTechSpecs =
        electronicsCategories.includes(normalizedCategory) ||
        electronicsSubcategories.includes(String(formData.subcategory || '').toLowerCase().replace(/\s+/g, '-'));
    const showMaterialField = !showTechSpecs;

    const normalizeCategoryId = (value: string) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
             return;
        }

        setFormData(prev => {
            const nextData = { ...prev, [name]: value };

            // Selling price is derived from MRP and discount.
            if (name === 'mrp' || name === 'discountPercent') {
                const mrp = name === 'mrp' ? parseFloat(value) : parseFloat(prev.mrp);
                const discount = name === 'discountPercent' ? parseFloat(value) : parseFloat(prev.discountPercent);

                if (!isNaN(mrp) && !isNaN(discount)) {
                    const safeDiscount = Math.max(0, Math.min(discount, 100));
                    nextData.price = (mrp - (mrp * safeDiscount / 100)).toFixed(2);
                }
            }

            if (name === 'categoryId') {
                nextData.subcategory = '';
                if (electronicsCategories.includes(String(value).toLowerCase())) {
                    nextData.material = '';
                } else {
                    nextData.ram = '';
                    nextData.storage = '';
                }
            }

            return nextData;
        });
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const isVideoUrl = (url: string) =>
      /(\.mp4|\.webm|\.mov|\.ogg|\.m4v)(\?|$)/i.test(url) || url.includes('/video/upload/');

    const handleImageUpload = (urls: string[]) => {
        const imageUrls = urls.filter((url) => !isVideoUrl(url));
        const videoUrls = urls.filter((url) => isVideoUrl(url));
        setFormData(prev => ({
            ...prev,
            thumbnailUrl: imageUrls[0] || prev.thumbnailUrl || '',
            imageUrls,
            videoUrls,
            descriptionMedia: [
                ...imageUrls.map((url) => ({ url, type: 'image' as const })),
                ...videoUrls.map((url) => ({ url, type: 'video' as const })),
            ],
        }));
    };

    const addVariantOption = () => {
        const label = variantDraft.label.trim();
        const value = variantDraft.value.trim();
        const type = variantDraft.type.trim();
        if (!label || !value || !type) {
            setFieldErrors((prev) => ({ ...prev, variantOptions: 'Variant label, type and value are required.' }));
            return;
        }
        const id = `${type}-${value}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
        setFormData((prev) => ({
            ...prev,
            variantOptions: [
                ...prev.variantOptions,
                {
                    ...variantDraft,
                    id,
                    label,
                    type,
                    value,
                },
            ],
        }));
        setVariantDraft({
            id: '',
            label: '',
            type: 'Size',
            value: '',
            price: '',
            mrp: '',
            stock: '',
            imageUrl: '',
            videoUrl: '',
            sku: '',
        });
        setFieldErrors((prev) => ({ ...prev, variantOptions: '' }));
    };

    const removeVariantOption = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            variantOptions: prev.variantOptions.filter((variant) => variant.id !== id),
        }));
    };

    const addListOption = (field: 'colorOptions' | 'sizeOptions', rawValue: string) => {
        const value = String(rawValue || '').trim();
        if (!value) return;
        setFormData((prev) => {
            if (prev[field].some((v) => v.toLowerCase() === value.toLowerCase())) return prev;
            return { ...prev, [field]: [...prev[field], value] };
        });
    };

    const removeListOption = (field: 'colorOptions' | 'sizeOptions', value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((v) => v !== value),
        }));
    };

    const addAttributePair = () => {
        const key = attributeKeyInput.trim();
        const values = attributeValueInput
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        if (!key || values.length === 0) return;
        setFormData((prev) => ({
            ...prev,
            attributes: [...prev.attributes, { key, values }],
        }));
        setAttributeKeyInput('');
        setAttributeValueInput('');
    };

    const removeAttributePair = (idx: number) => {
        setFormData((prev) => ({
            ...prev,
            attributes: prev.attributes.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.thumbnailUrl && !isEditMode) {
            showToast("Please upload at least one image", 'error');
            setLoading(false);
            return;
        }

        if (!formData.title || !formData.description || !formData.mrp || !formData.stock || !formData.categoryId || !formData.subcategory) {
            showToast("Please fill all required fields", 'error');
            setLoading(false);
            return;
        }
        if (!/^\d{6}$/.test(String(formData.sku).replace(/\D/g, '').slice(0, 6)) && formData.sku) {
            showToast("SKU should be a 6-digit numeric code", 'warning');
            setLoading(false);
            return;
        }

        const nextErrors: Record<string, string> = {};
        if (formData.title.trim().length < 3) nextErrors.title = 'Title must be at least 3 characters.';
        if (formData.description.trim().length < 10) nextErrors.description = 'Description must be at least 10 characters.';
        if (showTechSpecs && !formData.ram && !formData.storage && formData.variantOptions.length === 0) {
            nextErrors.ram = 'Add RAM, storage, or variant options for this device category.';
        }
        if (!showTechSpecs && !formData.material && !formData.aboutItem) {
            nextErrors.material = 'Add material or about-item details for this category.';
        }
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            showToast('Please review the highlighted product fields.', 'error');
            setLoading(false);
            return;
        }

        try {
            const cityAvailability = formData.cityAvailability
                .split(',')
                .map((city) => city.trim())
                .filter(Boolean);
            const payload = {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                mrp: formData.mrp ? Number(formData.mrp) : undefined,
                categoryId: formData.categoryId,
                subcategory: formData.subcategory,
                stock: Number(formData.stock),
                thumbnailUrl: formData.thumbnailUrl,
                imageUrls: formData.imageUrls,
                videoUrls: formData.videoUrls,
                descriptionMedia: formData.descriptionMedia,
                brand: formData.brand,
                sku: formData.sku,
                material: formData.material,
                colorOptions: formData.colorOptions,
                sizeOptions: formData.sizeOptions,
                aboutItem: formData.aboutItem,
                ram: formData.ram,
                storage: formData.storage,
                dimensions: {
                    width: formData.dimensionWidth ? Number(formData.dimensionWidth) : undefined,
                    height: formData.dimensionHeight ? Number(formData.dimensionHeight) : undefined,
                    depth: formData.dimensionDepth ? Number(formData.dimensionDepth) : undefined,
                    unit: formData.dimensionUnit || 'cm',
                },
                attributes: formData.attributes,
                weightGrams: formData.weightGrams ? Number(formData.weightGrams) : undefined,
                countryOfOrigin: formData.countryOfOrigin,
                warrantyInfo: formData.warrantyInfo,
                highlights: formData.highlights.split('\n').map(v => v.trim()).filter(Boolean),
                returnPolicy: formData.returnPolicy,
                deliveryTime: formData.deliveryTime,
                isSameDayEligible: formData.isSameDayEligible,
                cityAvailability: formData.isSameDayEligible ? cityAvailability : [],
                discountPercent: formData.discountPercent ? Number(formData.discountPercent) : 0,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                    ,
                variantOptions: formData.variantOptions.map((variant) => ({
                    ...variant,
                    price: variant.price ? Number(variant.price) : undefined,
                    mrp: variant.mrp ? Number(variant.mrp) : undefined,
                    stock: variant.stock ? Number(variant.stock) : undefined,
                })),
            };

            if (isEditMode && productId) {
                await apiClient.put(`/products/${productId}`, payload);
                showToast('Product updated successfully!', 'success');
            } else {
                await apiClient.post('/products', payload);
                showToast('Product created successfully!', 'success');
            }
            
            setTimeout(() => {
                navigate('/seller/products');
            }, 1500);
        } catch (err: any) {
            console.error('Product save error:', err);
            if (Array.isArray(err?.missingFields) || Array.isArray(err?.data?.missingFields)) {
                const missing = err?.missingFields || err?.data?.missingFields;
                showToast(`Complete seller profile first: ${missing.join(", ")}`, 'warning');
                setTimeout(() => navigate('/seller/profile'), 1000);
            } else {
                const issues = err?.data?.error || err?.error;
                if (Array.isArray(issues)) {
                    const mappedErrors: Record<string, string> = {};
                    issues.forEach((issue: any) => {
                        const key = Array.isArray(issue?.path) ? issue.path.join('.') : issue?.path || 'form';
                        if (!mappedErrors[key]) mappedErrors[key] = issue?.message || 'Invalid value';
                    });
                    setFieldErrors(mappedErrors);
                }
                showToast(err.message || "Failed to save product", 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProduct) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-bold">Loading product...</p>
                </div>
            </div>
        );
    }

    if (!profileChecked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-bold">Validating seller profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-zoop-obsidian">
                        <ChevronLeft width={20} height={20} />
                        <span className="ml-1 font-bold">Back</span>
                    </button>
                    <h1 className="text-xl font-900 text-zoop-obsidian">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
                    <div className="w-16"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Package width={20} height={20} />
                            </div>
                            <h2 className="text-lg font-black text-gray-800">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Product Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.title ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium`}
                                    placeholder="e.g. Handwoven Silk Saree"
                                />
                                {fieldErrors.title && <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.title}</p>}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium`}
                                    placeholder="Describe your product details, materials, care instructions..."
                                />
                                <p className="mt-1 text-xs text-gray-500">{formData.description.length}/5000 characters</p>
                                {fieldErrors.description && <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.description}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                                <input
                                    type="text"
                                    list="category-options"
                                    value={categorySearch}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCategorySearch(value);
                                        const matched = categories.find(
                                            (c) =>
                                                c.name.toLowerCase() === value.toLowerCase() ||
                                                c.id.toLowerCase() === value.toLowerCase(),
                                        );
                                        const categoryId = matched ? matched.id : normalizeCategoryId(value);
                                        setFormData((prev) => ({ ...prev, categoryId, subcategory: '' }));
                                        setSubcategorySearch("");
                                    }}
                                    onBlur={() => {
                                        if (categorySearch && !formData.categoryId) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                categoryId: normalizeCategoryId(categorySearch),
                                            }));
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="Search or type a category"
                                    required
                                />
                                <datalist id="category-options">
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-gray-400 mt-1">
                                    You can type your own category if it is not listed.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory *</label>
                                <input
                                    type="text"
                                    list="subcategory-options"
                                    value={subcategorySearch}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSubcategorySearch(value);
                                        setFormData((prev) => ({ ...prev, subcategory: value }));
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="Search or type a subcategory"
                                    required
                                />
                                <datalist id="subcategory-options">
                                    {subcategories.map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-gray-400 mt-1">
                                    Type a custom subcategory if needed.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Brand (Optional)</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="e.g. Zoop, Nike, Local"
                                />
                            </div>

                            <div className="col-span-2 rounded-2xl border border-zoop-moss/25 bg-zoop-moss/5 p-4">
                                <p className="text-sm font-black text-zoop-obsidian mb-2">Where These Details Appear</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <p><span className="font-black text-gray-900">About Item:</span> Under product name and Description tab.</p>
                                    <p><span className="font-black text-gray-900">Color & Size:</span> Next to product images as selectable options.</p>
                                    <p><span className="font-black text-gray-900">RAM/Storage/Dimensions:</span> Specifications tab.</p>
                                    <p><span className="font-black text-gray-900">Custom Attributes:</span> Additional Details section.</p>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">About This Item</label>
                                <textarea
                                    name="aboutItem"
                                    rows={3}
                                    value={formData.aboutItem}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="Key story and usage details of this item..."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Shown on product detail page near title/price and in Description tab.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SKU (Optional)</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="6-digit code"
                                />
                            </div>

                            {showMaterialField && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Material (Optional)</label>
                                <input
                                    type="text"
                                    name="material"
                                    value={formData.material}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.material ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium`}
                                    placeholder="Cotton, Metal, Wood, etc."
                                />
                                {fieldErrors.material && <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.material}</p>}
                            </div>
                            )}

                            {showTechSpecs && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">RAM (Optional)</label>
                                <input
                                    type="text"
                                    name="ram"
                                    value={formData.ram}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.ram ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium`}
                                    placeholder="8GB"
                                />
                                {fieldErrors.ram && <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.ram}</p>}
                            </div>
                            )}

                            {showTechSpecs && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Storage (Optional)</label>
                                <input
                                    type="text"
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="128GB"
                                />
                            </div>
                            )}

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Highlights (One per line)</label>
                                <textarea
                                    name="highlights"
                                    rows={3}
                                    value={formData.highlights}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder={"Premium quality\nEasy to use\nLong lasting"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                             <h2 className="text-lg font-black text-gray-800">Product Images</h2>
                        </div>
                        <p className="text-sm text-gray-500">Upload high-quality images. The first image will be the thumbnail.</p>
                        
                        <ImageUpload onUpload={handleImageUpload} maxFiles={20} initialUrls={[...(formData.imageUrls || []), ...(formData.videoUrls || [])]} />
                        <p className="text-xs text-gray-500">
                            You can upload images and videos. First image is used as thumbnail, and uploaded media is also shown inside the product description gallery.
                        </p>
                    </div>

                    {/* Pricing & Inventory */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                             <h2 className="text-lg font-black text-gray-800">Pricing & Inventory</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price (₹) (Auto)</label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    value={formData.price}
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">MRP (₹) *</label>
                                <input
                                    type="number"
                                    name="mrp"
                                    min="0"
                                    required
                                    value={formData.mrp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Discount %</label>
                                <input
                                    type="number"
                                    name="discountPercent"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercent}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Stock Quantity *</label>
                                <input
                                    type="number"
                                    name="stock"
                                    required
                                    min="0"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                />
                            </div>

                            <div className="md:col-span-3 rounded-2xl border border-dashed border-zoop-moss/40 bg-zoop-moss/5 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-black text-zoop-obsidian">Variant Pricing & Media</h3>
                                        <p className="text-xs text-gray-500">Add separate prices, stock, and image/video links for sizes, colors, RAM, storage, or other options.</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <input value={variantDraft.label} onChange={(e) => setVariantDraft((prev) => ({ ...prev, label: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Display label e.g. Blue / 8GB" />
                                    <input value={variantDraft.type} onChange={(e) => setVariantDraft((prev) => ({ ...prev, type: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Type e.g. Color" />
                                    <input value={variantDraft.value} onChange={(e) => setVariantDraft((prev) => ({ ...prev, value: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Value e.g. Blue" />
                                    <input type="number" min="0" value={variantDraft.price} onChange={(e) => setVariantDraft((prev) => ({ ...prev, price: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Selling price" />
                                    <input type="number" min="0" value={variantDraft.mrp} onChange={(e) => setVariantDraft((prev) => ({ ...prev, mrp: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="MRP" />
                                    <input type="number" min="0" value={variantDraft.stock} onChange={(e) => setVariantDraft((prev) => ({ ...prev, stock: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Variant stock" />
                                    <input value={variantDraft.imageUrl} onChange={(e) => setVariantDraft((prev) => ({ ...prev, imageUrl: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200 md:col-span-2" placeholder="Variant image URL (optional)" />
                                    <input value={variantDraft.videoUrl} onChange={(e) => setVariantDraft((prev) => ({ ...prev, videoUrl: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Variant video URL" />
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    {fieldErrors.variantOptions ? <p className="text-xs font-bold text-red-600">{fieldErrors.variantOptions}</p> : <span />}
                                    <button type="button" onClick={addVariantOption} className="rounded-xl bg-gray-900 px-4 py-3 text-xs font-black uppercase text-white">Add Variant</button>
                                </div>
                                {formData.variantOptions.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {formData.variantOptions.map((variant) => (
                                            <div key={variant.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="font-black text-zoop-obsidian">{variant.label}</p>
                                                    <p className="text-xs text-gray-500">{variant.type}: {variant.value} • ₹{variant.price || formData.price || 0} • Stock {variant.stock || formData.stock || 0}</p>
                                                </div>
                                                <button type="button" onClick={() => removeVariantOption(variant.id)} className="text-xs font-black text-red-600">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Weight (grams)</label>
                                <input
                                    type="number"
                                    name="weightGrams"
                                    min="0"
                                    value={formData.weightGrams}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Country of Origin</label>
                                <input
                                    type="text"
                                    name="countryOfOrigin"
                                    value={formData.countryOfOrigin}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                />
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Color Options</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={colorInput}
                                            onChange={(e) => setColorInput(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                            placeholder="Type color and press Add"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                addListOption('colorOptions', colorInput);
                                                setColorInput('');
                                            }}
                                            className="px-4 py-3 rounded-xl bg-gray-900 text-white text-xs font-black uppercase"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.colorOptions.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => removeListOption('colorOptions', c)}
                                                className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700 hover:bg-red-100"
                                            >
                                                {c} ×
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Shown beside product images as selectable color chips.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Size Options</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={sizeInput}
                                            onChange={(e) => setSizeInput(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                            placeholder="Type size and press Add"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                addListOption('sizeOptions', sizeInput);
                                                setSizeInput('');
                                            }}
                                            className="px-4 py-3 rounded-xl bg-gray-900 text-white text-xs font-black uppercase"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.sizeOptions.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => removeListOption('sizeOptions', s)}
                                                className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700 hover:bg-red-100"
                                            >
                                                {s} ×
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Shown beside product images as size selector.
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Width</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="dimensionWidth"
                                        value={formData.dimensionWidth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                        placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Height</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="dimensionHeight"
                                        value={formData.dimensionHeight}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                        placeholder="20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Depth</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="dimensionDepth"
                                        value={formData.dimensionDepth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                        placeholder="5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Unit</label>
                                    <select
                                        name="dimensionUnit"
                                        value={formData.dimensionUnit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    >
                                        <option value="cm">cm</option>
                                        <option value="mm">mm</option>
                                        <option value="in">in</option>
                                        <option value="ft">ft</option>
                                    </select>
                                </div>
                                <p className="md:col-span-4 text-xs text-gray-500 -mt-2">
                                    Dimensions appear under Specifications tab on product detail page.
                                </p>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Custom Attributes</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={attributeKeyInput}
                                        onChange={(e) => setAttributeKeyInput(e.target.value)}
                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                        placeholder="Attribute name (e.g. Space)"
                                    />
                                    <input
                                        type="text"
                                        value={attributeValueInput}
                                        onChange={(e) => setAttributeValueInput(e.target.value)}
                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                        placeholder="Values comma separated"
                                    />
                                    <button
                                        type="button"
                                        onClick={addAttributePair}
                                        className="px-4 py-3 rounded-xl bg-gray-900 text-white text-xs font-black uppercase"
                                    >
                                        Add Attribute
                                    </button>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {formData.attributes.map((attr, idx) => (
                                        <div key={`${attr.key}-${idx}`} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-sm">
                                                <span className="font-black text-gray-800">{attr.key}:</span>{" "}
                                                <span className="text-gray-600">{attr.values.join(", ")}</span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeAttributePair(idx)}
                                                className="text-xs font-black text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Custom attributes appear in “Additional Details” section on product detail page.
                                </p>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Return Policy</label>
                                    <input
                                        type="text"
                                        name="returnPolicy"
                                        value={formData.returnPolicy}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Time</label>
                                    <input
                                        type="text"
                                        name="deliveryTime"
                                        value={formData.deliveryTime}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Warranty Info</label>
                                <textarea
                                    name="warrantyInfo"
                                    rows={2}
                                    value={formData.warrantyInfo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="6 months manufacturer warranty"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                             <h2 className="text-lg font-black text-gray-800">Delivery Options</h2>
                        </div>

                        <div className="flex items-center gap-4 bg-zoop-moss/10 p-4 rounded-xl border border-zoop-moss/20">
                            <input
                                type="checkbox"
                                id="isSameDayEligible"
                                name="isSameDayEligible"
                                checked={formData.isSameDayEligible}
                                onChange={handleChange}
                                className="w-6 h-6 text-zoop-moss border-gray-300 rounded focus:ring-zoop-moss"
                            />
                            <div>
                                <label htmlFor="isSameDayEligible" className="block text-sm font-black text-gray-800 cursor-pointer">
                                    Same-Day Delivery Eligible
                                </label>
                                <p className="text-xs text-gray-600">Check this if you can deliver this product within 4 hours in your city.</p>
                            </div>
                        </div>

                        {formData.isSameDayEligible && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Available Cities (comma separated)</label>
                                <input
                                    type="text"
                                    name="cityAvailability"
                                    value={formData.cityAvailability}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder={`e.g. ${cityList.join(', ')}`}
                                />
                            </div>
                        )}
                        
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Tags (Comma separated)</label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 transition-all font-medium"
                                    placeholder="e.g. summer, cotton, handmade"
                                />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/seller/products')}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-6 py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-wider hover:bg-zoop-moss hover:text-zoop-obsidian transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading
                                ? (isEditMode ? 'Saving...' : 'Publishing...')
                                : (isEditMode ? 'Save Changes' : 'Publish Product')
                            }
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
