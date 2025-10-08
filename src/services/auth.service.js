const AUTH_API_URL = "/api/Account";

// Mock data for simulation
const MOCK_USERS = [
    {
        id: 1,
        email: "admin@filir.com",
        password: "Admin@123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isEmailVerified: true,
        createdAt: "2024-01-01T00:00:00Z"
    },
    {
        id: 2,
        email: "user@filir.com", 
        password: "User@123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        isEmailVerified: true,
        createdAt: "2024-01-15T00:00:00Z"
    }
];

// Helper function to generate mock JWT token
const generateMockToken = (user) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa("mock-signature");
    return `${header}.${payload}.${signature}`;
};

// Helper function to simulate API delay
const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

// Helper function to check if email exists
const findUserByEmail = (email) => MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());

// Helper function to store auth data in localStorage
const storeAuthData = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('tokenExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
};

// Helper function to clear auth data from localStorage
const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('tokenExpiry');
};

// Helper function to get stored auth data
export const getStoredAuthData = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !userData || !tokenExpiry) {
        return null;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(tokenExpiry)) {
        clearAuthData();
        return null;
    }
    
    return {
        token,
        user: JSON.parse(userData)
    };
};

// Login method with mock implementation
export const login = async (data) => {
    try {
        await simulateApiDelay();
        
        const { email, password } = data;
        
        // Find user by email
        const user = findUserByEmail(email);
        
        if (!user) {
            return {
                isSuccess: false,
                msg: "Invalid email or password",
                statusCode: 401,
                data: null
            };
        }
        
        // Check password (in real app, this would be hashed)
        if (user.password !== password) {
            return {
                isSuccess: false,
                msg: "Invalid email or password", 
                statusCode: 401,
                data: null
            };
        }
        
        // Check if email is verified
        if (!user.isEmailVerified) {
            return {
                isSuccess: false,
                msg: "Please verify your email before logging in",
                statusCode: 403,
                data: null
            };
        }
        
        // Generate token
        const token = generateMockToken(user);
        
        // Prepare user data (exclude password)
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        };
        
        // Store auth data
        storeAuthData(token, userData);
        
        return {
            isSuccess: true,
            msg: "Login successful",
            statusCode: 200,
            data: {
                token,
                user: userData,
                expiresIn: 86400 // 24 hours in seconds
            }
        };
        
    } catch {
        return {
            isSuccess: false,
            msg: "Login failed. Please try again.",
            statusCode: 500,
            data: null
        };
    }
};

export const register = async (data) => {
    const res = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return res.json();
}