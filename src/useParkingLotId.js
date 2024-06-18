// useParkingLotId.js
import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const useParkingLotId = (userId) => {
    const [parkingLotId, setParkingLotId] = useState(null);

    useEffect(() => {
        const fetchParkingLotId = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_info')
                    .select('parking_lot_id')
                    .eq('user_id', userId)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setParkingLotId(data.parking_lot_id);
                } else {
                    console.error("No data returned");
                }
            } catch (error) {
                console.error('Error fetching parking lot id:', error);
            }
        };

        if (userId) {
            fetchParkingLotId();
        }
    }, [userId]);

    return parkingLotId;
};

export default useParkingLotId;
