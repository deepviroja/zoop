// City name mapping from local language to English
export const cityMapping = {
  // Hindi/Gujarati to English mappings
  'સુરત': 'Surat',
  'સુરત શહેર': 'Surat',
  'સુરત જિલ્લો': 'Surat',
  'સુરત નગર': 'Surat',
  'Surat City': 'Surat',
  'Surat District': 'Surat',
  
  'મુંબઈ': 'Mumbai',
  'मुंबई': 'Mumbai',
  'Mumbai Suburban': 'Mumbai',
  'मुंबई उपनगर': 'Mumbai',
  
  'દિલ્હી': 'Delhi',
  'दिल्ली': 'Delhi',
  'নতুন দিল্লি': 'Delhi',
  'New Delhi': 'Delhi',
  
  'બેંગલોર': 'Bangalore',
  'बेंगलुरु': 'Bangalore',
  'Bengaluru': 'Bangalore',
  'Bangalore Urban': 'Bangalore',
  
  'અમદાવાદ': 'Ahmedabad',
  'अहमदाबाद': 'Ahmedabad',
  'Ahmedabad City': 'Ahmedabad',
  
  'પુણે': 'Pune',
  'पुणे': 'Pune',
  'Pune City': 'Pune',
  
  'કોલકાતા': 'Kolkata',
  'কলকাতা': 'Kolkata',
  'कोलकाता': 'Kolkata',
  'Kolkata District': 'Kolkata',
  
  'ચેન્નઈ': 'Chennai',
  'चेन्नई': 'Chennai',
  'Chennai City': 'Chennai',
  
  'જયપુર': 'Jaipur',
  'जयपुर': 'Jaipur',
  'Jaipur City': 'Jaipur',
  
  'હૈદરાબાદ': 'Hyderabad',
  'हैदराबाद': 'Hyderabad',
  'Hyderabad District': 'Hyderabad',
};

// Function to normalize city names
export const normalizeCityName = (cityName) => {
  if (!cityName || typeof cityName !== 'string') {
    return 'Surat'; // Default city
  }

  const trimmedCity = cityName.trim();
  
  // Check if it's already in our mapping
  if (cityMapping[trimmedCity]) {
    return cityMapping[trimmedCity];
  }

  // Check case-insensitive
  const lowerCity = trimmedCity.toLowerCase();
  for (const [key, value] of Object.entries(cityMapping)) {
    if (key.toLowerCase() === lowerCity) {
      return value;
    }
  }

  // If it contains a known city name, extract it
  const knownCities = [
    'Surat', 'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 
    'Ahmedabad', 'Pune', 'Kolkata', 'Chennai', 'Jaipur', 'Hyderabad'
  ];
  
  for (const city of knownCities) {
    if (trimmedCity.toLowerCase().includes(city.toLowerCase())) {
      return city === 'Bengaluru' ? 'Bangalore' : city;
    }
  }

  // Return as is if no mapping found
  return trimmedCity;
};
