import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const useUserRole = (userId) => {
    const [role, setRole] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            console.log("userId:", userId);
            try {
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('roles(name)')
                    .eq('user_id', userId)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setRole(data.roles?.name);
                } else {
                    console.error("No data returned");
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        if (userId) {
            fetchUserRole();
        }
    }, [userId]);

    return role;
};

export default useUserRole;
