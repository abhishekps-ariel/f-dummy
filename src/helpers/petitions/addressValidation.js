/**
 * Address validation helpers using Google Maps API
 */

/**
 * Extract address components from Google Places API result
 * @param {Array} addressComponents - Address components from Google Places API
 * @returns {Object} Extracted address components
 */
export const extractAddressComponents = (addressComponents) => {
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zipCode = "";
  let county = "";

  addressComponents.forEach((component) => {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    } else if (types.includes("route")) {
      route = component.long_name;
    } else if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    } else if (types.includes("postal_code")) {
      zipCode = component.long_name;
    } else if (types.includes("administrative_area_level_2")) {
      county = component.long_name;
    }
  });

  const fullAddress = `${streetNumber} ${route}`.trim();

  return {
    streetNumber,
    route,
    fullAddress,
    city,
    state,
    zipCode,
    county,
  };
};

/**
 * Check if address is in Massachusetts
 * @param {Array} addressComponents - Address components from Google Places API
 * @returns {Object} State check result with isInMA flag and actualState
 */
export const isAddressInMassachusetts = (addressComponents) => {
  let actualState = "";
  let isInMA = false;

  addressComponents.forEach((component) => {
    const types = component.types;
    if (types.includes("administrative_area_level_1")) {
      actualState = component.short_name;
      if (component.short_name === "MA") {
        isInMA = true;
      }
    }
  });

  return { isInMA, actualState };
};

/**
 * Match city name with address components
 * @param {string} inputCity - Input city name
 * @param {Array} addressComponents - Address components from Google Places API
 * @returns {boolean} True if city matches
 */
export const matchCity = (inputCity, addressComponents) => {
  if (!inputCity || !inputCity.trim()) return false;

  const inputCityLower = inputCity.toLowerCase().trim();
  let cityMatch = false;

  addressComponents.forEach((component) => {
    const types = component.types;
    if (types.includes("locality") || types.includes("administrative_area_level_2")) {
      const componentCity = component.long_name.toLowerCase();

      // Stricter city matching: require meaningful match
      if (inputCityLower.length >= 3) {
        if (
          componentCity === inputCityLower ||
          componentCity.startsWith(inputCityLower) ||
          inputCityLower.startsWith(componentCity) ||
          (componentCity.includes(inputCityLower) && inputCityLower.length >= 4)
        ) {
          cityMatch = true;
        }
      } else if (inputCityLower.length > 0) {
        // For very short inputs (1-2 chars), require exact match only
        if (componentCity === inputCityLower) {
          cityMatch = true;
        }
      }
    }
  });

  return cityMatch;
};

/**
 * Match ZIP code with address components
 * @param {string} inputZip - Input ZIP code
 * @param {Array} addressComponents - Address components from Google Places API
 * @returns {boolean} True if ZIP matches
 */
export const matchZip = (inputZip, addressComponents) => {
  if (!inputZip || !inputZip.trim()) return false;

  let zipMatch = false;

  addressComponents.forEach((component) => {
    const types = component.types;
    if (types.includes("postal_code")) {
      if (component.long_name === inputZip) {
        zipMatch = true;
      }
    }
  });

  return zipMatch;
};

/**
 * Match county name with address components
 * @param {string} inputCounty - Input county name
 * @param {Array} addressComponents - Address components from Google Places API
 * @returns {Object} County match result with match flag and county name
 */
export const matchCounty = (inputCounty, addressComponents) => {
  if (!inputCounty || !inputCounty.trim()) {
    // If no input county, try to extract county from components
    let extractedCounty = "";
    addressComponents.forEach((component) => {
      const types = component.types;
      if (types.includes("administrative_area_level_2")) {
        extractedCounty = component.long_name;
      }
    });
    return { countyMatch: false, county: extractedCounty };
  }

  const inputCountyLower = inputCounty.toLowerCase().trim();
  let countyMatch = false;
  let extractedCounty = "";

  addressComponents.forEach((component) => {
    const types = component.types;
    if (types.includes("administrative_area_level_2")) {
      extractedCounty = component.long_name;
      const componentCounty = component.long_name.toLowerCase();

      // Stricter county matching: require meaningful match
      if (inputCountyLower.length >= 3) {
        if (
          componentCounty === inputCountyLower ||
          componentCounty.startsWith(inputCountyLower) ||
          inputCountyLower.startsWith(componentCounty) ||
          (componentCounty.includes(inputCountyLower) && inputCountyLower.length >= 4)
        ) {
          countyMatch = true;
        }
      } else if (inputCountyLower.length > 0) {
        if (componentCounty === inputCountyLower) {
          countyMatch = true;
        }
      }
    }
  });

  return { countyMatch, county: extractedCounty };
};

/**
 * Validate address format (basic validation)
 * @param {string} address - Address string
 * @returns {boolean} True if address format is valid
 */
export const validateAddressFormat = (address) => {
  if (!address || typeof address !== "string") return false;
  return address.trim().length > 0;
};

/**
 * Format address for display
 * @param {Object} components - Address components object
 * @returns {string} Formatted address string
 */
export const formatAddressForDisplay = (components) => {
  const parts = [
    components.fullAddress || components.street1,
    components.city,
    components.state,
    components.zipCode || components.zip,
  ].filter(Boolean);

  return parts.join(", ");
};

