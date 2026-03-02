/**
 * Fetch old address data from v1 API
 * v1 has 63 provinces with old district names (quận/huyện)
 */

export interface OldAddressInfo {
    v1Province: string; // "Thành phố Hà Nội"
    v1District: string; // "Quận Hoàn Kiếm"
}

/**
 * Find old address (v1) by matching ward name
 * v2 ward names usually match v1 ward names
 * We search v1 districts to find which one contains this ward
 */
export async function findOldAddress(
    v2Ward: string,
    v2Province: string
): Promise<OldAddressInfo | null> {
    if (!v2Ward || !v2Province) {
        console.log('❌ Ward or province empty');
        return null;
    }

    console.log('🔍 Finding old address for ward:', v2Ward, 'in province:', v2Province);

    // Fetch v1 data with depth=3 to get wards inside districts
    try {
        const v1Data = await fetch('https://provinces.open-api.vn/api/v1/?depth=3')
            .then(r => r.json()) as any[];

        if (!Array.isArray(v1Data)) {
            console.warn('❌ Invalid v1 data');
            return null;
        }

        console.log('✅ Loaded v1 data with', v1Data.length, 'provinces');

        // Find v1 province by matching name (usually "Thành phố Hà Nội" matches "Hà Nội")
        const matchedV1Province = v1Data.find(
            (p) =>
                p.name.toLowerCase().includes(v2Province.toLowerCase()) ||
                v2Province.toLowerCase().includes(p.name.toLowerCase())
        );

        if (!matchedV1Province) {
            console.warn('❌ No matching v1 province for:', v2Province);
            return null;
        }

        console.log('✅ Found v1 province:', matchedV1Province.name);
        
        // Debug: log first few districts and their wards
        const sampleDistrict = matchedV1Province.districts?.[0];
        if (sampleDistrict) {
            console.log('📋 Sample district:', sampleDistrict.name, 'has', sampleDistrict.wards?.length || 0, 'wards');
            console.log('   Sample wards:', sampleDistrict.wards?.slice(0, 3).map((w: any) => w.name));
        }

        // Search through all districts to find which one has this ward
        for (const district of matchedV1Province.districts || []) {
            const wardList = district.wards || [];
            
            // Try exact match first
            let wardExists = wardList.some(
                (w: any) => w.name.toLowerCase() === v2Ward.toLowerCase()
            );
            
            // If not found, try partial match (keywords)
            if (!wardExists) {
                wardExists = wardList.some(
                    (w: any) => v2Ward.toLowerCase().includes(w.name.toLowerCase()) || 
                                w.name.toLowerCase().includes(v2Ward.toLowerCase())
                );
            }

            if (wardExists) {
                const result: OldAddressInfo = {
                    v1Province: matchedV1Province.name,
                    v1District: district.name,
                };
                console.log('✅ Found by ward match! Old address:', result);
                return result;
            }
        }

        // Ward not found - try matching by district name
        // Example: "Phường Hoàn Kiếm" → "Hoàn Kiếm" → "Quận Hoàn Kiếm"
        console.log('🔄 Ward not found by name, trying district name match...');
        
        // Extract district name from ward (remove Phường/Xã/Thị trấn prefix)
        const wardPrefixes = ['Phường', 'Xã', 'Thị trấn'];
        let districtNameCandidate = v2Ward;
        for (const prefix of wardPrefixes) {
            if (districtNameCandidate.startsWith(prefix)) {
                districtNameCandidate = districtNameCandidate.substring(prefix.length).trim();
                break;
            }
        }

        console.log('🎯 Extracted district name candidate:', districtNameCandidate);

        // Try to find v1 district that contains this name
        const matchedByDistrictName = matchedV1Province.districts?.find(
            (d: any) => d.name.toLowerCase().includes(districtNameCandidate.toLowerCase()) ||
                        districtNameCandidate.toLowerCase().includes(d.name.toLowerCase())
        );

        if (matchedByDistrictName) {
            const result: OldAddressInfo = {
                v1Province: matchedV1Province.name,
                v1District: matchedByDistrictName.name,
            };
            console.log('✅ Found by district name match! Old address:', result);
            return result;
        }

        // Not found - log all available wards for debugging
        console.warn('❌ Ward not found with any matching strategy:', v2Ward);
        console.log('📍 Available districts in', matchedV1Province.name + ':');
        matchedV1Province.districts?.forEach((d: any) => {
            const wardNames = d.wards?.map((w: any) => w.name).join(', ') || '';
            console.log('  -', d.name + ':', wardNames.substring(0, 100) + (wardNames.length > 100 ? '...' : ''));
        });
        
        return null;
    } catch (error) {
        console.error('❌ Error fetching v1 data:', error);
        return null;
    }
}
