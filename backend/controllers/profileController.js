// backend/controllers/profileController.js
import { sql } from "../config/db.js";

// Debug endpoint to check connections
export const debugConnections = async (req, res) => {
    try {
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const user = await sql`
            SELECT id, username, first_name, last_name, connections
            FROM users 
            WHERE id = ${userId}
        `;

        console.log('Debug connections for user', userId, ':', user);

        res.status(200).json({
            success: true,
            user: {
                id: user[0].id,
                username: user[0].username,
                firstName: user[0].first_name,
                lastName: user[0].last_name,
                connections: user[0].connections,
                connectionCount: (user[0].connections || []).length
            }
        });

    } catch (error) {
        console.error('Debug connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

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
            SELECT id, username, first_name, last_name, country, university, biography, interests, academic_year, major, looking_for, languages, connections, created_at
            FROM users 
            WHERE id = ${userId}
        `;

        console.log('Profile query result for user', userId, ':', user);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const connections = user[0].connections || [];
        const connectionCount = Array.isArray(connections) ? connections.length : 0;
        
        console.log('Raw connections from DB:', user[0].connections);
        console.log('Processed connections:', connections);
        console.log('Connection count:', connectionCount);

        const userData = {
            id: user[0].id,
            username: user[0].username,
            firstName: user[0].first_name,
            lastName: user[0].last_name,
            country: user[0].country,
            university: user[0].university,
            biography: user[0].biography || '',
            interests: user[0].interests || [],
            academicYear: user[0].academic_year || 'Freshman',
            major: user[0].major || 'Undeclared',
            lookingFor: user[0].looking_for || [],
            languages: user[0].languages || [],
            connections: connections,
            connectionCount: connectionCount,
            createdAt: user[0].created_at
        };

        console.log('Sending profile response:', userData);

        res.status(200).json({
            success: true,
            user: userData
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
        const { biography, country, university, interests, academicYear, major, lookingFor, languages } = req.body;
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
        console.log('=== PROFILE UPDATE DEBUG ===');
        console.log('Languages data received:', languages);
        console.log('Languages type:', typeof languages);
        console.log('Languages is array:', Array.isArray(languages));
        console.log('Full request body:', req.body);
        console.log('User ID:', userId);
        
        let updatedUser;
        try {
            console.log('Executing SQL query...');
            updatedUser = await sql`
                UPDATE users 
                SET biography = ${biography || ''}, 
                    country = ${country}, 
                    university = ${university},
                    interests = ${interests || []},
                    academic_year = ${academicYear || 'Freshman'},
                    major = ${major || 'Undeclared'},
                    looking_for = ${lookingFor || []},
                    languages = ${JSON.stringify(languages || [])},
                    updated_at = NOW()
                WHERE id = ${userId}
                RETURNING id, username, first_name, last_name, country, university, biography, interests, academic_year, major, looking_for, languages, connections, created_at, updated_at
            `;
            console.log('SQL query executed successfully');
        } catch (sqlError) {
            console.error('SQL Error:', sqlError);
            console.error('SQL Error message:', sqlError.message);
            console.error('SQL Error code:', sqlError.code);
            throw sqlError;
        }
        
        console.log('Database update result:', updatedUser);
        console.log('Updated languages from DB:', updatedUser[0]?.languages);

        if (updatedUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const connections = updatedUser[0].connections || [];
        const connectionCount = Array.isArray(connections) ? connections.length : 0;
        
        console.log('Update profile - Raw connections from DB:', updatedUser[0].connections);
        console.log('Update profile - Processed connections:', connections);
        console.log('Update profile - Connection count:', connectionCount);

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
                academicYear: updatedUser[0].academic_year || 'Freshman',
                major: updatedUser[0].major || 'Undeclared',
                lookingFor: updatedUser[0].looking_for || [],
                languages: updatedUser[0].languages || [],
                connections: connections,
                connectionCount: connectionCount,
                createdAt: updatedUser[0].created_at,
                updatedAt: updatedUser[0].updated_at
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
