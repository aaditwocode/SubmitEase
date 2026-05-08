const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// 1. First, verify the user is logged in
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ message: "Access Denied: No token provided." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token." });
        req.user = user; // Attach the decoded user payload to the request
        next();
    });
};

// 2. Second, verify they have the required role (THE RBAC ENGINE)
const authorizeJournalRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id; // Comes from the decoded JWT
            
            // Extract the Journal ID
            const journalId = parseInt(req.params.journalId || req.body.journalId);

            if (!journalId) {
                return res.status(400).json({ message: "Journal ID is required for authorization." });
            }

            // Global Admin override (if they are a super-admin, let them through)
            if (req.user.isAdmin) {
                return next();
            }

            // Query Prisma for the user's specific assignment to THIS journal
            const assignment = await prisma.journalAssignment.findUnique({
                where: {
                    JournalId_UserId: { // Uses the composite unique key you defined!
                        JournalId: journalId,
                        UserId: userId
                    }
                }
            });

            // Check if the assignment exists AND if the array includes the required role
            if (!assignment || !assignment.role.includes(requiredRole)) {
                return res.status(403).json({ 
                    message: `RBAC Violation: You do not have '${requiredRole}' privileges for this specific journal.` 
                });
            }
            
            // If they have the correct role for this journal, let them proceed!
            next();
            
        } catch (error) {
            console.error("RBAC Error:", error);
            res.status(500).json({ message: "Internal server error during authorization check." });
        }
    };
};

module.exports = { authenticateToken, authorizeJournalRole };