// backend/controllers/profileController.js
import { sql } from "../config/db.js";

// Get current user's full profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const user = await sql`
            SELECT id, username, first_name, last_name, country, university, biography, interests, academic_year, created_at
            FROM users 
            WHERE id = ${userId}
        `;

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user[0].id,
                username: user[0].username,
                firstName: user[0].first_name,
                lastName: user[0].last_name,
                country: user[0].country,
                university: user[0].university,
                biography: user[0].biography || '',
                interests: user[0].interests || [],
                academicYear: user[0].academic_year || 'Sophomore',
                createdAt: user[0].created_at
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { biography, country, university, interests, academicYear } = req.body;
        const userId = req.session?.user?.id;

        console.log('Update profile request:', {
            body: req.body,
            userId: userId,
            session: req.session
        });

        if (!userId) {
            console.log('No userId found in session');
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Update user profile
        console.log('Updating user profile with:', { biography, country, university, interests, academicYear, userId });
        
        const updatedUser = await sql`
            UPDATE users 
            SET biography = ${biography || ''}, 
                country = ${country}, 
                university = ${university},
                interests = ${interests || []},
                academic_year = ${academicYear || 'Sophomore'},
                updated_at = NOW()
            WHERE id = ${userId}
            RETURNING id, username, first_name, last_name, country, university, biography, interests, academic_year, created_at, updated_at
        `;
        
        console.log('Database update result:', updatedUser);

        if (updatedUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser[0].id,
                username: updatedUser[0].username,
                firstName: updatedUser[0].first_name,
                lastName: updatedUser[0].last_name,
                country: updatedUser[0].country,
                university: updatedUser[0].university,
                biography: updatedUser[0].biography || '',
                interests: updatedUser[0].interests || [],
                academicYear: updatedUser[0].academic_year || 'Sophomore',
                createdAt: updatedUser[0].created_at,
                updatedAt: updatedUser[0].updated_at
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
