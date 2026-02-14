/**
 * Delivery Validator Utility
 * Checks if a postal code is within the 5km delivery radius of the shop
 */

// Shop location: Tokyo Fashion Juhapura, Ahmedabad, Gujarat, India
// Approximate coordinates for Juhapura area
const SHOP_COORDINATES = {
    lat: 23.0116,
    lng: 72.5556
};

// Maximum delivery radius in kilometers
const MAX_DELIVERY_RADIUS_KM = 5;

// Serviceable pincodes within 5km of Juhapura (as fallback/whitelist)
const SERVICEABLE_PINCODES = new Set([
    "380055", // Juhapura
    "380051", // Sarkhej
    "380052", // Vejalpur
    "380058", // Satellite Road
    "380007", // Ambawadi
    "380015", // Vasna
    "380054", // Bodakdev
    "380059", // Jodhpur
    "380009", // Navrangpura
    "380006", // Paldi
]);

interface GeoLocation {
    lat: number;
    lng: number;
}

interface PincodeAPIResponse {
    Status: string;
    PostOffice?: Array<{
        Name: string;
        District: string;
        State: string;
        Pincode: string;
    }>;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(
    point1: GeoLocation,
    point2: GeoLocation
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) *
        Math.cos(toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Validate postal code format (6 digits for India)
 */
export function isValidPostalCode(postalCode: string): boolean {
    return /^\d{6}$/.test(postalCode);
}

/**
 * Check if a postal code is in the serviceable whitelist
 */
export function isInServiceableArea(postalCode: string): boolean {
    return SERVICEABLE_PINCODES.has(postalCode);
}

/**
 * Validate postal code using India Post API
 * @returns true if valid, false if invalid
 */
async function validatePincodeWithAPI(postalCode: string): Promise<boolean> {
    try {
        const response = await fetch(
            `https://api.postalpincode.in/pincode/${postalCode}`
        );

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data: PincodeAPIResponse[] = await response.json();

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
            // Check if the pincode is in Gujarat/Ahmedabad area
            const postOffice = data[0].PostOffice[0];
            return postOffice.State === "Gujarat" && postOffice.District === "Ahmedabad";
        }

        return false;
    } catch (error) {
        console.error("Pincode API error:", error);
        // Fall back to whitelist check
        return false;
    }
}

export interface DeliveryCheckResult {
    available: boolean;
    message: string;
    isChecking?: boolean;
}

/**
 * Check if delivery is available for a given postal code
 * Uses a combination of whitelist check and API validation
 */
export async function checkDeliveryAvailability(
    postalCode: string
): Promise<DeliveryCheckResult> {
    // Validate format first
    if (!isValidPostalCode(postalCode)) {
        return {
            available: false,
            message: "Please enter a valid 6-digit postal code"
        };
    }

    // Quick check: if in whitelist, delivery is available
    if (isInServiceableArea(postalCode)) {
        return {
            available: true,
            message: "Delivery available to your location"
        };
    }

    // For non-whitelisted pincodes, validate with API
    const isValidPincode = await validatePincodeWithAPI(postalCode);

    if (!isValidPincode) {
        return {
            available: false,
            message: "Delivery not available in this area. We currently deliver only within Ahmedabad city."
        };
    }

    // If it's a valid Ahmedabad pincode but not in our whitelist,
    // it might be outside our 5km radius
    return {
        available: false,
        message: "Sorry, we currently don't deliver to this pincode. We deliver only to select areas near Juhapura, Ahmedabad."
    };
}

/**
 * Get the list of serviceable pincodes (for display purposes)
 */
export function getServiceablePincodes(): string[] {
    return Array.from(SERVICEABLE_PINCODES).sort();
}
