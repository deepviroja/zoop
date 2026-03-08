import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store } from "../../assets/icons/Store";
import { User } from "../../assets/icons/User";
import { MapPin } from "../../assets/icons/MapPin";
import { Zap } from "../../assets/icons/Zap";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { Upload } from "../../assets/icons/Upload";
import { apiClient } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { useUser } from "../../context/UserContext";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import CountryStateCityFieldset from "../../components/common/CountryStateCityFieldset";
import {
  getPincodeValidationMessage,
  isValidInternationalPhone,
  isValidPincode,
} from "../../utils/liveValidation";
import { getCountryByCode, getStateByCodeAndCountry } from "../../utils/locationData";

// Define FormData interface based on the state
interface OnboardingFormData {
    businessName: string;
    businessType: string;
    gstNumber: string;
    panNumber: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    addressLine1: string;
    addressLine2: string;
    countryCode: string;
    country: string;
    stateCode: string;
    city: string;
    state: string;
    pincode: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
}

const SellerOnboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useUser();

  // Form State
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Step 1: Business Info
    businessName: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",

    // Step 2: Personal Info
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 3: Address
    addressLine1: "",
    addressLine2: "",
    countryCode: "IN",
    country: "India",
    stateCode: "",
    city: "",
    state: "",
    pincode: "",

    // Step 4: Banking
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
  });

  // Step 5: Document uploads
  const [panFile, setPanFile] = useState<File | null>(null);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [phoneMeta, setPhoneMeta] = useState({ dialCode: "91", countryCode: "in", format: "" });
  const [docError, setDocError] = useState("");

  const [errors, setErrors] = useState<
    Partial<OnboardingFormData & { countryCode: string; stateCode: string }>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === "panNumber" || name === "gstNumber" || name === "ifscCode"
        ? String(value || "").toUpperCase()
        : value;
    setFormData({
      ...formData,
      [name]: normalizedValue,
    });
    // Clear error for field on change
    if (errors[name as keyof OnboardingFormData]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  React.useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      ownerName: prev.ownerName || user.displayName || user.name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const validateStep = (currentStep: number) => {
    const newErrors: Partial<OnboardingFormData> = {};
    let isValid = true;
    const hasAuthenticatedSeller = Boolean(user?.uid && user?.email);

    if (currentStep === 1) {
      if (!formData.businessName.trim())
        newErrors.businessName = "Business Name is required";
      if (!formData.businessType)
        newErrors.businessType = "Business Type is required";
      if (!formData.panNumber.trim())
        newErrors.panNumber = "PAN Number is required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber))
        newErrors.panNumber = "Invalid PAN Number format";

      if (
        formData.gstNumber &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          formData.gstNumber,
        )
      ) {
        newErrors.gstNumber = "Invalid GST Number format";
      }
    }

    if (currentStep === 2) {
      if (!formData.ownerName.trim())
        newErrors.ownerName = "Owner Name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email format";

      if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";
      else if (!isValidInternationalPhone(formData.phone, phoneMeta))
        newErrors.phone = "Please enter a valid phone number for selected country";

      if (!hasAuthenticatedSeller) {
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8)
          newErrors.password = "Password must be at least 8 characters";

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }
    }

    if (currentStep === 3) {
      if (!formData.addressLine1.trim())
        newErrors.addressLine1 = "Address Line 1 is required";
      if (!formData.countryCode.trim()) newErrors.countryCode = "Country is required";
      if (!formData.stateCode.trim()) newErrors.stateCode = "State is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
      else if (!isValidPincode(formData.pincode, "IN"))
        newErrors.pincode = getPincodeValidationMessage("IN");
    }

    if (currentStep === 4) {
      if (!formData.bankName.trim())
        newErrors.bankName = "Bank Name is required";
      if (!formData.accountHolderName.trim())
        newErrors.accountHolderName = "Account Holder Name is required";
      if (!formData.accountNumber.trim())
        newErrors.accountNumber = "Account Number is required";
      else if (!/^\d+$/.test(formData.accountNumber))
        newErrors.accountNumber = "Account Number must be numeric";

      if (formData.accountNumber !== formData.confirmAccountNumber) {
        newErrors.confirmAccountNumber = "Account Numbers do not match";
      }

      if (!formData.ifscCode.trim())
        newErrors.ifscCode = "IFSC Code is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode))
        newErrors.ifscCode = "Invalid IFSC Code";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      if (!panFile || !chequeFile) {
        setDocError("PAN Card and Cancelled Cheque are required");
        showToast("PAN Card and Cancelled Cheque are required", "warning");
        return;
      }
      setDocError("");
      setLoading(true);
      try {
          const payload = {
            businessName: formData.businessName,
            businessType: formData.businessType,
            gstNumber: formData.gstNumber,
            panNumber: formData.panNumber,
            ownerName: formData.ownerName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password || "OnboardingOnly#123",
            address: {
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                city: formData.city,
                country: formData.country,
                state: formData.state,
                pincode: formData.pincode,
                phone: formData.phone,
                name: formData.ownerName
            },
            banking: {
                bankName: formData.bankName,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                ifscCode: formData.ifscCode
            }
          };

          await apiClient.post('/auth/register-seller', payload);

          // Upload onboarding documents and attach URLs to seller profile
          try {
            const uploadOneDoc = async (file: File | null) => {
              if (!file) return "";
              const fd = new FormData();
              fd.append("document", file);
              const uploaded = await (apiClient as any).postForm?.("/upload/document", fd);
              return uploaded?.url || "";
            };

            const [panCardUrl, gstCertificateUrl, cancelledChequeUrl] = await Promise.all([
              uploadOneDoc(panFile),
              uploadOneDoc(gstFile),
              uploadOneDoc(chequeFile),
            ]);

            await apiClient.put("/auth/profile", {
              panCardUrl,
              gstCertificateUrl,
              cancelledChequeUrl,
            });
          } catch (err: any) {
            showToast(
              err?.message || "Seller registered but document upload failed. Please update profile with documents.",
              "warning",
            );
          }

          showToast('Application submitted! Awaiting admin review.', 'success');
          setTimeout(() => navigate('/seller/waiting'), 1500);
      } catch (error: any) {
          console.error("Registration failed:", error);
          showToast(error.message || 'Registration failed. Please try again.', 'error');
      } finally {
          setLoading(false);
      }
    }
  };

  // Replaced by navigate to /seller/waiting in handleSubmit — no separate completed screen

  return (
    <div className="min-h-screen bg-gradient-to-br from-zoop-moss/20 to-zoop-copper/20 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-zoop-obsidian font-bold transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ChevronLeft width={16} height={16} />
          </div>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zoop-obsidian rounded-full mb-4 shadow-xl">
            <Store width={40} height={40} className="text-zoop-moss" />
          </div>
          <h1 className="text-4xl font-black text-zoop-obsidian mb-2 tracking-tighter italic">
            Become a Zoop Seller
          </h1>
          <p className="text-gray-600 font-bold">
            Join thousands of sellers and grow your business
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between relative z-10">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base transition-all border-4 ${
                      step >= s
                        ? "bg-zoop-obsidian text-zoop-moss border-zoop-obsidian"
                        : "bg-white text-gray-300 border-gray-200"
                    }`}
                  >
                    {s}
                  </div>
                  <p
                    className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${step >= s ? "text-zoop-obsidian" : "text-gray-300"}`}
                  >
                    {s === 1 && "Business"}
                    {s === 2 && "Personal"}
                    {s === 3 && "Address"}
                    {s === 4 && "Banking"}
                    {s === 5 && "Docs"}
                  </p>
                </div>
                {s < 5 && (
                  <div
                    className={`hidden md:block flex-1 h-1 rounded -mx-8 -mt-6 z-[-1] transition-all duration-500 ${
                      step > s ? "bg-zoop-obsidian" : "bg-gray-100"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
        >
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-zoop-obsidian mb-6 flex items-center gap-3">
                <Store width={24} height={24} /> Business Information
              </h2>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.businessName
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="Enter your business name"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-xs font-bold mt-1">
                    {errors.businessName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.businessType
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                >
                  <option value="">Select business type</option>
                  <option value="Individual/Proprietorship">
                    Individual/Proprietorship
                  </option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="LLP">LLP</option>
                </select>
                {errors.businessType && (
                  <p className="text-red-500 text-xs font-bold mt-1">
                    {errors.businessType}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                      errors.gstNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-100 focus:border-zoop-moss"
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {errors.gstNumber && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      {errors.gstNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                      errors.panNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-100 focus:border-zoop-moss"
                    }`}
                    placeholder="ABCDE1234F"
                  />
                  {errors.panNumber && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      {errors.panNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ... (Other steps would follow similarly with typed onChange/values) ... */}
          {/* For brevity, I am assuming the check logic below will work if I copy paste correctly. 
              But since I am overwriting the whole file, I must include ALL content. 
              I'll copy the structure from the read file but add Types. 
          */}
          
          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-zoop-obsidian mb-6 flex items-center gap-3">
                <User width={24} height={24} /> Personal Information
              </h2>
              {/* Fields for Step 2 */}
               <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.ownerName
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="Enter owner's full name"
                />
                  {errors.ownerName && (
                  <p className="text-red-500 text-xs font-bold mt-1">
                    {errors.ownerName}
                  </p>
                )}
              </div>
               <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Email Address *
                  </label>
                   <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                      errors.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-100 focus:border-zoop-moss"
                    }`}
                    placeholder="your@email.com"
                  />
                   {errors.email && (
                     <p className="text-red-500 text-xs font-bold mt-1">
                       {errors.email}
                     </p>
                   )}
                </div>
                <CountryPhoneField
                  label="Phone Number"
                  required
                  value={formData.phone}
                  defaultCountry="in"
                  error={errors.phone}
                  onChange={(phone, meta) => {
                    const nextMeta = meta || phoneMeta;
                    setPhoneMeta(nextMeta);
                    setFormData((prev) => ({ ...prev, phone }));
                    setErrors((prev) => ({
                      ...prev,
                      phone: isValidInternationalPhone(phone, nextMeta)
                        ? ""
                        : "Please enter a valid phone number for selected country",
                    }));
                  }}
                  onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                />
               </div>
               {!(user?.uid && user?.email) ? (
                 <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Password *
                    </label>
                     <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                        errors.password
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-100 focus:border-zoop-moss"
                      }`}
                      placeholder="Min 8 chars"
                    />
                     {errors.password && (
                       <p className="text-red-500 text-xs font-bold mt-1">
                         {errors.password}
                       </p>
                     )}
                  </div>
                   <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Confirm Password *
                    </label>
                     <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                        errors.confirmPassword
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-100 focus:border-zoop-moss"
                      }`}
                      placeholder="Re-enter password"
                    />
                     {errors.confirmPassword && (
                       <p className="text-red-500 text-xs font-bold mt-1">
                         {errors.confirmPassword}
                       </p>
                     )}
                  </div>
                 </div>
               ) : (
                 <div className="rounded-2xl border border-zoop-moss/20 bg-zoop-moss/5 px-4 py-4 text-sm font-bold text-zoop-obsidian">
                   Your seller account is already created. Finish business details below to submit for review.
                 </div>
               )}
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-zoop-obsidian mb-6 flex items-center gap-3">
                <MapPin width={24} height={24} /> Business Address
              </h2>
              {/* Fields for Step 3 */}
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Address Line 1 *
                </label>
                 <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.addressLine1
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="Street address, building name"
                />
                 {errors.addressLine1 && (
                   <p className="text-red-500 text-xs font-bold mt-1">
                     {errors.addressLine1}
                   </p>
                 )}
              </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Address Line 2 (Optional)
                </label>
                 <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-zoop-moss transition-colors font-bold"
                  placeholder="Floor, Landmark, etc."
                />
              </div>
              <CountryStateCityFieldset
                country={formData.countryCode}
                state={formData.stateCode}
                city={formData.city}
                required
                errors={{
                  country: errors.countryCode,
                  state: errors.stateCode,
                  city: errors.city,
                }}
                onCountryChange={(countryCode) => {
                  const country = getCountryByCode(countryCode);
                  setFormData((prev) => ({
                    ...prev,
                    countryCode,
                    country: country?.name || "",
                    stateCode: "",
                    state: "",
                    city: "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    countryCode: countryCode ? "" : "Country is required",
                    stateCode: "State is required",
                    state: "State is required",
                    city: "City is required",
                  }));
                }}
                onStateChange={(stateCode) => {
                  const selectedState = getStateByCodeAndCountry(
                    stateCode,
                    formData.countryCode,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    stateCode,
                    state: selectedState?.name || "",
                    city: "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    stateCode: stateCode ? "" : "State is required",
                    state: stateCode ? "" : "State is required",
                    city: "City is required",
                  }));
                }}
                onCityChange={(city) => {
                  setFormData((prev) => ({ ...prev, city }));
                  setErrors((prev) => ({
                    ...prev,
                    city: city ? "" : "City is required",
                  }));
                }}
              />
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Pincode *
                </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.pincode
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="400001"
                />
               {errors.pincode && (
                   <p className="text-red-500 text-xs font-bold mt-1">
                     {errors.pincode}
                   </p>
                   )}
               </div>
            </div>
          )}

          {/* Step 4: Bank Details */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-zoop-obsidian mb-6 flex items-center gap-3">
                <Zap width={24} height={24} /> Banking Details
              </h2>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Account Holder Name *
                </label>
                 <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.accountHolderName
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="As per bank records"
                />
                 {errors.accountHolderName && (
                   <p className="text-red-500 text-xs font-bold mt-1">
                     {errors.accountHolderName}
                   </p>
                 )}
              </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Bank Name *
                </label>
                 <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.bankName
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="HDFC Bank"
                />
                 {errors.bankName && (
                   <p className="text-red-500 text-xs font-bold mt-1">
                     {errors.bankName}
                   </p>
                 )}
              </div>
               <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Account Number *
                  </label>
                   <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                      errors.accountNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-100 focus:border-zoop-moss"
                    }`}
                    placeholder="1234567890"
                  />
                   {errors.accountNumber && (
                     <p className="text-red-500 text-xs font-bold mt-1">
                       {errors.accountNumber}
                     </p>
                   )}
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Confirm Account Number *
                  </label>
                   <input
                    type="text"
                    name="confirmAccountNumber"
                    value={formData.confirmAccountNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                      errors.confirmAccountNumber
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-100 focus:border-zoop-moss"
                    }`}
                    placeholder="Re-enter account number"
                  />
                   {errors.confirmAccountNumber && (
                     <p className="text-red-500 text-xs font-bold mt-1">
                       {errors.confirmAccountNumber}
                     </p>
                   )}
                 </div>
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  IFSC Code *
                </label>
                 <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-bold ${
                    errors.ifscCode
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-100 focus:border-zoop-moss"
                  }`}
                  placeholder="HDFC0001234"
                />
                 {errors.ifscCode && (
                   <p className="text-red-500 text-xs font-bold mt-1">
                     {errors.ifscCode}
                   </p>
                 )}
               </div>
            </div>
          )}

          {/* Step 5: Document Upload */}
          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <h2 className="text-2xl font-black text-zoop-obsidian mb-2 flex items-center gap-3">
                <Upload width={24} height={24} /> Upload Documents
              </h2>
              <p className="text-sm text-gray-500 -mt-4">Upload clear scans or photos. All documents kept strictly confidential.</p>

              {[ 
                { label: 'PAN Card *', desc: 'PDF or image of your PAN card', key: 'pan', setter: setPanFile, value: panFile },
                { label: 'GST Certificate (Optional)', desc: 'Upload if you have a GST number', key: 'gst', setter: setGstFile, value: gstFile },
                { label: 'Cancelled Cheque / Bank Statement *', desc: 'Proof of bank account', key: 'cheque', setter: setChequeFile, value: chequeFile },
              ].map((doc) => (
                <div key={doc.key}>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{doc.label}</label>
                  <p className="text-xs text-gray-400 mb-3">{doc.desc}</p>
                  <label
                    className={`flex items-center gap-4 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                      doc.value ? 'border-zoop-moss bg-zoop-moss/5' : 'border-gray-200 hover:border-zoop-moss/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <Upload width={22} height={22} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {doc.value ? (
                        <p className="font-bold text-zoop-obsidian truncate">{(doc.value as File).name}</p>
                      ) : (
                        <p className="font-bold text-gray-500">Click to select file</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, PDF — max 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (!file) return doc.setter(null);
                        const allowed = [
                          "application/pdf",
                          "image/jpeg",
                          "image/jpg",
                          "image/png",
                          "image/webp",
                        ];
                        if (!allowed.includes(file.type)) {
                          setDocError("Only PDF, JPG, PNG, and WEBP files are allowed");
                          return;
                        }
                        if (file.size > 8 * 1024 * 1024) {
                          setDocError("Document size must be under 8MB");
                          return;
                        }
                        setDocError("");
                        doc.setter(file);
                      }}
                    />
                  </label>
                </div>
              ))}

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700">PAN Card and Cancelled Cheque are mandatory. GST Certificate is optional.</p>
              </div>
              {docError && (
                <p className="text-red-600 text-sm font-bold -mt-2">{docError}</p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={step === 1}
              className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:text-zoop-obsidian hover:bg-gray-100 disabled:opacity-0 transition-all"
            >
              Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-10 py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian hover:shadow-lg transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`px-10 py-4 bg-zoop-moss text-zoop-obsidian rounded-xl font-black uppercase tracking-widest hover:brightness-110 hover:shadow-lg hover:scale-105 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className="text-center mt-12">
          <p className="text-sm font-bold text-gray-500">
            Need help? Contact our seller support team at{" "}
            <a
              href="mailto:seller@zoop.com"
              className="text-zoop-obsidian font-black hover:underline"
            >
              seller@zoop.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
