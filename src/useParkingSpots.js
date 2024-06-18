import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const useParkingSpots = (parkingLotId) => {
    const [parkingSpots, setParkingSpots] = useState(null);

    useEffect(() => {
        const fetchParkingSpots = async () => {
            try {
                const { data, error } = await supabase
                    .from('parking_info')
                    .select('parking_spots')
                    .eq('parking_lot_id', parkingLotId)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setParkingSpots(data.parking_spots);
                } else {
                    console.error("No data returned");
                }
            } catch (error) {
                console.error('Error fetching parking spots:', error);
            }
        };

        if (parkingLotId) {
            fetchParkingSpots();
        }
    }, [parkingLotId]);

    return parkingSpots;
};

export default useParkingSpots;